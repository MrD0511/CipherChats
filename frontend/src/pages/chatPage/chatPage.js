// ChatPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance";
import { Link, useNavigate } from 'react-router-dom';
import { User, Image as ImageIcon, Send, ArrowLeft, Lock, Unlock } from 'lucide-react';
// import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from '../../e2eeManager';
import EllipsisButton from './components/dropown';
import {  getMessage, addMessage } from '../../indexdb.service';
import { useWebSocket } from '../../websocketContext';


// ChatInput Component
const ChatInput = ({ userId, handleMessage, channel_id}) => {
    const [inputValue, setInputValue] = useState('');
    const textAreaRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeout = useRef(null);
    const {sendEvent} = useWebSocket();

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            clearTimeout(typingTimeout.current);
            sendEvent({ event: "typing", recipient_id: userId, channel_id: channel_id });
            handleMessage(inputValue);
            setInputValue("");
        }
    };
    

    const userTyping = () => {

        if (!isTyping) {
            setIsTyping(true);
            sendEvent({ event: "typing", recipient_id: userId, channel_id : channel_id });
        }

        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            setIsTyping(false);
            sendEvent({ event: "stop_typing", recipient_id: userId, channel_id: channel_id });
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
const ChatBox = ({ userId, messages, recipientTyping, fetchMessages }) => {
    const chatBoxRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);


    const handleScroll = useCallback( async () => {
        const chatbox = chatBoxRef.current;
        if(chatbox.scrollTop === 0 && !loading){
            setLoading(true);
            const isFinished = await fetchMessages();
            if(!isFinished){
                setFinished(true);
            }
            setLoading(false);
        }
    },[setLoading, fetchMessages, loading, setFinished])

    useEffect(() => {
        const chatBox = chatBoxRef.current;
        if(!finished){
            chatBox.addEventListener('scroll', handleScroll);
        }
    
        return () => {
          chatBox.removeEventListener('scroll', handleScroll); // Clean up the event listener
        };
      }, [messages, loading, handleScroll, finished]); // Only re-attach when messages or loading state change

    const renderTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return date.toLocaleTimeString([], options);
    }

    const renderMessageContent = (message) => (
        <>
            {message.message && <span className="message-text">{message.message.split('\n').map((line, index) => (
                <React.Fragment key={index}>{line}{index < message.message.split('\n').length - 1 && <br />}</React.Fragment>
            ))}</span>
            }
        </>
    );

    const statusMessage = (message, index) => {
        return (
            <>
                <div className='chat-status' key={index}>
                    {
                        message.lock ? <span><Lock className='icon'/> {message.message}</span> : <span><Unlock className='icon'/> {message.message}</span>
                    }
                </div>
            </>
        )
    }
    
    return (    
        <div className="chat-box" ref={chatBoxRef}>
            {messages.map((message, index) => (
                message.type === "status" ? statusMessage(message, index) : (
                    <div key={index} className={message?.sender_id === userId ? "messageSender" : "Mymessage"}>
                        <div className="message-content">
                            {renderMessageContent(message)}
                        </div>
                        <span className="timestamp">{renderTimestamp(message.timestamp)}</span>
                    </div>
                )
            ))}
            {recipientTyping && <div className="messageSender typing-indicator">typing...</div>}
        </div>
    );
};

// PartnerDetails Component
const PartnerDetails = ({ userId, onChannel_id, addE2eeStatus }) => {
    const [senderDetails, setSenderDetails] = useState(null);
    const navigate = useNavigate();
    const { activeChannel } = useWebSocket();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                await axiosInstance.get(`/chat/get_chat/${userId}`).then((response)=>{
                    setSenderDetails(response.data?.sender_details);
                    onChannel_id(response.data?.channel_id);
                    activeChannel.current = response.data?.channel_id;
                }).catch((e)=>{
                    if (e.status === 404) navigate("/404notFound");
                });
            } catch (e) {
                console.log(e);
            }
        };
        if (userId) fetchDetails();
    }, [userId, onChannel_id, navigate, activeChannel ]);

    return (
        <div className='sender'>
            <div className='details'>
                <Link to='/' className='back-button'><ArrowLeft /></Link>
                {senderDetails?.profile_photo_url ? <img src={senderDetails?.profile_photo_url} alt={senderDetails.username} /> : <User className="user-icon" />}
                <span>{senderDetails?.name}</span>
            </div>
            <div className='options'>
                <EllipsisButton addStatus={ (status) => { addE2eeStatus(status) } } userId={userId} />
            </div>
        </div>
    );
};

