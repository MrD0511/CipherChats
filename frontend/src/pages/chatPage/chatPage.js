// ChatPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Image as ImageIcon, Send, ArrowLeft, Lock, Unlock } from 'lucide-react';
import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from '../../e2eeManager';
import EllipsisButton from './components/dropown';
import { db, getMessage, addMessage } from '../../indexdb.service';
import webSocketService from '../../websocket';

// Custom Hook for Encryption Management
const useEncryption = (channel_id, userId) => {
    const partner_public_key = useRef(null);
    const user_private_key = useRef(null);
    const isE2eeRef = useRef(false);  // Store the current E2EE state in a ref
    const [isE2ee, setIsE2ee] = useState(false);
    const [encryptionIntialized, setEncryptionInitialized] = useState(false);

    useEffect(() => {
        const initializeEncryption = async () => {
            try {
                const connectionKeys = await get_connection_keys(channel_id, userId);
                if (connectionKeys) {
                    partner_public_key.current = connectionKeys.partnerPublicKey;
                    user_private_key.current = connectionKeys.privateKey;
                } else {
                    user_private_key.current = await create_new_connection(channel_id);
                }
                setEncryptionInitialized((prevState)=>{
                    const newVal = !prevState;
                    return newVal;
                })
            } catch (error) {
                console.error("Error initializing encryption:", error);
            }
        };

        if (channel_id && userId) {
            initializeEncryption();
        }
    }, [channel_id, userId]);

    const send_enable_e2ee_req = async (channel_id, userId, newIsE2ee) => {
        try {
            const response = await axiosInstance.patch(`/enable_e2ee/${channel_id}`, { isE2ee: newIsE2ee });
            if (response.status === 200) {
                await db.isE2ee.update(channel_id, { isActive: newIsE2ee });
                if (newIsE2ee) {
                    const connectionKeys = await get_connection_keys(channel_id, userId);
                    partner_public_key.current = connectionKeys.partnerPublicKey;
                    user_private_key.current = connectionKeys.privateKey;
                }
            }
        } catch (error) {
            console.error("Error toggling E2EE:", error);
        }
    };

    const toggleEncryption = (remote=false) => {
        const newIsE2ee = !isE2ee;
        isE2eeRef.current = newIsE2ee; // Update the ref immediately
        setIsE2ee(newIsE2ee); // This triggers re-render but won't block the execution
        if(!remote){
            send_enable_e2ee_req(channel_id, userId, newIsE2ee);
        }
    };
    
    const handleRemoteE2eeToggle = async (e2eeFlag) => {
        isE2eeRef.current = e2eeFlag;
        setIsE2ee(e2eeFlag);
    }

    const encryptMessage = async (message) => {
        if (!isE2eeRef.current) return message;
        try {
            return await encrypt_message(partner_public_key.current, message);
        } catch (error) {
            console.error("Encryption error:", error);
            return message;
        }
    };

    const decryptMessage = async (message) => {
        if (!isE2eeRef.current) return message;
        try {
            return await decrypt_message(user_private_key.current, message);
        } catch (error) {
            console.error("Decryption error:", error);
            return message;
        }
    };

    return { isE2ee, encryptionIntialized, toggleEncryption, handleRemoteE2eeToggle,encryptMessage, decryptMessage };
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
            clearTimeout(typingTimeout.current);
            webSocketService.sendMessage({ event: "typing", recipient_id: userId })
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

    const statusMessage = (message) => {
        return (
            <>
                <div className='chat-status'>
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
                message.type === "status" ? statusMessage(message) :
                <div key={index} className={message?.sender_id === userId ? "messageSender" : "Mymessage"}>
                    <div className="message-content">
                        {renderMessageContent(message)}
                    </div>
                    <span className="timestamp">{renderTimestamp(message.timestamp)}</span>
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
    }, [userId, onChannel_id, navigate]);

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
                    setMessages((prev)=>[...prev, message])
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

    return {fetchMessages}

}

