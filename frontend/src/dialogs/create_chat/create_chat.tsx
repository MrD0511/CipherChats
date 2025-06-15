import { Hash } from 'lucide-react';
import axiosInstance from '../../axiosInstance';
import { create_new_connection } from '../../e2eeManager';
import { useState } from 'react';

const CreateChatDialog = ({ isOpen, onClose, onConfirm }
    : {
        isOpen: boolean;
        onClose: () => void;
        onConfirm: () => void;
    }
) => {

    const [generatedKey, setGeneratedKey] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [note, setNote] = useState<string>('');
    const [error, setError] = useState<string>('');
    

    const close = async () => {
        setGeneratedKey('');
        setLoading(false);
        setCopied(false);
        setNote('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    // Function to generate a key by making an API call
    const handleGenerateKey = async () => {
        setLoading(true);
        if (!note.trim()) {
            setError('Please enter a note for the channel.');
            setLoading(false);
            return;
        }
        setError('');
        try {
            const response = await axiosInstance.post('/chat/create', {
                note: note
            });
            setGeneratedKey(response.data.key); // Assuming the response contains a key field
            await create_new_connection(response.data.channel_id)
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNote(e.target.value);
        if (error) {
            setError(''); // Clear error when user starts typing
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
            handleGenerateKey();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full p-6 relative">
                <h2 className="text-2xl font-bold text-white mb-6 text-center bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
                    Create a New Channel
                </h2>

                { !generatedKey && 
                    <div className="mb-8">
                        <label htmlFor="chatKey" className="block text-sm font-medium text-gray-300 mb-3">
                            Add note
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="chatKey"
                                placeholder="Enter channel key"
                                value={note}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                className={`w-full pl-4 pr-4 py-4 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    error 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-600 focus:border-violet-500 focus:ring-violet-500'
                                }`}
                                disabled={loading}
                            />
                        </div>
                    </div>
                }

                {/* Generate Key Button */}
                {!generatedKey && 
                    <button 
                        onClick={handleGenerateKey} 
                        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 mb-4 ${
                            loading 
                                ? 'bg-gray-600 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Key...
                            </span>
                        ) : 'Generate Key'}
                    </button>
                }

                {/* Display generated key with copy option */}
                {generatedKey && (
                    <div className="mb-4">
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-gray-300 font-mono text-sm break-all mr-3 flex-1">
                                {generatedKey}
                            </span>
                            <button 
                                onClick={handleCopyKey} 
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                    copied 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                                }`}
                            >
                                {copied ? 'Copied!' : 'Copy Key'}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-gray-400 text-center mb-6 text-sm">
                    Share this key with the person you want to chat with.
                </p>

                <div className="flex justify-center">
                    <button 
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                        onClick={close}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateChatDialog;