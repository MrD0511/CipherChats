import React, { useState, useEffect } from 'react'
import '../chats/chatsPage.scss'
import axiosInstance from '../../axiosInstance';

const ChatsPage = ({onSelectChat}) => {
    
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
          <div className='website-logo'>
            <h3>CoolChat</h3>
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
                    <span className="chat-message">{chat.latst_message?.type != 'sender' ? "New Chat" : chat.latst_message?.message}</span>
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
