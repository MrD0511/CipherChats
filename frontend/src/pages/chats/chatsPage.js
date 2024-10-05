import React, { useState, useEffect } from 'react'
import '../chats/chatsPage.scss'
import axiosInstance from '../../axiosInstance';
import  {User} from 'lucide-react';

const ChatsPage = ({onSelectChat, profile_details, openProfile}) => {
    
    const [chats, setChats] = useState([])

    useEffect(() => {
      // This is equivalent to ngOnInit
      const fetch_chats = async () => {

        const response = await axiosInstance.get('/chat/get_chats');
        setChats(response.data.chats)
      }

      fetch_chats()

    }, []);

    return (
        <div className="main">
          <div className='header'>
            <div className='website-logo'>
              <h3>KyChat</h3>
            </div>
            <div className='options'>
              <div onClick={openProfile}>
                { profile_details?.profile_url ? 
                    <img className="profile_photo" img src={profile_details?.profile_url} alt='profile' />
                    : <User />
                }</div>
            </div>
          </div>
          <div className='chats-container'>
            <div className='heading'>
              <h4>Chats</h4>
            </div>
            <div className='all-chats'>
              {chats.map((chat, index) => (
                <div className='chatMessage-container' key={index} onClick={()=>{onSelectChat(chat?.partner_id?.$oid)}}>
                  <div className="chat-name">
                    <strong>{chat.partner_details?.name}</strong>
                  </div>
                  <div className="chat-message-box">
                    <span className="chat-message">{chat.latst_message?.type !== 'sender' ? "New Chat" : chat.latst_message?.message}</span>
                    <span className="chat-time">{chat.latst_message?.time_stamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    );
};

export default ChatsPage;
