// ChatPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../chatPage.scss';
import {Lock, Unlock} from 'lucide-react';
import  Message  from './message';
import { Message as MessageType } from '../../../interfaces/Message';

// ChatBox Component
export default function ChatBox({ userId, messages, recipientTyping, fetchMessages }
    : {
        userId: string,
        messages: MessageType[],
        recipientTyping: boolean,
        fetchMessages: () => Promise<boolean>
    }
) {
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);


    const handleScroll = useCallback( async () => {
        const chatbox = chatBoxRef.current;
        if(chatbox && chatbox.scrollTop === 0 && !loading){
            setLoading(true);
            const isFinished = await fetchMessages();
            if(!isFinished){
                setFinished(true);
            }
            setLoading(false);
        }
    },[setLoading, fetchMessages, loading, setFinished])

    useEffect(() => {
        const chatBox = chatBoxRef.current;
        if(!finished && chatBox){
            chatBox.addEventListener('scroll', handleScroll);
        }
    
        return () => {
          if (chatBox) {
            chatBox.removeEventListener('scroll', handleScroll); // Clean up the event listener
          }
        };
      }, [messages, loading, handleScroll, finished]); // Only re-attach when messages or loading state change

    const renderTimestamp = (timestamp: string | number | Date) => {
        const date = new Date(timestamp);
        const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString([], options);
    }

    const renderMessageContent = (message: MessageType) => (
        <>
            {message.message && <span className="message-text">{message.message.split('\n').map((line, index) => (
                <React.Fragment key={index}>{line}{index < message.message.split('\n').length - 1 && <br />}</React.Fragment>
            ))}</span>
            }
        </>
    );

    const statusMessage = (message: MessageType) => {
        return (
            <>
                <div className='chat-status'>
                    {
                        message.sub_type === "enable" ? <span><Lock className='icon'/>End to End encryption is enabled</span> : <span><Unlock className='icon'/>End to End encryption is disabled</span>
                    }
                </div>
            </>
        )
    }
    
    return (    
        <div className="chat-box" ref={chatBoxRef}>
            {messages.map((message: MessageType, index: number) => (
                <Message key={index} message={message} userId={userId} renderMessageContent={renderMessageContent} renderTimestamp={renderTimestamp} statusMessage={statusMessage} />
            ))}
            {recipientTyping && <div className="messageSender typing-indicator">typing...</div>}
        </div>
    );
};