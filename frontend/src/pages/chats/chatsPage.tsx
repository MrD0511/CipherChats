import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import { User, Search, MessageSquarePlus, UserPlus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../../indexdb.service';

type Chat = {
  partner_id?: string;
  channel_id?: string;
  partner_details?: {
    name?: string;
    username?: string;
    profile_photo_url?: string;
  };
  last_message: string;
  last_message_time: string;
};

const ChatsPage = ({ onSelectChat, profile_details, openProfile, onCreateChat, onJoinChat }
  : {
    onSelectChat: (chatId: string) => void;
    profile_details: { profile_url?: string };
    openProfile: () => void;
    onCreateChat: () => void;
    onJoinChat: () => void;
  }
) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fetchChats = async () => {
      const response = await axiosInstance.get('/chat/get_chats');
      var chatsData = response.data.chats || [];
      // Ensure chatsData is an array
      await Promise.all(chatsData.map(async (chat: any) => {
        const lastMessage = await db.chat.where('channel_id').equals(chat.channel_id).last();
        console.log("Last message for channel:", chat.channel_id, "is", lastMessage);
        chat.last_message = lastMessage?.message || '';
        chat.last_message_time = lastMessage?.timestamp || '';
      }));

      setChats(chatsData);
    };

    fetchChats();
  }, []);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  const filteredChats = chats.filter((chat) =>
    (chat.partner_details?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderTimestamp = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200 rounded-md w-full">
      <header className="flex justify-between items-center p-3 bg-gray-900 border-b border-[#3f3f5f]">
        <div className="fade-in">
            <div className="text-xl md:text-2xl font-bold tracking-widest bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
              <span>Cipher</span>
              <span>Chats</span>
            </div>
        </div>
        <div className="block cursor-pointer" onClick={openProfile}>
          {profile_details?.profile_url ? (
            <img
              className="w-10 h-10 rounded-full object-cover border-2 border-violet-700"
              src={profile_details.profile_url}
              alt="profile"
            />
          ) : (
            <User className="w-10 h-10 text-[#6d28d9]" />
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 w-full">
        <div className="relative mb-4 p-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[calc(100%-3.4rem)] pl-10 pr-4 py-3 bg-gray-900 border-none rounded-full text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#6d28d9] placeholder:text-gray-500"
          />
        </div>

        <div className="w-full">
          {filteredChats.length !== 0 ? (
            filteredChats.map((chat, index) => (
              <div
                key={index}
                className="flex w-full items-center p-4 rounded-md hover:bg-gray-900 cursor-pointer transition-colors"
                onClick={() => {
                  if (chat?.partner_id) {
                    onSelectChat(chat.partner_id);
                  }
                }}
              >
                <div className="shrink-0">
                  {chat?.partner_details?.profile_photo_url ? (
                    <img
                      src={chat.partner_details.profile_photo_url}
                      alt={chat.partner_details?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-500 bg-[#3f3f5f] p-2 rounded-full" />
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="font-bold mb-1 truncate">
                    {chat.partner_details?.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="truncate flex-1 min-w-0">
                      {chat.last_message || ''}
                    </div>
                    {chat.last_message_time && (
                      <div className="text-xs shrink-0">
                        {renderTimestamp(chat.last_message_time)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center w-full h-full mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-[#3f3f5f] font-bold text-base animate-fade-in">
                  No Chats Found
                </span>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {isMobileView && (
        <div className={`fixed bottom-6 right-6 flex flex-col-reverse items-end z-10 ${isExpanded ? 'expanded' : ''}`}>
          <button
            className="w-14 h-14 rounded-full bg-gradient-primary text-white flex justify-center items-center shadow-md hover:scale-110 transition-transform"
            onClick={toggleExpand}
          >
            <Plus size={24} />
          </button>
          <div
            className={`flex flex-col gap-4 mb-4 transition-all ${isExpanded ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
          >
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white hover:-translate-x-1 transition-transform"
              onClick={onCreateChat}
            >
              <MessageSquarePlus size={20} className="text-[#6d28d9]" />
              <span className="whitespace-nowrap">Create Chat</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white hover:-translate-x-1 transition-transform"
              onClick={onJoinChat}
            >
              <UserPlus size={20} className="text-[#6d28d9]" />
              <span className="whitespace-nowrap">Join Chat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