// Main ChatPage Component
const ChatPage = ({ onCreateChat, onJoinChat}) => {
    const [messages, setMessages] = useState([]);
    const { userId } = useParams();
    const [channelId, setChannelId] = useState('');
    const { isE2ee,encryptionIntialized, toggleEncryption, handleRemoteE2eeToggle, encryptMessage, decryptMessage } = useEncryption(channelId, userId);
    const [recipientTyping, setRecipientTyping] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Flag to prevent multiple message processing
    const [messageQueue, setMessageQueue] = useState([]); // Queue to hold messages
    const {fetchMessages} = FetchAllMessages({channel_id : channelId, setMessages})
    
    const handleIncomingMessages = useCallback(async (receivedMessage) => {
        receivedMessage.message = await decryptMessage(receivedMessage.message);
        receivedMessage.type = 'message';
        if (recipientTyping) setRecipientTyping(false);
        setMessages((messages) => [...messages, receivedMessage]);

        await addMessage(channelId, receivedMessage.message, receivedMessage.sender_id, receivedMessage.recipient_id, receivedMessage.timestamp, receivedMessage.type);
        
    }, [decryptMessage, recipientTyping, channelId]);

    const handleMessageQueue = useCallback(async () => {
        // Skip processing if already in progress or if the queue is empty
        if (isProcessing || !messageQueue.length) return;
  
        setIsProcessing(true);
        const message = messageQueue[0];
  
        try {
          if (message.message) {
            await handleIncomingMessages(message); // Decrypt if necessary
          } else if (message.isE2ee !== undefined) {
            await handleRemoteE2eeToggle(message.isE2ee); // Update encryption state
            setMessages((prev)=>[...prev,{"type" : "status", "message" : message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", "lock" : message.isE2ee }])
            await addMessage(channelId, message.isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", null, null, null, 'status')
          } else if (message.event) {
            setRecipientTyping(message.event === "typing"); // Immediate UI update
          }
        } catch (err) {
          console.error("Error processing queue:", err);
        } finally {
          // Remove the processed message from the queue and mark processing as done
          setMessageQueue((prevQueue) => prevQueue.slice(1));
          setIsProcessing(false);
        }
    },[handleIncomingMessages, handleRemoteE2eeToggle, isProcessing, messageQueue, channelId]);

    useEffect(() => {
        // Only trigger queue processing if encryption is initialized
        if (encryptionIntialized && messageQueue.length) {
          handleMessageQueue();
        }
      }, [encryptionIntialized, isProcessing, messageQueue, handleMessageQueue ]);
    
    useEffect(() => {
    // Set WebSocket message handler
    
    const handleWebSocketMessage = async (event) => {
        try {
        const receivedMessage = JSON.parse(event.data);
        
        setMessageQueue((prevQueue) => [...prevQueue, receivedMessage]);

        if (encryptionIntialized && !isProcessing) {
            handleMessageQueue();
        }
        } catch (error) {
        console.error("Error processing incoming WebSocket message:", error);
        }
    };

    webSocketService.socket.onmessage = handleWebSocketMessage;

    }, [ encryptionIntialized, isProcessing, messageQueue, handleMessageQueue ]);

    const handleMessage = async (inputValue) => {
        if (inputValue.trim()) {
            const timestamp = new Date().toISOString()
            const message = { message: inputValue, recipient_id: userId, timestamp : timestamp  };
            setMessages([...messages, message]);
            webSocketService.sendMessage({ message: await encryptMessage(inputValue), recipient_id: userId, timestamp: timestamp });
            await addMessage(channelId, inputValue, null, userId, timestamp, 'message')
        }
    };

    return userId ? (
        <div className="chat-container">
            <PartnerDetails userId={userId} isE2ee={isE2ee} toggleE2ee={()=>{
                toggleEncryption()
                setMessages((prev)=>[...prev,{"type" : "status", "message" : !isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", "lock" : !isE2ee }])
                addMessage(channelId, !isE2ee ? "End to end encryption Enabled" : "End to end encryption Disabled", null, null, null, 'status')
                }} onChannel_id={setChannelId} />
            <ChatBox messages={messages} recipientTyping={recipientTyping} userId={userId} fetchMessages={fetchMessages} />
            <ChatInput userId={userId} handleMessage={handleMessage} />
        </div>
    ) : (
        <div className="start-chat-container">
            <button className='start-chat-button' onClick={onCreateChat}>Create Channel</button>
            <button className='join-chat-button' onClick={onJoinChat}>Join Channel</button>
        </div>
    );
};

export default ChatPage;
