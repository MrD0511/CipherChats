import React, { useState } from 'react';
import './create_chat.scss';
import axiosInstance from '../../axiosInstance';

const CreateChatDialog = ({ isOpen, onClose, onConfirm }) => {
    const [generatedKey, setGeneratedKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false)

    const close = async () => {
        setGeneratedKey('')
        setLoading(false)
        setCopied(false)
        onClose()
    }

    if (!isOpen) return null;

    // Function to generate a key by making an API call
    const handleGenerateKey = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/chat/create');
            setGeneratedKey(response.data.key); // Assuming the response contains a key field
        } catch (error) {
            console.error('Error generating key:', error);
        }
        setLoading(false);
    };

    // Function to copy the key to clipboard
    const handleCopyKey = () => {
        navigator.clipboard.writeText(generatedKey);
        setCopied(true)
    };

    return (
        <div className="dialog-overlay">
            <div className="dialog-box">
                <h2>Create a New Chat</h2>

                {/* Generate Key Button */}
                {!generatedKey && 
                    <button 
                        onClick={handleGenerateKey} 
                        className="generate-key-btn"
                        disabled={loading}
                    >
                        {loading ? 'Generating Key...' : 'Generate Key'}
                    </button>
                }

                {/* Display generated key with copy option */}
                {generatedKey && (
                    <div className="generated-key-section">
                        <div className="generated-key-box">
                            <span>{generatedKey}</span>
                            {copied ? <button onClick={handleCopyKey} className="copied-key-btn">Copied!</button> : 
                            <button onClick={handleCopyKey} className="copy-key-btn">
                                Copy Key
                            </button>
                            }
                        </div>
                    </div>
                )}

                <p>Share this key with the person you want to chat with.</p>
                <div className='buttons'>
                    <button className='close-btn' onClick={close}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default CreateChatDialog;
