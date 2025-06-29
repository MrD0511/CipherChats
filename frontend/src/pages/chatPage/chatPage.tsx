import { useState, useEffect, useCallback } from 'react';
import { getMessage, addMessage } from '../../indexdb.service.js';
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

  const fetchMessages = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false;

    setIsLoading(true);

    try {
      const prevMessages = await getMessage(channel_id, 10, paginationNumber);
      if (prevMessages.length !== 0) {
        prevMessages.forEach((message) => {
          setMessages((prev: any) => [message, ...prev]);
        });
        setPaginationNumber((prev) => prev + 1);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('error fetching messages : ', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [channel_id, setMessages, isLoading, paginationNumber]);

  useEffect(() => {
    if (channel_id && firstLoad) {
      fetchMessages();
      setFirstLoad(false);
    }
  }, [fetchMessages, channel_id, setFirstLoad, firstLoad]);

  return { setFirstLoad, fetchMessages };
};

const ChatPage = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelId, setChannelId] = useState<string>('');
  const [recipientTyping, setRecipientTyping] = useState<boolean>(false);
  const { messageEmmiter, sendMessage } = useWebSocket();
  const { fetchMessages } = FetchAllMessages({ channel_id: channelId, setMessages });
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  useEffect(() => {
    const handleIncomingMessages = (data: Message) => {
      if (data.type === 'message' || data.type === 'e2ee_status') {
        setRecipientTyping(false);
        setMessages((prev) => [...prev, data]);
      }
    };

    messageEmmiter.on('onMessage', handleIncomingMessages);
    messageEmmiter.on('onEvent', (data: any) => {
      if (data.event === 'typing') {
        console.log('recipient is typing');
        setRecipientTyping(true);
      } else if (data.event === 'stop_typing') {
        setRecipientTyping(false);
      }
    });

    return () => {
      messageEmmiter.off('onMessage', handleIncomingMessages);
      messageEmmiter.off('onEvent', (data: any) => {
        console.log('event received:', data);
        if (data.event === 'typing') {
          setRecipientTyping(true);
        } else if (data.event === 'stop_typing') {
          setRecipientTyping(false);
        }
      });
    };
  }, [channelId, messageEmmiter]);

  const handleMessage = async (
    inputValue: string,
    message_type: 'text' | 'image' | 'video' | 'audio' | 'file',
    mediaName: string | null,
    file_url: string | null,
    file_size: number | null
  ) => {
    if (inputValue.trim()) {
      const timestamp = new Date().toISOString();
      const id = uuidv4();

      const message: Message = {
        message_id: id,
        message: inputValue,
        channel_id: channelId,
        sender_id: '',
        recipient_id: userId,
        type: 'message',
        timestamp,
        message_type: message_type || 'text',
        file_name: mediaName || undefined,
        file_url: file_url || undefined,
        file_size: file_size || undefined,
        file_exp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        replied_message_id: replyingMessage ? replyingMessage.message_id : undefined,
        status: "unsent"
      };

      const sendingMessage: sendingMessage = {
        ...message,
        sender_id: '',
        recipient_id: userId,
      };

      setMessages((prevMessages) => [...prevMessages, message]);
      sendMessage(sendingMessage);
      await addMessage(message);
    }
  };

  const addE2eeStatus = async (status: 'enable' | 'disable') => {
    const id = uuidv4();
    const message: Message = {
      message_id: id,
      channel_id: channelId,
      sender_id: '',
      recipient_id: userId,
      type: 'e2ee_status',
      sub_type: status,
      message: '',
      message_type: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    await addMessage(message);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0.8rem)] w-full rounded-md bg-gray-950 text-gray-200">
      <PartnerDetails
        userId={userId}
        channel_id={channelId}
        onChannel_id={setChannelId}
        addE2eeStatus={addE2eeStatus}
      />
      <ChatBox
        key={userId}
        messages={messages}
        recipientTyping={recipientTyping}
        userId={userId}
        fetchMessages={fetchMessages}
        setReplyingMessage={setReplyingMessage}
      />
      <ChatInput
        userId={userId}
        handleMessage={handleMessage}
        channel_id={channelId}
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
      />
    </div>
  );
};

export default ChatPage;