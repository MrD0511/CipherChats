import { useState, useRef, useEffect } from 'react';
import '../chatPage.scss';
import axiosInstance from "../../../axiosInstance";
import { Image as ImageIcon, Send } from 'lucide-react';
import { useWebSocket } from '../../../websocketContext';
import { File, Headphones, FileVideo, X } from 'lucide-react';

type WebSocketContextType = {
    sendEvent: (event: any) => void;
    // add other properties if needed
};

type FileWithStatus = {
    file: File;
    uploading: boolean;
    error?: boolean;
};

export default function ChatInput({ userId, handleMessage, channel_id}
    : {
        userId: string;
        handleMessage: (message: string, type: string, fileName?: string, fileUrl?: string, fileSize?: number) => void;
        channel_id: string;
    }
) {
    
    const { sendEvent } = useWebSocket() as WebSocketContextType;
    const [inputValue, setInputValue] = useState<string>('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [files, setFiles] = useState<FileWithStatus[]>([]);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleSubmit = async () => {
        // Upload each file
        for (let i = 0; i < files.length; i++) {
            
            const file = files[i];
            if (file.file?.size > 10 * 1024 * 1024) { // 10 MB limit
                alert("File size exceeds the limit of 10MB");
                return;
            }

            setFiles(prev =>
                prev.map((f, idx) =>
                    idx === i ? { ...f, uploading: true } : f
                )
            );

            const formData = new FormData();
            formData.append("file", file.file);

            try {
                const response = await axiosInstance.post('file/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log(response.data);
                console.log("File type:", response.data.file_url, "File name:", file.file.name);
                handleMessage("file", file.file.type === "image/jpeg" ? "image" : file.file.type === "video/mp4" ? "video" : file.file.type === "audio/mpeg" ? "audio" : "file", file.file.name, response.data.file_url, file.file.size);
                setFiles(prev =>
                    prev.map((f, idx) =>
                        idx === i ? { ...f, uploading: false } : f
                    )
                );
            } catch (error) {
                console.error("Error uploading file:", error);
                setFiles(prev =>
                    prev.map((f, idx) =>
                        idx === i ? { ...f, uploading: false, error: true } : f
                    )
                );
            }
        }

        // Send text message if inputValue is not empty
        if (inputValue.trim() !== "") {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
            sendEvent({ event: "typing", recipient_id: userId, channel_id: channel_id });
            handleMessage(inputValue, 'text');
            setInputValue("");
        }

        // Clear file state after upload
        setFiles([]);
    }

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            handleSubmit();
        }
    };


    const userTyping = () => {

        if (!isTyping) {
            setIsTyping(true);
            sendEvent({ event: "typing", recipient_id: userId, channel_id : channel_id });
        }

        if (typingTimeout.current !== null) {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = setTimeout(() => {
            setIsTyping(false);
            sendEvent({ event: "stop_typing", recipient_id: userId, channel_id: channel_id });
        }, 2000);
    };

    return (
        <div className="chat-input flex flex-col gap-2">
            <div className={`w-full flex flex-col gap-2 overflow-x-auto ${files.length > 0 ? "max-h-[300px] h-full" : 'h-0'}`}>
                {files.map((file, index) => (
                    <div key={index} className="file-preview relative w-full lg:w-3/5">
                        <div className=' mt-1 mr-1 h-[80px] flex justify-start gap-4 items-center object-contain rounded-md p-4 bg-gray-800'>
                            <button className='absolute top-0 right-0 p-1' onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                                <X size={10} className="text-white" />
                            </button>
                            {file.file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file.file)} alt={`file-${index}`} className="file-image h-[80px] w-[80px] object-cover rounded" />
                            ) : (
                                file.file.type.startsWith('video/') ? (
                                    <FileVideo size={40} className="text-white" />
                                ) : (
                                    file.file.type.startsWith('audio/') ? (
                                        <Headphones size={40} className="text-white" />
                                    ) : (
                                        <File size={40} className="text-white" />
                                    )
                                )
                            )}
                            <div className='overflow-hidden text-ellipsis text-nowrap'>
                                <span className="file-name text-white">{file.file.name}</span>
                                <div className="text-gray-400">
                                    {(file.file?.size / 1024) > 1024 
                                    ? `${(file.file?.size / 1024 / 1024).toFixed(2)} MB`
                                    : `${(file.file?.size / 1024).toFixed(2)} KB`}
                                </div>
                                {file.uploading && (
                                    <div className="flex items-center gap-2 mt-1">
                                    <span className="text-blue-400 text-sm">Uploading...</span>
                                    <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                                        <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor" strokeWidth="4"
                                        fill="none"
                                        />
                                        <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className='flex items-center gap-2 w-full'>
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
                <button
                    className="upload-image p-3"
                    onClick={() => {
                        const fileInput = document.getElementById('file-input');
                        if (fileInput) {
                            fileInput.click();
                        }
                    }}
                >
                    <ImageIcon size={20} />
                </button>
                <button className="send-message p-3" onClick={() => { handleSubmit();  }}>
                    <Send size={20} />
                </button>
                <input
                    id="file-input"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                         if (e.target.files) {
                            const filesArray = Array.from(e.target.files).map(file => ({
                                file,
                                uploading: false,
                            }));
                            setFiles([...files, ...filesArray]);
                        }
                    }}
                />
            </div>
        </div>
    );
};