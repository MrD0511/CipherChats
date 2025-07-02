import React from "react";
import { Video, File, Headphones, Download, Unlock, Lock, Reply } from "lucide-react";
import { Message as MessageType } from "../../../interfaces/Message";

export default function Message({
    message, 
    userId, 
    renderMessageContent, 
    renderTimestamp, 
    statusMessage,
    setReplyingMessage
}: {
    message: MessageType,
    userId: string,
    renderMessageContent: (message: MessageType) => string | React.JSX.Element,
    renderTimestamp: (timestamp: string) => string | React.JSX.Element,
    statusMessage: (message: MessageType) => string | React.JSX.Element,
    setReplyingMessage: (replyingMessage: MessageType | null) => void
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

    const handleReply = () => {
        setReplyingMessage(message);
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
        <div className={`flex ${isCurrentUser ? "justify-start" : "justify-end"} mb-3`}>
            <div className="flex items-end gap-2">
                {/* Timestamp */}
                <div className={`
                    text-xs text-gray-400 whitespace-nowrap self-end mb-1
                    ${isCurrentUser ? "order-last mr-2" : "ml-2"}
                `}>
                    {renderTimestamp(message.timestamp)}
                </div>
                {/* Message Bubble */}
                <div className="relative group">
                    <div 
                        className={`
                            relative px-4 py-3 rounded-2xl shadow-lg border
                            ${isCurrentUser 
                                ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 rounded-bl-md" 
                                : "bg-gradient-to-r from-violet-700 to-cyan-700 border-violet-500 rounded-br-md"
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
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const errorDiv = target.nextElementSibling as HTMLElement;
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                    }}
                                />
                                {/* Error fallback */}
                                <div className="hidden items-center justify-center min-h-[120px] bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-500">
                                    <div className="text-center text-gray-300">
                                        <File size={32} className="mx-auto mb-2" />
                                        <div className="text-sm font-medium">Image failed to load</div>
                                        <div className="text-xs text-gray-400 mt-1">{message.file_name}</div>
                                    </div>
                                </div>
                                {/* Download overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <button
                                        onClick={handleDownload}
                                        className="
                                            p-3 bg-gradient-to-r from-violet-600/80 to-cyan-600/80 backdrop-blur-sm border-2 border-violet-400/60 
                                            rounded-full hover:from-violet-500/90 hover:to-cyan-500/90 hover:border-cyan-400 
                                            transition-all duration-200 active:scale-95 shadow-lg
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
                            <div className="flex items-center gap-3 w-[260px] text-white overflow-hidden">
                                {/* File Icon */}
                                <div className="flex-shrink-0">
                                    {renderFileIcon()}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <div className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">
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
                                        flex-shrink-0 p-2 border-2 border-violet-400/60 
                                        rounded-full hover:border-cyan-400 hover:bg-gradient-to-r hover:from-violet-600/20 hover:to-cyan-600/20 
                                        transition-all duration-200 active:scale-95 shadow-md
                                    "
                                    aria-label="Download file"
                                >
                                    <Download size={18} className="text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Reply Button - appears on hover */}
                    <button
                        onClick={handleReply}
                        className={`
                            absolute top-2 opacity-0 group-hover:opacity-100 
                            transition-all duration-200 active:scale-95
                            p-2 rounded-full backdrop-blur-sm border-2 shadow-lg
                            ${isCurrentUser 
                                ? "-right-12 bg-gradient-to-r from-gray-700/80 to-gray-600/80 border-gray-500/60 hover:border-gray-400 hover:from-gray-600/90 hover:to-gray-500/90" 
                                : "-left-12 bg-gradient-to-r from-violet-700/80 to-cyan-700/80 border-violet-500/60 hover:border-cyan-400 hover:from-violet-600/90 hover:to-cyan-600/90"
                            }
                        `}
                        aria-label="Reply to message"
                    >
                        <Reply size={16} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}