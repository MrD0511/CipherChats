import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatPage from '../chatPage/chatPage.js';
import ChatsPage from '../chats/chatsPage.js';
import './layout.scss';
import CreateChatDialog from '../../dialogs/create_chat/create_chat.js';
import JoinChatDialog from '../../dialogs/join_chat/join_chat.js';
import { User, Settings, KeyRound } from 'lucide-react';
import EditProfileDialog from '../../dialogs/profile_update/profile_update.js';
import ProfilePage from '../../dialogs/profile/profile.js';
import axiosInstance from '../../axiosInstance.js';

const Layout = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isProfileOpen, setIsProileOpen] = useState(false)
  const [profile_details, setProfile_details] = useState(null)
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768); // 768px is a common breakpoint for mobile
  // Get chatId from the URL parameters
  const { chatId } = useParams();
  const navigate = useNavigate();
  const {userId} = useParams()

  // Functions to handle dialogs
  const openEditProfile = () => setIsEditProfileOpen(true);
  const closeEditProfile = () => setIsEditProfileOpen(false);
  const openCreateDialog = () => setCreateDialogOpen(true);
  const closeCreateDialog = () => setCreateDialogOpen(false);
  const openJoinDialog = () => setJoinDialogOpen(true);
  const closeJoinDialog = () => setJoinDialogOpen(false);
  const openProfile = () => setIsProileOpen(true);
  const closeProfile = () => setIsProileOpen(false);

  const handleResize = () => {
    setIsMobileView(window.innerWidth <= 768);
  };

  useEffect(()=>{
      const fetch_user_details = async () => {
        try{
          let response = await axiosInstance.get('/user/profile');
          setProfile_details(Object(response.data))
        }catch(e){
          console.error(e)
        }
      }
      fetch_user_details()
      window.addEventListener('resize', handleResize); // Listen for resize events
      return () => window.removeEventListener('resize', handleResize); // Cleanup
  },[])

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
            <div onClick={openProfile}>{ profile_details?.profile_url ? 
                                          <img className="profile_photo" img src={profile_details?.profile_url} alt='profile' />
                                          : <User />
                                        }</div>
          </div>
        </div>
        {console.log(isMobileView)}
        { 
          isMobileView ? 
            
              <>
                 {userId ? 
                  <ChatPage user_id={chatId} onCreateChat={openCreateDialog} onJoinChat={openJoinDialog} className="chatBox" />
                  :
                  <ChatsPage onSelectChat={handleSelectChat} className="chats" openProfile={openProfile} profile_details={profile_details} />}
              </>     
               : 
              <>
                <ChatsPage onSelectChat={handleSelectChat} className="chats" />
        
                <ChatPage user_id={chatId} onCreateChat={openCreateDialog} onJoinChat={openJoinDialog} className="chatBox" />
              </>
        }
      </div>

      {/* Dialog Components */}
      <CreateChatDialog 
      isOpen={isCreateDialogOpen} 
      onClose={closeCreateDialog} />

      <JoinChatDialog 
      isOpen={isJoinDialogOpen} 
      onClose={closeJoinDialog} 
      onJoin={handleSelectChat} />

      <EditProfileDialog 
      isOpen={isEditProfileOpen} 
      onClose={closeEditProfile}
      initialData = {profile_details} />

      <ProfilePage
        isOpen={isProfileOpen}
        onClose={closeProfile}
        onEditProfile={openEditProfile}
      />

    </>
  );
};

export default Layout;
