import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate, useParams, Outlet,} from 'react-router-dom';
import { User, Settings, KeyRound } from 'lucide-react';
import axiosInstance from '../../axiosInstance.js';
import { useLocation } from 'react-router-dom';
import KeysPage from '../keys/keys.js';

const ChatPage = lazy(() => import('../chatPage/chatPage.js'));
const ChatsPage = lazy(() => import('../chats/chatsPage.js'));
const CreateChatDialog = lazy(() => import('../../dialogs/create_chat/create_chat.js'));
const JoinChatDialog = lazy(() => import('../../dialogs/join_chat/join_chat.js'));
const EditProfileDialog = lazy(() => import('../../dialogs/profile_update/profile_update.js'));
const ProfilePage = lazy(() => import('../../dialogs/profile/profile.js'));

type LoadingPlaceholderProps = {
  type: 'base' | 'chats' | 'chat' | 'dialog';
};

const LoadingPlaceholder = ({ type }: LoadingPlaceholderProps) => {
  const classes = {
    base: "flex items-center justify-center w-full h-full bg-[#030404]",
    chats: "col-span-1",
    chat: "col-span-1",
    dialog: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] z-[1000] rounded-md",
  };

  return (
    <div className={`${classes.base} ${classes[type] || ""}`}>
      <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-violet-700 border-gray-900"></div>
    </div>
  );
};

