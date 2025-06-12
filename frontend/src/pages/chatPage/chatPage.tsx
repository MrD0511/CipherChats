// ChatPage.jsx
import { useState, useEffect, useCallback } from 'react';
import './chatPage.scss';
import {  getMessage, addMessage } from '../../indexdb.service.js';
import { useWebSocket } from '../../websocketContext.js';
import { v4 as uuidv4 } from 'uuid';
import ChatInput from './components/chatInput.js';
import ChatBox from './components/chatBox.js';
import PartnerDetails from './components/partnerDetails.js';
import { Message, sendingMessage } from '../../interfaces/Message';


const FetchAllMessages = ({
    channel_id,
    setMessages,
}: {
    channel_id: string;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) => {

    const [paginationNumber, setPaginationNumber] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const fetchMessages = useCallback(async () => {
        if(isLoading) return;

        setIsLoading(true);

        try{
            const prevMessages = await getMessage(channel_id, 10, paginationNumber);
            console.log("prevMessages : ", prevMessages);
            if(prevMessages.length !== 0){
                prevMessages.map(async (message) => {
                    setMessages((prev: any)=>[ message, ...prev])
                })
                setPaginationNumber((prev)=>prev+1)
            }else{
                return false;
            }
        }catch(err){
            console.error("error fetching messages : ",err)
        }finally{
            setIsLoading(false);
        }

        return 

    },[channel_id, setMessages, isLoading, paginationNumber]);

    useEffect(()=>{
        if(channel_id && firstLoad){
            fetchMessages()
            setFirstLoad(false);
        }
    }, [fetchMessages, channel_id, setFirstLoad, firstLoad])

    return {setFirstLoad, fetchMessages}

}

const ChatPage = ({ userId }: { userId: string }) => {

    const [messages, setMessages] = useState<Message[]>([]);
    const [channelId, setChannelId] = useState<string>('');
    const [recipientTyping, setRecipientTyping] = useState<boolean>(false);
    const { messageEmmiter, sendMessage } = useWebSocket();
    const { fetchMessages } = FetchAllMessages({ channel_id: channelId, setMessages });

    useEffect(() => {

        const handleIncomingMessages = (data: Message) => {
            if (data.type === 'message'|| data.type === 'e2ee_status') {
                setRecipientTyping(false);
                setMessages((prev) => [...prev, data]);
            }
        };
    
        // Add the listener
        messageEmmiter.on('onMessage', handleIncomingMessages);
        messageEmmiter.on('onEvent', (data: any)=>{
            if(data.event === "typing"){
                setRecipientTyping(true);
            }else if(data.event === "stop_typing"){
                setRecipientTyping(false);
            }
        })
        // Fetch initial messages when `channelId` changes
        // Cleanup the listener on unmount or when `channelId` changes
        return () => {
            messageEmmiter.off('onMessage', handleIncomingMessages);
            messageEmmiter.off('onEvent', (data: any)=>{
                if(data.event === "typing"){
                    setRecipientTyping(true);
                }else if(data.event === "stop_typing"){
                    setRecipientTyping(false);
                }
            })
        };
    }, [channelId, messageEmmiter, setRecipientTyping]); // Re-run only when `channelId` changes
    

    const handleMessage = async (inputValue: string, message_type: "text" | "image" | "video" | "audio" | "file", mediaName: string | null, file_url: string | null, file_size: number | null) => {
        if (inputValue.trim()) {
            const timestamp = new Date().toISOString();
            const id = uuidv4();

            const message: Message = {
                message_id: id,
                message: inputValue,
                channel_id: channelId,
                sender_id: "",
                recipient_id: userId,
                type: 'message',
                timestamp: timestamp,
                message_type: message_type || 'text',
                file_name: mediaName || undefined,
                file_url: file_url || undefined,
                file_size: file_size || undefined,
                file_exp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // File expiration set to 5 days
            }

            const sendingMessage: sendingMessage = {
                message_id: id,
                channel_id: channelId,
                sender_id: "",
                recipient_id: userId,
                type: 'message',
                message: inputValue,
                message_type: message_type || 'text',
                file_name: mediaName || undefined,
                file_url: file_url || undefined,
                timestamp: timestamp,
                file_size: file_size || undefined,
                file_exp: message.file_exp
            };

            setMessages((prevMessages) => [...prevMessages, message]);
            sendMessage(sendingMessage);
            await addMessage(message);
        }
    };

    const addE2eeStatus = async (status: "enable" | "disable") => {
        const id = uuidv4();
        setMessages([...messages, { message_id: id, channel_id: channelId, sender_id: "", recipient_id: "", type: 'system', sub_type: status, message: "", message_type: "",  timestamp: new Date().toISOString() }]);

        const message: Message = {
            message_id: id,
            channel_id: channelId,
            sender_id: "",
            recipient_id: userId,
            type: 'e2ee_status',
            sub_type: status,
            message: "",
            message_type: "",
            timestamp: new Date().toISOString(),
        };

        await addMessage(message);
    }

    return (
        <div className="chat-container">
            <PartnerDetails
                userId={userId}
                onChannel_id={setChannelId}
                addE2eeStatus={(status: "enable" | "disable") =>{  addE2eeStatus(status) }}
            />
            <ChatBox
                key={userId}
                messages={messages}
                recipientTyping={recipientTyping}
                userId={userId}
                fetchMessages={fetchMessages}
            />
            <ChatInput userId={userId} handleMessage={handleMessage} channel_id={channelId} />
        </div>
    );
};

export default ChatPage;
