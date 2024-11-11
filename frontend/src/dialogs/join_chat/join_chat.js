import React, { useState } from 'react';
import './join_chat.scss'; // Make sure to create this SCSS file
import axiosInstance from '../../axiosInstance';
import { create_new_connection } from '../../e2eeManager';
import { db } from '../../indexdb.service';

const JoinChatDialog = ({ isOpen, onClose, onJoin }) => {
    const [chatKey, setChatKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Function to handle joining the chat
    const handleJoinChat = async () => {
        if (!chatKey) {
            setError('Please enter a channel key.');
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post('/chat/join', { key: chatKey });
            onJoin(response.data.user_id); 
            create_new_connection(response.data?.channel_id);
            await db.isE2ee.put({channel_id : response.data?.channel_id, isActive : false});
            onClose();
        } catch (error) {
            setError('Failed to join the channel. Please check the key.');
        }
        setLoading(false);
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-box">
                <h2>Join a Channel</h2>
                {error && <p className="error-message">{error}</p>}
                
                <input
                    type="text"
                    placeholder="Enter chat key"
                    value={chatKey}
                    onChange={(e) => setChatKey(e.target.value)}
                    className="chat-input"
                />
                
                <div className='btns'>
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
