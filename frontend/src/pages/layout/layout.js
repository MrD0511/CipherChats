import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
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
  const [ws, setWs] = useState(null)
  const { chatId, userId } = useParams();
  const navigate = useNavigate();

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if(!token){
      navigate('/signin')
    } 
  })

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

    const fetchUserDetails = async () => {
      try {
        const response = await axiosInstance.get('/user/profile');
        setProfileDetails(response.data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    const websocket_url = process.env.REACT_APP_WEBSOCKET_URL
    const token = localStorage.getItem('access_token')
    const socket = new WebSocket(`${websocket_url}/ws/chat?token=${token}`)
    setWs(socket)

    socket.onopen = () => console.log("WebSocket connected")

    socket.onclose = () => console.log("WebSocket disconnected");
    
    fetchUserDetails();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize)
    };
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
            <div className='mobile-view'>
              <ChatPage 
                user_id={chatId} 
                onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
                onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
                className="chatBox" 
                socket={ws}
              />
              <Outlet />
            </div>
          ) : (
            <div className='mobile-view'>
              <ChatsPage 
                onSelectChat={handleSelectChat} 
                className="chats" 
                openProfile={() => toggleDialog('isProfileOpen')} 
                profile_details={profileDetails}
                onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
                onJoinChat={() => toggleDialog('isJoinDialogOpen')}  
              />
              <Outlet />
            </div>
          )
        ) : (
          <>
            <ChatsPage 
            onSelectChat={handleSelectChat} 
            className="chats"
            />
            <ChatPage 
              user_id={chatId} 
              onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
              onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
              className="chatBox" 
              socket={ws}
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