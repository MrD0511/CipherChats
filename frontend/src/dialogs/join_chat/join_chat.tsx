import React, { useState } from 'react';
import { X, Hash, Users } from 'lucide-react';
import axiosInstance from '../../axiosInstance';
import { create_new_connection } from '../../e2eeManager';
import { db } from '../../indexdb.service';

const JoinChatDialog = ({ isOpen, onClose, onJoin }
    : {
        isOpen: boolean;
        onClose: () => void;
        onJoin: (userId: string) => void;
    }
) => {

    const [chatKey, setChatKey] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    if (!isOpen) return null;

    // Function to handle joining the chat
    const handleJoinChat = async () => {
        if (!chatKey.trim()) {
            setError('Please enter a channel key.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const response = await axiosInstance.post('/chat/join', { key: chatKey.trim() });
            onJoin(response.data.user_id); 
            create_new_connection(response.data?.channel_id);
            await db.isE2ee.put({channel_id : response.data?.channel_id, isActive : false});
            onClose();
            setChatKey(''); // Clear input on success
        } catch (error) {
            setError('Failed to join the channel. Please check the key.');
        }
        setLoading(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChatKey(e.target.value);
        if (error) {
            setError(''); // Clear error when user starts typing
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
            handleJoinChat();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div 
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 25% 25%, rgba(138, 43, 226, 0.1) 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, rgba(74, 144, 226, 0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '30px 30px'
                        }}
                    />
                </div>

                {/* Close button */}
                <button 
                    className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                <div className="relative p-6 pt-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Join a Channel</h2>
                        <p className="text-gray-400 text-sm">Enter the channel key to join an existing conversation</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Input Section */}
                    <div className="mb-8">
                        <label htmlFor="chatKey" className="block text-sm font-medium text-gray-300 mb-3">
                            Channel Key
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Hash className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="chatKey"
                                placeholder="Enter channel key"
                                value={chatKey}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                className={`w-full pl-12 pr-4 py-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    error 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-600 focus:border-violet-500 focus:ring-violet-500'
                                }`}
                                disabled={loading}
                            />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                            The channel key is provided by the channel creator
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-600 hover:border-gray-500"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleJoinChat}
                            disabled={loading || !chatKey.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-700 to-cyan-700 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Joining...
                                </div>
                            ) : (
                                'Join Channel'
                            )}
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <p className="text-gray-400 text-xs text-center">
                            Make sure you have the correct channel key from the channel creator
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinChatDialog;