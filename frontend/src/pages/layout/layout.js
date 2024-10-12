import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import './layout.scss';
import { User, Settings, KeyRound } from 'lucide-react';
import axiosInstance from '../../axiosInstance.js';

// Lazily load components
const ChatPage = lazy(() => import('../chatPage/chatPage.js'));
const ChatsPage = lazy(() => import('../chats/chatsPage.js'));
const CreateChatDialog = lazy(() => import('../../dialogs/create_chat/create_chat.js'));
const JoinChatDialog = lazy(() => import('../../dialogs/join_chat/join_chat.js'));
const EditProfileDialog = lazy(() => import('../../dialogs/profile_update/profile_update.js'));
const ProfilePage = lazy(() => import('../../dialogs/profile/profile.js'));

// Custom loading component
const LoadingPlaceholder = ({ type }) => (
  <div className={`loading-placeholder ${type}`}>
    <div className="loading-animation"></div>
  </div>
);

const Layout = () => {
  const [dialogStates, setDialogStates] = useState({
    isCreateDialogOpen: false,
    isJoinDialogOpen: false,
    isEditProfileOpen: false,
    isProfileOpen: false
  });
  
  const [profileDetails, setProfileDetails] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [ws, setWs] = useState(null);
  const { chatId, userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/signin');
    } 
  }, [navigate]);

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

    const websocket_url = process.env.REACT_APP_WEBSOCKET_URL;
    const token = localStorage.getItem('access_token');
    const socket = new WebSocket(`${websocket_url}/ws/chat?token=${token}`);
    setWs(socket);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onclose = () => console.log("WebSocket disconnected");
    
    fetchUserDetails();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
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
              <Suspense fallback={<LoadingPlaceholder type="chat" />}>
                <ChatPage 
                  user_id={chatId} 
                  onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
                  onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
                  className="chatBox" 
                  socket={ws}
                />
                <Outlet />
              </Suspense>
            </div>
          ) : (
            <div className='mobile-view'>
              <Suspense fallback={<LoadingPlaceholder type="chats" />}>
                <ChatsPage 
                  onSelectChat={handleSelectChat} 
                  className="chats" 
                  openProfile={() => toggleDialog('isProfileOpen')} 
                  profile_details={profileDetails}
                  onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
                  onJoinChat={() => toggleDialog('isJoinDialogOpen')}  
                />
                <Outlet />
              </Suspense>
            </div>
          )
        ) : (
          <>
            <Suspense fallback={<LoadingPlaceholder type="chats" />}>
              <ChatsPage 
                onSelectChat={handleSelectChat} 
                className="chats"
              />
            </Suspense>
            <Suspense fallback={<LoadingPlaceholder type="chat" />}>
              <ChatPage 
                user_id={chatId} 
                onCreateChat={() => toggleDialog('isCreateDialogOpen')} 
                onJoinChat={() => toggleDialog('isJoinDialogOpen')} 
                className="chatBox" 
                socket={ws}
              />
            </Suspense>
          </>
        )}
      </div>
      
      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <CreateChatDialog 
          isOpen={dialogStates.isCreateDialogOpen} 
          onClose={() => toggleDialog('isCreateDialogOpen')} 
        />
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <JoinChatDialog 
          isOpen={dialogStates.isJoinDialogOpen} 
          onClose={() => toggleDialog('isJoinDialogOpen')} 
          onJoin={handleSelectChat} 
        />
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <EditProfileDialog 
          isOpen={dialogStates.isEditProfileOpen} 
          onClose={() => toggleDialog('isEditProfileOpen')}
          initialData={profileDetails} 
        />
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <ProfilePage
          isOpen={dialogStates.isProfileOpen}
          onClose={() => toggleDialog('isProfileOpen')}
          onEditProfile={() => toggleDialog('isEditProfileOpen')}
        />
      </Suspense>
    </>
  );
};

export default Layout;