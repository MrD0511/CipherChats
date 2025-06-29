// ChatBox.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Unlock } from 'lucide-react';
import Message from './message';
import { Message as MessageType } from '../../../interfaces/Message';

export default function ChatBox({
  userId,
  messages,
  recipientTyping,
  fetchMessages,
  setReplyingMessage
}: {
  userId: string;
  messages: MessageType[];
  recipientTyping: boolean;
  fetchMessages: () => Promise<boolean>;
  setReplyingMessage: (replyingMessage: MessageType | null) => void;
}) {

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const isAtBottomRef = useRef<boolean>(true);
  const lastMessageCountRef = useRef<number>(0);
  const scrollAnchorRef = useRef<{ messageId: string; offset: number } | null>(null);

  // Create a scroll anchor before loading older messages
  const createScrollAnchor = useCallback(() => {
    const chatbox = chatBoxRef.current;
    if (!chatbox || messages.length === 0) return;

    const chatboxRect = chatbox.getBoundingClientRect();
    const messageElements = chatbox.querySelectorAll('[data-message-id]');
    
    // Find the message that's currently visible at the top of the viewport
    for (const element of messageElements) {
      const rect = element.getBoundingClientRect();
      const relativeTop = rect.top - chatboxRect.top;
      
      if (relativeTop >= -50 && relativeTop <= chatbox.clientHeight) {
        const messageId = element.getAttribute('data-message-id');
        if (messageId) {
          scrollAnchorRef.current = {
            messageId,
            offset: relativeTop
          };
          break;
        }
      }
    }
  }, [messages]);

  // Restore scroll position using the anchor
  const restoreScrollPosition = useCallback(() => {
    const chatbox = chatBoxRef.current;
    const anchor = scrollAnchorRef.current;
    
    if (!chatbox || !anchor) return;

    const targetElement = chatbox.querySelector(`[data-message-id="${anchor.messageId}"]`);
    if (targetElement) {
      const chatboxRect = chatbox.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();
      const currentOffset = elementRect.top - chatboxRect.top;
      const scrollAdjustment = currentOffset - anchor.offset;
      
      chatbox.scrollTop += scrollAdjustment;
      scrollAnchorRef.current = null;
    }
  }, []);

  // Handle scroll position management
  useEffect(() => {
    const chatbox = chatBoxRef.current;
    if (!chatbox) return;

    const currentMessageCount = messages.length;
    const messagesAdded = currentMessageCount - lastMessageCountRef.current;
    
    if (messagesAdded > 0) {
      if (loading && scrollAnchorRef.current) {
        // Restoring position after loading older messages
        // Use double RAF to ensure DOM is fully updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreScrollPosition();
          });
        });
      } else if (!loading && isAtBottomRef.current) {
        // New messages arrived and user was at bottom - scroll to bottom
        requestAnimationFrame(() => {
          chatbox.scrollTop = chatbox.scrollHeight;
        });
      }
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages, loading, restoreScrollPosition]);

  // Handle recipient typing indicator
  useEffect(() => {
    const chatbox = chatBoxRef.current;
    if (!chatbox || !recipientTyping) return;

    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
      });
    }
  }, [recipientTyping]);

  const handleScroll = useCallback(async () => {
    const chatbox = chatBoxRef.current;
    if (!chatbox || loading || finished) return;

    const scrollTop = chatbox.scrollTop;
    const scrollHeight = chatbox.scrollHeight;
    const clientHeight = chatbox.clientHeight;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    // Update bottom detection
    isAtBottomRef.current = scrollBottom < 10;

    // Load older messages if scrolled near top
    if (scrollTop <= 50) {
      createScrollAnchor();
      setLoading(true);

      try {
        const hasMore = await fetchMessages();
        if (!hasMore) setFinished(true);
      } catch (err) {
        console.error('Fetching error:', err);
        scrollAnchorRef.current = null; // Clear anchor on error
      } finally {
        setLoading(false);
      }
    }
  }, [fetchMessages, loading, finished, createScrollAnchor]);

  // Scroll event listener setup
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox || finished) return;

    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    chatBox.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      chatBox.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll, finished]);

  const renderTimestamp = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderMessageContent = (message: MessageType) => (
    <>
      {message.message && (
        <div className="break-words break-all hyphens-auto leading-relaxed text-white text-sm w-full overflow-hidden">
          {message.message.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              <span className="block w-full break-words break-all overflow-wrap-anywhere">{line}</span>
              {index < message.message.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );

  const statusMessage = (message: MessageType) => (
    <div className="w-full flex justify-center my-3">
      <div className="inline-flex items-center text-xs text-gray-300 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
        {message.sub_type === 'enable' ? (
          <>
            <Lock className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">End-to-End encryption enabled</span>
          </>
        ) : (
          <>
            <Unlock className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">End-to-End encryption disabled</span>
          </>
        )}
      </div>
    </div>
  );

  const findRepliedMessage = (id: string): MessageType | null => {
    const msg = messages.find(m => m.message_id === id);
    return msg || null;
  };

  const scrollToMessage = (id: string) => {
    const el = document.querySelector(`[data-message-id="${id}"]`);
    if (el && chatBoxRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getMessagePreview = (msg: MessageType) => {
    if (msg.message_type === 'text') {
      const text = msg.message || '';
      return text.length > 50 ? `${text.slice(0, 50)}...` : text;
    }
    if (msg.message_type === 'image') return '📷 Image';
    if (msg.message_type === 'video') return '🎥 Video';
    if (msg.message_type === 'audio') return '🎵 Audio';
    return '📎 File';
  };

  const renderMessageWithReply = (msg: MessageType) => {
    const replied = msg.replied_message_id ? findRepliedMessage(msg.replied_message_id) : null;

    return (
      <div className="w-full overflow-hidden">
        {replied && (
          <div
            onClick={() => scrollToMessage(replied.message_id)}
            className={`
              cursor-pointer mb-2 p-3 rounded-lg border-l-4 transition-all duration-200 hover:opacity-80
              w-full overflow-hidden
              ${msg.sender_id === userId 
                ? 'bg-gray-800/60 border-gray-500 hover:bg-gray-800/80' 
                : 'bg-violet-800/60 border-violet-400 hover:bg-violet-800/80'
              }
            `}
          >
            <div className="text-xs text-gray-300 mb-1 font-medium">
              {replied.recipient_id === userId ? 'You' : 'Recipient'}
            </div>
            <div className="text-sm text-gray-100 break-words break-all hyphens-auto leading-relaxed w-full overflow-hidden">
              {getMessagePreview(replied)}
            </div>
          </div>
        )}
        {renderMessageContent(msg)}
      </div>
    );
  };

  return (
    <div
      ref={chatBoxRef}
      className="chat-box flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 bg-gray-950 text-white
                 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700 
                 hover:scrollbar-thumb-gray-600 scrollbar-corner-gray-900
                 scroll-smooth w-full"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#374151 #111827'
      }}
    >
      {loading && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-gray-400 bg-gray-800/50 px-4 py-2 rounded-full">
            Loading more messages...
          </div>
        </div>
      )}
      
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          data-message-id={msg.message_id}
          className="w-full overflow-hidden"
        >
          <Message
            message={msg}
            userId={userId}
            renderMessageContent={() => renderMessageWithReply(msg)}
            renderTimestamp={renderTimestamp}
            statusMessage={statusMessage}
            setReplyingMessage={setReplyingMessage}
          />
        </div>
      ))}
      
      {recipientTyping && (
        <div className="flex justify-start">
          <div className="text-sm text-white bg-gray-900 font-light italic px-3 py-2 rounded-full">
            typing...
          </div>
        </div>
      )}
    </div>
  );
}