const FetchAllMessages = ({channel_id,setMessages}) => {
    const [paginationNumber, setPaginationNumber] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const fetchMessages = useCallback(async () => {
        if(isLoading) return;

        setIsLoading(true);

        try{
            const prevMessages = await getMessage(channel_id, 10, paginationNumber);
            if(prevMessages.length !== 0){
                prevMessages.map(async (message) => {
                    setMessages((prev)=>[ message, ...prev])
                })
                setPaginationNumber((prev)=>prev+1)
            }else{
                return false;
            }
        }catch(err){
            console.error("error fetching messages : ",err)
        }finally{
            setIsLoading(false);
        }

        return 

    },[channel_id, setMessages, isLoading, paginationNumber]);

    useEffect(()=>{
        if(channel_id && firstLoad){
            fetchMessages()
            setFirstLoad(false);
        }
    }, [fetchMessages, channel_id, setFirstLoad, firstLoad])

    return {setFirstLoad, fetchMessages}

}

// Main ChatPage Component
const ChatPage = ({userId}) => {

    const [messages, setMessages] = useState([]);
    const [channelId, setChannelId] = useState('');
    const [recipientTyping, setRecipientTyping] = useState(false);
    const { messageEmmiter, sendMessage } = useWebSocket()
    const { fetchMessages } = FetchAllMessages({ channel_id: channelId, setMessages });

    useEffect(() => {
    
        const handleIncomingMessages = (data) => {
            if (data.type === 'message'|| data.type === 'status') {
                setRecipientTyping(false);
                setMessages((prev) => [...prev, data]);
            }
        };
    
        // Add the listener
        messageEmmiter.on('onMessage', handleIncomingMessages);
        messageEmmiter.on('onEvent', (data)=>{
            if(data.event === "typing"){
                setRecipientTyping(true);
            }else if(data.event === "stop_typing"){
                setRecipientTyping(false);
            }
        })
        // Cleanup the listener on unmount or when `channelId` changes
        return () => {
            messageEmmiter.off('onMessage', handleIncomingMessages);
            messageEmmiter.off('onEvent', (data)=>{
                if(data.event === "typing"){
                    setRecipientTyping(true);
                }else if(data.event === "stop_typing"){
                    setRecipientTyping(false);
                }
            })
        };
    }, [channelId, messageEmmiter, setRecipientTyping]); // Re-run only when `channelId` changes
    

    const handleMessage = async (inputValue) => {
        if (inputValue.trim()) {
            const timestamp = new Date().toISOString();
            const message = { message: inputValue, recipient_id: userId, timestamp: timestamp };
            setMessages((prevMessages) => [...prevMessages, message]);
            sendMessage(inputValue, userId, timestamp, channelId );
            await addMessage(channelId, inputValue, null, userId, timestamp, 'message');
        }
    };

    const addE2eeStatus = async (status) => {
        setMessages([...messages, { message : status, type: 'status', timestamp: new Date().toISOString() }])
    }

    return (
        <div className="chat-container">
            <PartnerDetails
                userId={userId}
                onChannel_id={setChannelId}
                addE2eeStatus={(status) =>{  addE2eeStatus(status) }}
            />
            <ChatBox
                key={userId}
                messages={messages}
                recipientTyping={recipientTyping}
                userId={userId}
                fetchMessages={fetchMessages}
                setMessages={setMessages}
            />
            <ChatInput userId={userId} handleMessage={handleMessage} channel_id={channelId} />
        </div>
    );
};

export default ChatPage;
