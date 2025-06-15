import React from 'react';
import { X, Settings, LogOut, Trash2, Edit2, UserCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, resetDb } from '../../indexdb.service';

const ProfileDialog = ({ isOpen, onClose, onEditProfile, user_details }
  : {
    isOpen: boolean;
    onClose: () => void;
    onEditProfile: () => void; // Callback when editing profile
    user_details: {
      name?: string;
      username?: string;
      profile_url?: string;
    } | null; // User details object
  }
) => {
  
  const navigate = useNavigate()

  const handleEditProfile = () => {
    // Implement edit profile logic
    onEditProfile()
    onClose()
  };

  const handleSettings = () => {
    // Implement settings logic
    console.log('Open settings');
  };

  const handleLogout = async () => {
    localStorage.clear();
    // indexedDB.deleteDatabase()
    await resetDb();
    navigate('/signin');
  };

  const handleDeleteAccount = () => {
    // Implement delete account logic
    console.log('Delete account');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(138, 43, 226, 0.1) 1px, transparent 1px),
                radial-gradient(circle at 75% 75%, rgba(74, 144, 226, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }}
          />
        </div>

        {/* Close button */}
        <button 
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <div className="relative p-6 pt-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-gradient-to-r from-violet-500 to-cyan-400 p-1 bg-gradient-to-r from-violet-500 to-cyan-400">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                  {user_details?.profile_url ? 
                    <img 
                      src={user_details?.profile_url} 
                      alt={user_details?.name}
                      className="w-full h-full object-cover"
                    /> :
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  }
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {user_details?.name}
            </h2>
            <p className="text-gray-400 text-sm">
              @{user_details?.username}
            </p>
          </div>

          {/* Profile Actions */}
          <div className="space-y-3 mb-6">
            <button 
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-violet-700 to-cyan-700 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              onClick={handleEditProfile}
            >
              <Edit2 size={20} />
              Edit Profile
            </button>
            <button 
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md border border-gray-600 hover:border-gray-500"
              onClick={handleSettings}
            >
              <Settings size={20} />
              Settings
            </button>
          </div>

          {/* Profile Footer */}
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <button 
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md border border-gray-600 hover:border-gray-500"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              Sign out
            </button>
            <button 
              className="w-full flex items-center gap-3 p-3 bg-red-800 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md border border-red-600 hover:border-red-500"
              onClick={handleDeleteAccount}
            >
              <Trash2 size={20} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDialog;