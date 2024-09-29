import React, { useState, useRef, useEffect } from 'react';
import './chatPage.scss';
import axiosInstance from "../../axiosInstance" 

const ChatPage = ({user_id, onCreateChat, onJoinChat}) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const textAreaRef = useRef(null);
    const chatBoxRef = useRef(null);
    const [ws, setWs] = useState(null)

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
            const response = await axiosInstance.get(`/chat/get_chat/${user_id}`);
            console.log(response)
        }

        fetch_details()

        let token = localStorage.getItem('access_token')

        const socket = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`)
        setWs(socket)

        socket.onopen = ()=>{
            console.log("websocket open")
        }

        socket.onmessage = (event)=>{
            const receivedMessage = event.data; // Assuming server sends a JSON object
            console.log(JSON.parse(receivedMessage))
            console.log(messages)
            setMessages([...messages, JSON.parse(receivedMessage)]);
            console.log(messages)
        }

        socket.onclose = () => {
            console.log("WebSocket disconnected.");
        };

        return () => {
            socket.close();
        };



    }, [user_id])

    useEffect(() => {
        // Auto-scroll to bottom when new messages are added
        const chatBox = chatBoxRef.current;
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }, [messages]); // Dependency array to trigger effect when messages change

    const handleMessage = () => {
        if (inputValue.trim() && ws) {

            const message = { text: inputValue };
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




    return user_id ? (
        <>
            <div className="chat-container">
                <div className='sender'>
                    <img src='/logo192.png'/>
                    <a>{user_id}</a>
                </div>
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((message, index) => (
                        <div key={index} className="message">
                            <strong>{message.sender}:</strong> 
                            <span className="message-text">
                                {renderMessageText(message.text)}
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