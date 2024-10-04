import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatPage from '../chatPage/chatPage.js';
import ChatsPage from '../chats/chatsPage.js';
import './layout.scss';
import Create_chat_dialog from '../../dialogs/create_chat/create_chat.js';
import JoinChatDialog from '../../dialogs/join_chat/join_chat.js';
import { User, UserPen, Settings, KeyRound } from 'lucide-react';
import EditProfileDialog from '../../dialogs/profile_update/profile_update.js';
import ProfilePage from '../../dialogs/profile/profile.js';

const Layout = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isProfileOpen, setIsProileOpen] = useState(false)
  // Get chatId from the URL parameters
  const { chatId } = useParams();
  const navigate = useNavigate();

  // Functions to handle dialogs
  const openEditProfile = () => setIsEditProfileOpen(true);
  const closeEditProfile = () => setIsEditProfileOpen(false);
  const openCreateDialog = () => setCreateDialogOpen(true);
  const closeCreateDialog = () => setCreateDialogOpen(false);
  const openJoinDialog = () => setJoinDialogOpen(true);
  const closeJoinDialog = () => setJoinDialogOpen(false);
  const openProfile = () => setIsProileOpen(true);
  const closeProfile = () => setIsProileOpen(false);

  // Function to handle selecting a chat from the chat list
  const handleSelectChat = (id) => {
    navigate(`/chats/${id}`); // Change the route to include chatId
  };

  return (
    <>
      <div className="chat-layout">
        <div className="side-bar">
          <div className="options">
            <div><Settings /></div>
            <div><KeyRound /></div>
            <div onClick={openProfile}><User /></div>
          </div>
        </div>
        {/* ChatsPage component where you select a chat */}
        <ChatsPage onSelectChat={handleSelectChat} className="chats" />

        {/* ChatPage component shows the selected chat, based on chatId from URL */}
        <ChatPage user_id={chatId} onCreateChat={openCreateDialog} onJoinChat={openJoinDialog} className="chatBox" />
      </div>

      {/* Dialog Components */}
      <Create_chat_dialog 
      isOpen={isCreateDialogOpen} 
      onClose={closeCreateDialog} />

      <JoinChatDialog 
      isOpen={isJoinDialogOpen} 
      onClose={closeJoinDialog} 
      onJoin={handleSelectChat} />

      <EditProfileDialog 
      isOpen={isEditProfileOpen} 
      onClose={closeEditProfile}
      initialData={{ username: 'current_user', name: 'Current User' }} />

      <ProfilePage
        isOpen={isProfileOpen}  // Changed to camelCase to match expected prop name
        onClose={closeProfile}  // Changed to camelCase to match expected prop name
        onEditProfile={openEditProfile}

      />

    </>
  );
};

export default Layout;
