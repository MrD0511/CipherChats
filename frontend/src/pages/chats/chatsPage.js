import React, { useState, useEffect } from 'react';
import '../chats/chatsPage.scss';
import axiosInstance from '../../axiosInstance';
import { User, Search } from 'lucide-react';

const ChatsPage = ({ onSelectChat, profile_details, openProfile }) => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      const response = await axiosInstance.get('/chat/get_chats');
      setChats(response.data.chats);
    };

    fetchChats();
  }, []);

  const filteredChats = chats.filter((chat) =>
    chat.partner_details?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <span className="chat-message">
                    {chat.latst_message?.type !== 'sender'
                      ? "New Chat"
                      : chat.latst_message?.message}
                  </span>
                  <span className="chat-time">{chat.latst_message?.time_stamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatsPage;