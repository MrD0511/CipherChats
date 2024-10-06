import React, { useState, useRef, useEffect } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance" 
import { useParams,Link } from 'react-router-dom'
import { User, Image as ImageIcon, Send, ArrowLeft, EllipsisVertical } from 'lucide-react'

const ChatPage = ({onCreateChat, onJoinChat}) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const textAreaRef = useRef(null);
    const chatBoxRef = useRef(null);
    const fileInputRef = useRef(null);
    const [ws, setWs] = useState(null)
    const [sender_details, setSender_details] = useState(null)
    const { userId } = useParams();

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        const fetchDetails = async () => {
            const response = await axiosInstance.get(`/chat/get_chat/${userId}`);
            setSender_details(response.data?.sender_details)
            setMessages(response.data?.chat)
        }

        if (userId) {
            fetchDetails()
        }

        const token = localStorage.getItem('access_token')
        const socket = new WebSocket(`ws://kychat.onrender.com/ws/chat?token=${token}`)
        setWs(socket)

        socket.onopen = () => console.log("WebSocket connected")
        socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            setMessages(messages => [...messages, receivedMessage])
        }
        socket.onclose = () => console.log("WebSocket disconnected");

        return () => socket.close();
    }, [userId])

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleMessage = async () => {
        if ((inputValue.trim() || imageFile) && ws) {
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

            ws.send(JSON.stringify(message))
            setMessages([...messages, message]);
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

    return userId != null ? (
        <div className="chat-container">
            <div className='sender'>
                <div className='details' >
                    <Link to='/' className='back-button'>
                        <ArrowLeft />
                    </Link>
                    {sender_details?.profile_photo_url ? 
                        <img src={sender_details?.profile_photo_url} alt={sender_details.username} /> 
                        : <User className="user-icon" />
                    }
                    <span>{sender_details?.name}</span>
                </div>
                <div className='options'>
                    <EllipsisVertical />
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
            </div>
            <div className="chat-input">
                <textarea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
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
                Create Chat
            </button>
            <button className="join-chat-button" onClick={onJoinChat}>
                Join Chat
            </button>
        </div>
    );
};

export default ChatPage;