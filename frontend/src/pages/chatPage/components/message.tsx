import React from "react";
import { Video, File, Headphones, Download, Unlock, Lock } from "lucide-react";
import { Message as MessageType } from "../../../interfaces/Message";

export default function Message({
    message, 
    userId, 
    renderMessageContent, 
    renderTimestamp, 
    statusMessage
}: {
    message: MessageType,
    userId: string,
    renderMessageContent: (message: MessageType) => string | React.JSX.Element,
    renderTimestamp: (timestamp: string) => string | React.JSX.Element,
    statusMessage: (message: MessageType) => string | React.JSX.Element
}) {
    const isCurrentUser = message.sender_id === userId;

    const formatFileSize = (bytes: number) => {
        if (bytes / 1024 > 1024) {
            return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        }
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = message.file_url ?? "";
        link.download = message.file_name ?? "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderFileIcon = () => {
        const iconProps = { size: 36, className: "text-white flex-shrink-0" };
        
        switch (message.message_type) {
            case "video":
                return <Video {...iconProps} />;
            case "audio":
                return <Headphones {...iconProps} />;
            default:
                return <File {...iconProps} />;
        }
    };

    if (message.type !== "message") {
        return <div>{statusMessage(message)}</div>;
    }

    return (
        <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-3`}>
            <div className="flex items-end max-w-[75%] gap-2">
                {/* Message Bubble */}
                <div 
                    className={`
                        relative px-4 py-3 rounded-2xl shadow-sm
                        ${isCurrentUser 
                            ? "bg-gray-800 rounded-br-md" 
                            : "bg-violet-800 rounded-bl-md"
                        }
                    `}
                >
                    {/* Text Message */}
                    {message.message_type === "text" && (
                        <div className="text-white break-words">
                            {renderMessageContent(message)}
                        </div>
                    )}

                    {/* Image Message */}
                    {message.message_type === "image" && (
                        <div className="relative group rounded-lg overflow-hidden">
                            <img 
                                src={message.file_url} 
                                alt={message.file_name} 
                                className="max-w-full max-h-80 object-cover rounded-lg"
                            />
                            {/* Download overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <button
                                    onClick={handleDownload}
                                    className="
                                        p-3 bg-white/20 backdrop-blur-sm border-2 border-white/60 
                                        rounded-full hover:bg-white/30 hover:border-white 
                                        transition-all duration-200 active:scale-95
                                    "
                                    aria-label="Download image"
                                >
                                    <Download size={24} className="text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* File/Video/Audio Messages */}
                    {message.message_type !== "text" && message.message_type !== "image" && (
                        <div className="flex items-center gap-3 min-w-[220px] text-white">
                            {/* File Icon */}
                            <div className="flex-shrink-0">
                                {renderFileIcon()}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                    {message.file_name}
                                </div>
                                <div className="text-xs text-gray-300 mt-1">
                                    {formatFileSize(message.file_size ?? 0)}
                                </div>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="
                                    flex-shrink-0 p-2 border-2 border-white/60 
                                    rounded-full hover:border-white hover:bg-white/10 
                                    transition-all duration-200 active:scale-95
                                "
                                aria-label="Download file"
                            >
                                <Download size={18} className="text-white" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <div className={`
                    text-xs text-gray-400 whitespace-nowrap self-end mb-1
                    ${isCurrentUser ? "order-first mr-2" : "ml-2"}
                `}>
                    {renderTimestamp(message.timestamp)}
                </div>
            </div>
        </div>
    );
}