import React, { useState } from 'react';
import './join_chat.scss'; // Make sure to create this SCSS file
import axiosInstance from '../../axiosInstance';

const JoinChatDialog = ({ isOpen, onClose, onJoin }) => {
    const [chatKey, setChatKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Function to handle joining the chat
    const handleJoinChat = async () => {
        if (!chatKey) {
            setError('Please enter a chat key.');
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('/chat/join', { key: chatKey });
            // Handle successful join, e.g., call onJoin prop with response data
            onJoin(response.data.user_id); 
            onClose(); // Close the dialog after joining
        } catch (error) {
            setError('Failed to join the chat. Please check the key.');
        }
        setLoading(false);
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-box">
                <h2>Join a Chat</h2>
                {error && <p className="error-message">{error}</p>}
                
                <input
                    type="text"
                    placeholder="Enter chat key"
                    value={chatKey}
                    onChange={(e) => setChatKey(e.target.value)}
                    className="chat-input"
                />
                
                <div className='buttons'>
                    <button
                        onClick={handleJoinChat}
                        className="btn"
                        disabled={loading}
                    >
                        {loading ? 'Joining...' : 'Join'}
                    </button>
                    
                    <button onClick={onClose} className="btn cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinChatDialog;