const Layout = () => {
  const [dialogStates, setDialogStates] = useState({
    isCreateDialogOpen: false,
    isJoinDialogOpen: false,
    isEditProfileOpen: false,
    isProfileOpen: false
  });

  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  interface DialogStates {
    isCreateDialogOpen: boolean;
    isJoinDialogOpen: boolean;
    isEditProfileOpen: boolean;
    isProfileOpen: boolean;
  }

  type DialogName = keyof DialogStates;

  interface ProfileDetails {
    profile_url?: string;
    [key: string]: any;
  }

  const toggleDialog = useCallback((dialogName: DialogName) => {
    setDialogStates((prevState: DialogStates) => ({
      ...prevState,
      [dialogName]: !prevState[dialogName]
    }));
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    navigate(`/chats/${id}`);
  }, [navigate]);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth <= 768);
    console.log('Window resized:', window.innerWidth);
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
    
    fetchUserDetails();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Mobile Layout
  if (isMobileView) {
    return (
      <>
        <div className="flex flex-col h-screen w-full bg-[#0e0e0e] overflow-hidden">
          {userId ? (
            <div className="flex-1 w-full h-full overflow-hidden">
              <Suspense fallback={<LoadingPlaceholder type="chat" />}>
                <ChatPage
                  key={userId}
                  userId={userId}
                />
              </Suspense>
            </div>
          ) : (
            <div className="flex-1 w-full h-full overflow-hidden">
              <Suspense fallback={<LoadingPlaceholder type="chats" />}>
                <ChatsPage
                  onSelectChat={handleSelectChat}
                  openProfile={() => toggleDialog('isProfileOpen')}
                  profile_details={profileDetails ?? {}}
                  onCreateChat={() => toggleDialog('isCreateDialogOpen')}
                  onJoinChat={() => toggleDialog('isJoinDialogOpen')}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Mobile Dialogs */}
        <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
          <CreateChatDialog 
            isOpen={dialogStates.isCreateDialogOpen} 
            onClose={() => toggleDialog('isCreateDialogOpen')} 
            onConfirm={() => toggleDialog('isCreateDialogOpen')}
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
            initialData={{
              username: profileDetails?.username ?? '',
              name: profileDetails?.name ?? '',
              profile_url: profileDetails?.profile_url ?? ''
            }}
            setProfileDetails={setProfileDetails} 
          />
        </Suspense>

        <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
          <ProfilePage
            isOpen={dialogStates.isProfileOpen}
            onClose={() => toggleDialog('isProfileOpen')}
            onEditProfile={() => toggleDialog('isEditProfileOpen')}
            user_details={profileDetails}
          />
        </Suspense>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      <div className="h-screen w-full bg-black p-1 overflow-hidden">
        <div className="gap-1 w-full flex  h-full">
          {/* Sidebar */}
          <div className="flex flex-col items-center justify-end rounded-md bg-gray-950 p-4 pb-4 h-full w-24">
            <div className="flex flex-col gap-6 text-sm text-gray-400">
              <div className="w-8 h-8 text-center cursor-pointer hover:text-white transition-colors">
                <Settings className="w-8 h-8" />
              </div>
              <div className="w-8 h-8 text-center cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/keys')}>
                <KeyRound className="w-8 h-8" />
              </div>
              <div 
                onClick={() => toggleDialog('isProfileOpen')} 
                className="w-8 h-8 text-center cursor-pointer hover:text-white transition-colors"
              >
                {profileDetails && profileDetails.profile_url ? (
                  <img 
                    src={profileDetails.profile_url} 
                    alt="profile" 
                    className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-violet-500 transition-all" 
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
            </div>
          </div>

          {/* Chats Panel */}
          <div className="h-full w-2/5">
            <Suspense fallback={<LoadingPlaceholder type="chats" />}>
              <ChatsPage 
                onSelectChat={handleSelectChat} 
                openProfile={() => toggleDialog('isProfileOpen')}
                profile_details={profileDetails ?? {}}
                onCreateChat={() => toggleDialog('isCreateDialogOpen')}
                onJoinChat={() => toggleDialog('isJoinDialogOpen')}
              />
            </Suspense>
          </div>

          {/* Main Content Panel */}
          <div className="h-full overflow-hidden w-3/5">
            {userId ? (
              <Suspense fallback={<LoadingPlaceholder type="chat" />}>
                <ChatPage
                  key={userId}
                  userId={userId}
                />
              </Suspense>
            ) : (
              location.pathname === "/keys" ? 
                <KeysPage onCreateChannel={() => toggleDialog('isCreateDialogOpen')} />
              :

              <div className="flex flex-col items-center justify-center gap-6 rounded-md bg-gray-950 text-gray-200 h-full w-full">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-semibold text-white">Welcome to Chat</h2>
                  <p className="text-gray-400 max-w-md">
                    Create a new channel or join an existing one to start chatting
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 
                              hover:from-cyan-700 hover:to-violet-700 hover:shadow-lg transform hover:-translate-y-0.5 
                              px-8 py-3 text-white font-medium shadow-lg transition-all duration-200
                             active:translate-y-0 active:shadow-md min-w-[140px]"
                    onClick={() => toggleDialog('isCreateDialogOpen')}
                  >
                    Create Channel
                  </button>
                  <button
                    className="rounded-full bg-[#3f3f5f] px-8 py-3 text-white font-medium shadow-lg
                             transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:bg-[#4a4a6a]
                             active:translate-y-0 active:shadow-md min-w-[140px]"
                    onClick={() => toggleDialog('isJoinDialogOpen')}
                  >
                    Join Channel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Dialogs */}
      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <CreateChatDialog 
          isOpen={dialogStates.isCreateDialogOpen} 
          onClose={() => toggleDialog('isCreateDialogOpen')} 
          onConfirm={() => toggleDialog('isCreateDialogOpen')}
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
          initialData={{
            username: profileDetails?.username ?? '',
            name: profileDetails?.name ?? '',
            profile_url: profileDetails?.profile_url ?? ''
          }}
          setProfileDetails={setProfileDetails} 
        />
      </Suspense>

      <Suspense fallback={<LoadingPlaceholder type="dialog" />}>
        <ProfilePage
          isOpen={dialogStates.isProfileOpen}
          onClose={() => toggleDialog('isProfileOpen')}
          onEditProfile={() => toggleDialog('isEditProfileOpen')}
          user_details={profileDetails}
        />
      </Suspense>
    </>
  );
};

export default Layout;