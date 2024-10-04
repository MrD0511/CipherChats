import React, { useState, useRef, useEffect } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance" 
import { useParams } from 'react-router-dom'

const ChatPage = ({onCreateChat, onJoinChat}) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const textAreaRef = useRef(null);
    const chatBoxRef = useRef(null);
    const [ws, setWs] = useState(null)
    const [sender_details, setSender_details] = useState(null)
    const { userId } = useParams();

    useEffect(() => {
        // Adjust textarea height on input change
        const textArea = textAreaRef.current;
        if (textArea) {
            textArea.style.height = 'auto'; // Reset height
            textArea.style.height = `${textArea.scrollHeight}px`; // Set new height based on content
        }
    }, [inputValue]);

    useEffect(()=>{

        const fetch_details = async () => {
            const response = await axiosInstance.get(`/chat/get_chat/${userId}`);
            setSender_details(response.data?.sender_details)
            setMessages(response.data?.chat)
        }


        if(userId){
            fetch_details()
        }

        let token = localStorage.getItem('access_token')

        const socket = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`)
        setWs(socket)

        socket.onopen = ()=>{
            console.log("websocket open")
        }

        socket.onmessage = (event)=>{
            const receivedMessage = event.data;
            setMessages(messages => [...messages, JSON.parse(receivedMessage)])
        }

        socket.onclose = () => {
            console.log("WebSocket disconnected.");
        };

        return () => {
            socket.close();
        };



    }, [userId])

    useEffect(() => {
        // Auto-scroll to bottom when new messages are added
        const chatBox = chatBoxRef.current;
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }, [messages]); // Dependency array to trigger effect when messages change

    const handleMessage = () => {
        if (inputValue.trim() && ws) {

            const message = { message: inputValue, recipient_id : userId };
            ws.send(JSON.stringify(message))
            setMessages([...messages, message]);
            setInputValue(''); // Clear the input field
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessage();
        }
    };

    const handleTextChange = (e) => {
        setInputValue(e.target.value);
    };

    const renderMessageText = (text) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };




    return userId != null ? (
        <>
            <div className="chat-container">
                <div className='sender'>
                    <img src='/logo192.png'/>
                    <a>{sender_details?.username}</a>
                </div>
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((message, index) => (
                        message?.sender_id?.$oid == userId || message?.sender_id == userId ? <div key={index} className="messageSender">
                            <span className="message-text">
                                {renderMessageText(message.message)}
                            </span>
                        </div> :

                        <div key={index} className="Mymessage">
                            <span className="message-text">
                                {renderMessageText(message.message)}
                            </span>
                        </div>

                    ))}
                </div>
                <div className="chat-input">
                    <textarea
                        ref={textAreaRef}
                        value={inputValue}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                    />
                    <button onClick={handleMessage}>Send</button>
                </div>
            </div>
        </>
    ) : (            
        <div className="start-chat-container">
            <button className="start-chat-button"onClick={()=>onCreateChat()}>
                Create Chat
            </button>
            <button className="join-chat-button" onClick={()=>onJoinChat()}>
                Join Chat
            </button>
        </div>
    );
};

export default ChatPage;