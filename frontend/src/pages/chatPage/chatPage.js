// ChatPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Image as ImageIcon, Send, ArrowLeft } from 'lucide-react';
import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from '../../e2eeManager';
import EllipsisButton from '../../components/dropown';
import { db } from '../../indexdb.service';
import webSocketService from '../../websocket';
// Custom Hook for Encryption Management
const useEncryption = (channel_id, userId) => {
    const partner_public_key = useRef(null);
    const user_private_key = useRef(null);
    const [isE2ee, setIsE2ee] = useState(false);

    useEffect(() => {
        const initializeEncryption = async () => {
            const connectionKeys = await get_connection_keys(channel_id, userId);
            if (connectionKeys) {
                partner_public_key.current = connectionKeys.partnerPublicKey;
                user_private_key.current = connectionKeys.privateKey;
            } else {
                user_private_key.current = create_new_connection(channel_id);
            }
        };

        if (channel_id && userId) {
            initializeEncryption();
        }
    }, [channel_id, userId]);

    const toggleEncryption = async () => {
        setIsE2ee(prev => !prev);
        const response = await axiosInstance.patch(`/enable_e2ee/${channel_id}`, { isE2ee: !isE2ee });
        if (response.status === 200) {
            await db.isE2ee.update(channel_id, { isActive: !isE2ee });
            if (!isE2ee) {
                let connection_keys = await get_connection_keys(channel_id, userId);
                partner_public_key.current = connection_keys.partnerPublicKey
                user_private_key.current = connection_keys.privateKey
            }
        }
    };

    return { isE2ee, toggleEncryption, partner_public_key, user_private_key };
};

// ChatInput Component
const ChatInput = ({ userId, handleMessage}) => {
    const [inputValue, setInputValue] = useState('');
    const textAreaRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeout = useRef(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage(inputValue);
            setInputValue("");
        }
    };

    const userTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            webSocketService.sendMessage({ event: "typing", recipient_id: userId });
        }

        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            setIsTyping(false);
            webSocketService.sendMessage({ event: "stop_typing", recipient_id: userId });
        }, 2000);
    };

    return (
        <div className="chat-input">
            <textarea
                ref={textAreaRef}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    userTyping();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
            />
            <button className="upload-image"><ImageIcon size={20} /></button>
            <button className="send-message" onClick={() => { handleMessage(inputValue); setInputValue("") }}>
                <Send size={20} />
            </button>
        </div>
    );
};

// ChatBox Component
const ChatBox = ({ userId, messages, recipientTyping }) => {
    const chatBoxRef = useRef(null);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const renderMessageContent = (message) => (
        <>
            {message.image_url && <img src={message.image_url} alt="Uploaded" className="message-image" />}
            {message.message && <span className="message-text">{message.message.split('\n').map((line, index) => (
                <React.Fragment key={index}>{line}{index < message.message.split('\n').length - 1 && <br />}</React.Fragment>
            ))}</span>}
        </>
    );

    return (
        <div className="chat-box" ref={chatBoxRef}>
            {messages.map((message, index) => (
                <div key={index} className={message?.sender_id?.$oid === userId ? "messageSender" : "Mymessage"}>
                    <div className="message-content">{renderMessageContent(message)}</div>
                </div>
            ))}
            {recipientTyping && <div className="messageSender typing-indicator">typing...</div>}
        </div>
    );
};

// PartnerDetails Component
const PartnerDetails = ({ userId, toggleE2ee, isE2ee, onChannel_id }) => {
    const [senderDetails, setSenderDetails] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axiosInstance.get(`/chat/get_chat/${userId}`);
                setSenderDetails(response.data?.sender_details);
                onChannel_id(response.data?.channel_id);
            } catch (e) {
                if (e.response.status === 404) navigate("/404notFound");
                else navigate('/');
            }
        };
        if (userId) fetchDetails();
    }, [userId]);

    return (
        <div className='sender'>
            <div className='details'>
                <Link to='/' className='back-button'><ArrowLeft /></Link>
                {senderDetails?.profile_photo_url ? <img src={senderDetails?.profile_photo_url} alt={senderDetails.username} /> : <User className="user-icon" />}
                <span>{senderDetails?.name}</span>
            </div>
            <div className='options'>
                <EllipsisButton toggleE2ee={toggleE2ee} isE2ee={isE2ee} />
            </div>
        </div>
    );
};

// Main ChatPage Component
const ChatPage = ({ onCreateChat, onJoinChat}) => {
    const [messages, setMessages] = useState([]);
    const { userId } = useParams();
    const [channelId, setChannelId] = useState('');
    const { isE2ee, toggleEncryption, partner_public_key, user_private_key } = useEncryption(channelId, userId);
    const [recipientTyping, setRecipientTyping] = useState(false);

    const handleIncomingMessages = async (receivedMessage) => {
        if (isE2ee && receivedMessage.message) {
            receivedMessage.message = await decrypt_message(user_private_key.current, receivedMessage.message);
        }
        setMessages(messages => [...messages, receivedMessage]);
    };

    useEffect(() => {
        
        webSocketService.socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            if (receivedMessage.message) handleIncomingMessages(receivedMessage);
            else if (receivedMessage.isE2ee !== undefined) toggleEncryption();
            else if (receivedMessage.event) setRecipientTyping(receivedMessage.event === "typing");
        };
        
    }, [webSocketService.socket]);

    const handleMessage = async (inputValue) => {
        if (inputValue.trim()) {
            const message = { message: inputValue, recipient_id: userId };
            setMessages([...messages, message]);
            webSocketService.sendMessage({ message: isE2ee ? await encrypt_message(partner_public_key.current, inputValue) : inputValue, recipient_id: userId });
        }
    };

    return userId ? (
        <div className="chat-container">
            <PartnerDetails userId={userId} isE2ee={isE2ee} toggleE2ee={toggleEncryption} onChannel_id={setChannelId} />
            <ChatBox messages={messages} recipientTyping={recipientTyping} userId={userId} />
            <ChatInput userId={userId} handleMessage={handleMessage} />
        </div>
    ) : (
        <div className="start-chat-container">
            <button onClick={onCreateChat}>Create Channel</button>
            <button onClick={onJoinChat}>Join Channel</button>
        </div>
    );
};

export default ChatPage;
