import { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../axiosInstance';
import { Image as ImageIcon, Send, File, Headphones, FileVideo, X, Reply, Paperclip } from 'lucide-react';
import { useWebSocket } from '../../../websocketContext';
import { Message } from '../../../interfaces/Message';
import { set } from 'date-fns';

type WebSocketContextType = {
  sendEvent: (event: any) => void;
};

type FileWithStatus = {
  file: File;
  uploading: boolean;
  error?: boolean;
};

export default function ChatInput({ userId, handleMessage, channel_id, replyingMessage, setReplyingMessage }: {
  userId: string;
  handleMessage: (inputValue: string, message_type: 'text' | 'image' | 'video' | 'audio' | 'file', mediaName: string | null, file_url: string | null, file_size: number | null) => void;
  channel_id: string;
  replyingMessage: Message | null;
  setReplyingMessage: (replyingMessage: Message | null) => void;
}) {
  const { sendEvent } = useWebSocket() as WebSocketContextType;
  const [inputValue, setInputValue] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [disableSend, setDisableSend] = useState(false);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    setDisableSend(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.file?.size > 10 * 1024 * 1024) {
        alert('File size exceeds the limit of 10MB');
        return;
      }

      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: true } : f));

      const formData = new FormData();
      formData.append('file', file.file);

      try {
        const response = await axiosInstance.post('file/upload', formData);
        console.log('File uploaded successfully:', file.file.size);
        handleMessage('file',
          file.file.type.startsWith('image/') ? 'image'
            : file.file.type.startsWith('video/') ? 'video'
              : file.file.type.startsWith('audio/') ? 'audio'
                : 'file',
          file.file.name,
          response.data.file_url,
          file.file.size);

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: false } : f));
      } catch (error) {
        console.error('Error uploading file:', error);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, uploading: false, error: true } : f));
      }
    }

    if (inputValue.trim()) {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
        sendEvent({ event: 'typing', recipient_id: userId, channel_id });
        handleMessage(inputValue, 'text', null, null, null);
        setInputValue('');
      }
      setFiles([]);
      setReplyingMessage(null);
      setDisableSend(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && disableSend === false) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const userTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendEvent({ event: 'typing', recipient_id: userId, channel_id });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      sendEvent({ event: 'stop_typing', recipient_id: userId, channel_id });
    }, 2000);
  };

  const getMessagePreview = (message: Message) => {
    switch (message.message_type) {
      case 'text': return message.message || '';
      case 'image': return '📷 Image';
      case 'video': return '🎥 Video';
      case 'audio': return '🎵 Audio';
      default: return '📎 File';
    }
  };

  const formatFileSize = (bytes: number) => {
    return bytes / 1024 > 1024
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return <FileVideo size={24} className="text-cyan-400" />;
    if (fileType.startsWith('audio/')) return <Headphones size={24} className="text-green-400" />;
    if (fileType.startsWith('image/')) return <ImageIcon size={24} className="text-violet-400" />;
    return <File size={24} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col">

      <style>{`
          
      `}</style>
      {/* Reply Preview */}
      {replyingMessage && (
        <div className="mx-4 mb-2">
          <div className="bg-gray-800/50 border border-gray-700 rounded-t-lg p-3 relative backdrop-blur-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-cyan-400 rounded-l-lg"></div>
            <button
              onClick={() => setReplyingMessage(null)}
              className="absolute top-2 right-2 p-1.5 hover:bg-gray-700 rounded-full transition-colors duration-200"
              aria-label="Cancel reply"
            >
              <X size={14} className="text-gray-400 hover:text-white" />
            </button>
            <div className="flex items-start gap-3 ml-3">
              <Reply size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-violet-400 text-xs font-medium mb-1">
                  Replying to {replyingMessage.recipient_id === userId ? 'yourself' : 'message'}
                </div>
                <div className="text-gray-300 text-sm truncate">
                  {getMessagePreview(replyingMessage)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mx-4 mb-2">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 max-h-[200px] overflow-y-auto backdrop-blur-sm
            scrollbar-thin scrollbar-track-gray-950 scrollbar-thumb-gray-700 
            hover:scrollbar-thumb-gray-600 scrollbar-corner-gray-900 scroll-smooth w-full"                
            style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(17, 24, 39) rgb(3, 7, 18)'
            }}>
              
            <div className="flex flex-col gap-2">
              {files.map((fileWithStatus, index) => (
                <div key={index} className="relative bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <button 
                    className="absolute top-2 right-2 p-1 hover:bg-gray-700 rounded-full transition-colors duration-200"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    <X size={12} className="text-gray-400 hover:text-white" />
                  </button>
                  
                  <div className="flex items-center gap-3 pr-6">
                    <div className="flex-shrink-0">
                      {fileWithStatus.file.type.startsWith('image/') ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-600">
                          <img 
                            src={URL.createObjectURL(fileWithStatus.file)} 
                            alt={`preview-${index}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          {getFileIcon(fileWithStatus.file.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {fileWithStatus.file.name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {formatFileSize(fileWithStatus.file.size)}
                      </div>
                      {fileWithStatus.uploading && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-violet-400 text-xs">Uploading...</span>
                        </div>
                      )}
                      {fileWithStatus.error && (
                        <div className="text-red-400 text-xs mt-1">Upload failed</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-900/80 border-t border-gray-700 backdrop-blur-sm shadow-inner">
        <div className="flex items-end gap-3 p-3 h-full">
          
          {/* Text Input */}
          {/* <div className="flex-1 relative"> */}
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
              className="w-full resize-none rounded-lg bg-gray-800 border border-gray-600 
                text-gray-200 placeholder-gray-400 p-3 pr-12 focus:outline-none focus:ring-2 
                focus:ring-violet-600 focus:border-transparent transition-all duration-150 
                min-h-[48px] max-h-[120px] overflow-y-auto scrollbar-hide"
              style={{
                scrollbarWidth: 'none',        // Firefox
                msOverflowStyle: 'none',       // IE/Edge
              }}
            />

          {/* </div> */}
          <div className="flex gap-3 items-end h-full">
            <button
              className="p-3 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-all duration-150 border border-gray-600 hover:border-gray-500"
              onClick={() => document.getElementById('file-input')?.click()}
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>

            {/* Send Button */}
            <button
              className="p-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-lg transition-transform duration-150 hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleSubmit}
              disabled={disableSend || (inputValue.trim() === '' && files.length === 0)}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* File Input */}
        <input
            id="file-input"
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                const filesArray = Array.from(e.target.files).map(file => ({
                  file,
                  uploading: false,
                  error: false
                }));
                setFiles([...files, ...filesArray]);
              }
              e.target.value = '';
          }}
        />
        </div>


  </div>
  );
}