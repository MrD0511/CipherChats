import React, { useState, useEffect, useCallback } from 'react';
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
  const [dialogStates, setDialogStates] = useState({
    isCreateDialogOpen: false,
    isJoinDialogOpen: false,
    isEditProfileOpen: false,
    isProfileOpen: false
  });
  const [profileDetails, setProfileDetails] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  
  const { chatId, userId } = useParams();
  const navigate = useNavigate();

  const toggleDialog = useCallback((dialogName) => {
    setDialogStates(prevState => ({
      ...prevState,
      [dialogName]: !prevState[dialogName]
    }));
  }, []);

  const handleSelectChat = useCallback((id) => {
    navigate(`/chats/${id}`);
  }, [navigate]);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth <= 768);
  }, []);

  useEffect(() => {

    const token = localStorage.getItem('access_token')
    if(!token){
      navigate('/signin')
    }

    const fetchUserDetails = async () => {
      try {
        const response = await axiosInstance.get('/user/profile');
        setProfileDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUserDetails();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <>
      <div className="chat-layout">
        <div className="side-bar">
          <div className="options">
            <div><Settings /></div>
            <div><KeyRound /></div>
            <div onClick={() => toggleDialog('isProfileOpen')}>
              {profileDetails?.profile_url ? 
                <img className="profile_photo" src={profileDetails.profile_url} alt='profile' />
                : <User />
              }
            </div>
          </div>
        </div>
        
        {isMobileView ? (
          userId ? (
            <ChatPage 
              user_id={chatId} 
              onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
              onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
              className="chatBox" 
            />
          ) : (
            <ChatsPage 
              onSelectChat={handleSelectChat} 
              className="chats" 
              openProfile={() => toggleDialog('isProfileOpen')} 
              profile_details={profileDetails} 
            />
          )
        ) : (
          <>
            <ChatsPage onSelectChat={handleSelectChat} className="chats" />
            <ChatPage 
              user_id={chatId} 
              onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
              onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
              className="chatBox" 
            />
          </>
        )}
      </div>

      <CreateChatDialog 
        isOpen={dialogStates.isCreateDialogOpen} 
        onClose={() => toggleDialog('isCreateDialogOpen')} 
      />

      <JoinChatDialog 
        isOpen={dialogStates.isJoinDialogOpen} 
        onClose={() => toggleDialog('isJoinDialogOpen')} 
        onJoin={handleSelectChat} 
      />

      <EditProfileDialog 
        isOpen={dialogStates.isEditProfileOpen} 
        onClose={() => toggleDialog('isEditProfileOpen')}
        initialData={profileDetails} 
      />

      <ProfilePage
        isOpen={dialogStates.isProfileOpen}
        onClose={() => toggleDialog('isProfileOpen')}
        onEditProfile={() => toggleDialog('isEditProfileOpen')}
      />
    </>
  );
};

export default Layout;