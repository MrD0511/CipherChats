import React, { useState, useEffect, useCallback } from 'react';
import '../chats/chatsPage.scss';
import axiosInstance from '../../axiosInstance';
import { User, Search, MessageSquarePlus, UserPlus, Plus } from 'lucide-react';
// import { format } from "date-fns";

const ChatsPage = ({ onSelectChat, profile_details, openProfile,onCreateChat, onJoinChat }) => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // const formatTime = (timestamp) => {
  //   const messageDate = new Date(timestamp);
  //   const now = new Date();
  
  //   const isToday =
  //     now.getDate() === messageDate.getDate() &&
  //     now.getMonth() === messageDate.getMonth() &&
  //     now.getFullYear() === messageDate.getFullYear();
  
  //   const isThisWeek =
  //     messageDate > new Date(now.setDate(now.getDate() - 7)) && messageDate <= new Date();
  
  //   if (isToday) {
  //     // Show time if it's today
  //     return format(messageDate, "HH:mm");
  //   } else if (isThisWeek) {
  //     // Show day if it's this week
  //     return format(messageDate, "EEEE"); // Example: Monday
  //   } else {
  //     // Show date if it's older than this week
  //     return format(messageDate, "dd/MM/yyyy");
  //   }
  // };

  useEffect(() => {
    const fetchChats = async () => {
      const response = await axiosInstance.get('/chat/get_chats');
      setChats(response.data.chats);
    };

    fetchChats();
  }, []);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth <= 768);
  }, []);

  useEffect(()=>{
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize)
    };
  },[handleResize])

  const filteredChats = chats.filter((chat) =>
    chat.partner_details?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="main">
      <header className="header">
        <div className='brand-name'>
          <span className="cipher">Cipher</span>
          <span className="chat">Chat</span>
        </div>
        <div className="options" onClick={openProfile}>
          {profile_details?.profile_url ? (
            <img
              className="profile_photo"
              src={profile_details.profile_url}
              alt="profile"
            />
          ) : (
            <User />
          )}
        </div>
      </header>

      <div className="chats-container">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="all-chats">
          {filteredChats.map((chat, index) => (
            <div
              key={index}
              className="chat-message-container"
              onClick={() => onSelectChat(chat?.partner_id?.$oid)}
            >
              <div className="profile">
                {chat?.partner_details?.profile_photo_url ? (
                  <img
                    src={chat.partner_details.profile_photo_url}
                    alt={chat.partner_details?.username}
                  />
                ) : (
                  <User />
                )}
              </div>
              <div className="chat-details">
                <div className="chat-name">
                  <strong>{chat.partner_details?.name}</strong>
                </div>
                <div className="chat-message-box">
{/* {                  <span className="chat-message">
                    {String(chat.latest_message?.message)}
                  </span>} */}
                  {/* {<span className="chat-time">{formatTime(chat.latest_message?.time_stamp?.$date)}</span>} */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {
        isMobileView &&
        <div className={`fab-container ${isExpanded ? 'expanded' : ''}`}>
          <button className="fab-button" onClick={toggleExpand}>
            <Plus size={24} />
          </button>
          <div className="fab-options">
            <button className="fab-option create-chat" onClick={onCreateChat}>
              <MessageSquarePlus size={20} />
              <span>Create Chat</span>
            </button>
            <button className="fab-option join-chat" onClick={onJoinChat}>
              <UserPlus size={20} />
              <span>Join Chat</span>
            </button>
          </div>
        </div>
      }
    </div>
  );
};

export default ChatsPage;