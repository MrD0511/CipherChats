import React, { useState, useRef, useEffect } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance" 
import { useParams,Link, useNavigate } from 'react-router-dom'
import { User, Image as ImageIcon, Send, ArrowLeft } from 'lucide-react'
import { create_new_connection, decrypt_message, encrypt_message, get_connection_keys } from '../../e2eeManager';
import EllipsisButton from '../../components/dropown';
import { db } from '../../indexdb.service';

const ChatPage = ({onCreateChat, onJoinChat, socket}) => {
    
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const textAreaRef = useRef(null);
    const chatBoxRef = useRef(null);
    const fileInputRef = useRef(null);
    const [sender_details, setSender_details] = useState(null)
    const { userId } = useParams();
    const typingTimeout = useRef(null);
    const navigate = useNavigate();
    const partner_public_key = useRef(null);
    const user_private_key = useRef(null);
    const [channel_id, setChannel_id] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [recipientTyping, setRecipientTyping] = useState(false);
    const [isE2ee, setIsE2ee] = useState(false)

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        const fetchDetails = async () => {
            try{
                const response = await axiosInstance.get(`/chat/get_chat/${userId}`);
                setSender_details(response.data?.sender_details)
                setChannel_id(response.data?.channel_id)
            }catch(e){
                if(e.response.status === 404){
                    navigate("/404notFound")
                }
                navigate('/')
            }
        }

        if (userId) {
            fetchDetails()
        }

    }, [userId, navigate])

    const initialize_encryption = async (channel_id, userId) => {
        const connection_keys = await get_connection_keys(channel_id, userId)
        if(connection_keys){
            partner_public_key.current = connection_keys.partnerPublicKey
            user_private_key.current = connection_keys.privateKey
        }else{
            user_private_key.current = create_new_connection(channel_id)
        }
    }

    useEffect(()=>{
        const checkE2eeActive = async (channel_id) => {
            let isE2eeActive = await db.isE2ee.get(channel_id);
            if( isE2eeActive ){
                setIsE2ee(isE2eeActive?.isActive)
                const connection_keys = await get_connection_keys(channel_id, userId)
                if(connection_keys){
                    partner_public_key.current = connection_keys.partnerPublicKey
                    user_private_key.current = connection_keys.privateKey
                }else{
                    user_private_key.current = create_new_connection(channel_id)
                }
                return true;
            }else{
                await db.isE2ee.put({channel_id, isActive : false})
                return false
            }
        }
        if(channel_id && userId){
            checkE2eeActive(channel_id);
        }
    },[channel_id, userId])

    useEffect(() => {

    }, [user_private_key]);

    const toggleE2ee = async () => {
        if(!isE2ee){
            await initialize_encryption();
        }
        setIsE2ee(!isE2ee);
        await db.isE2ee.update(channel_id, {
            channel_id : channel_id,
            isActive : isE2ee
        })
    }

    const handleIncomingMessages = async (receivedMessage) => {
        // receivedMessage.message = await decrypt_message(user_private_key.current, receivedMessage.message)

        setMessages(messages => [...messages, receivedMessage])
    }

    useEffect(()=>{
        if(socket){
            socket.onmessage = (event) => {
                const receivedMessage = JSON.parse(event.data);
                if(receivedMessage.message){
                    handleIncomingMessages(receivedMessage)
                }
                else if(receivedMessage.event){
                    if(receivedMessage.event === "typing"){
                        setRecipientTyping(true)
                    }else{
                        setRecipientTyping(false)
                    }
                }
            }
        }
    },[socket])

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleMessage = async () => {
        if ((inputValue.trim() || imageFile) && socket) {
            
            let message = { message: inputValue, recipient_id: userId };

            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                
                try {
                    const response = await axiosInstance.post('/upload_image', formData);
                    message.image_url = response.data.image_url;
                } catch (error) {
                    console.error('Error uploading image:', error);
                    return;
                }
            }
            
            setMessages([...messages, message]);

            socket.send(JSON.stringify({ event : "stop_typing", recipient_id : userId}))
            
            try {
                // const encryptedMessage = await encrypt_message(partner_public_key.current, message.message); 
                socket.send(JSON.stringify({ message: message.message, recipient_id: message.recipient_id }));
            } catch (error) {
                console.error('Error encrypting message:', error);
                alert('Failed to send message. Please try again.'); // User feedback
                return;
            }
            setInputValue('');
            setImageFile(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage();
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    const renderMessageContent = (message) => (
        <>
            {message.image_url && (
                <img src={message.image_url} alt="Uploaded" className="message-image" />
            )}
            {message.message && (
                <span className="message-text">
                    {message.message.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            {index < message.message.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </span>
            )}
        </>
    );

    const userTyping = () => {
        if(!isTyping && socket){
            setIsTyping(true)
            socket.send(JSON.stringify({ event: "typing", recipient_id: userId}));
        }

        if(typingTimeout.current){
            clearTimeout(typingTimeout.current);
        }
        
        typingTimeout.current = setTimeout(() => {
            setIsTyping(false)
            console.log("here")
            if(socket){
                socket.send(JSON.stringify({ event : "stop_typing" , recipient_id : userId }))
            }
        }, 2000); // Send typing event after 1s of inactivity
    }

    return userId != null ? (
        <div className="chat-container">
            <div className='sender'>
                <div className='details' >
                    <Link to='/' className='back-button' onClick={()=>{
                        setInputValue("")
                    }}>
                        <ArrowLeft />
                    </Link>
                    {sender_details?.profile_photo_url ? 
                        <img src={sender_details?.profile_photo_url} alt={sender_details.username} /> 
                        : <User className="user-icon" />
                    }
                    <span>{sender_details?.name}</span>
                </div>
                <div className='options'>
                    <EllipsisButton toggleE2ee={()=>{
                            toggleE2ee()
                            console.log("toggling")
                        }
                    } 
                    isE2ee={isE2ee}
                    />
                </div>
            </div>
            <div className="chat-box" ref={chatBoxRef}>

                {messages.map((message, index) => (
                    <div key={index} className={message?.sender_id?.$oid === userId || message?.sender_id === userId ? "messageSender" : "Mymessage"}>
                        <div className="message-content">
                            {renderMessageContent(message)}
                        </div>
                    </div>
                ))}
                {recipientTyping && (
                    <div className="messageSender typing-indicator">
                        typing...
                    </div> 
                )}
            </div>
            <div className="chat-input">
                <textarea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value)
                        userTyping()
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                />
                <button className="upload-image" onClick={() => fileInputRef.current.click()}>
                    <ImageIcon size={20} />
                </button>
                <button className="send-message" onClick={handleMessage}>
                    <Send size={20} />
                </button>
            </div>
            {imageFile && (
                <div className="image-preview">
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                    <button onClick={() => setImageFile(null)}>Remove</button>
                </div>
            )}
        </div>
    ) : (            
        <div className="start-chat-container">
            <button className="start-chat-button" onClick={onCreateChat}>
                Create Channel
            </button>
            <button className="join-chat-button" onClick={onJoinChat}>
                Join Channel
            </button>
        </div>
    );
};

export default ChatPage;