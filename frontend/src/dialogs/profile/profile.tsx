import React from 'react';
import { X, Settings, LogOut, Trash2, Edit2, UserCircleIcon } from 'lucide-react';
import './profile.scss';
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
    <div className="profile-dialog-overlay">
      <div className="profile-dialog">
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="profile-content">
          <div className="profile-header">
            <div className="avatar">
              {user_details?.profile_url ? 
                <img src={user_details?.profile_url} alt={user_details?.name} />   :
                <UserCircleIcon className='noAvatar'/>
              }
              
            </div>
            <h2 className="name">{user_details?.name}</h2>
            <p className="username">@{user_details?.username}</p>
          </div>
          <div className="profile-actions">
            <button className="action-button edit-profile" onClick={handleEditProfile}>
              <Edit2 size={20} />
              Edit Profile
            </button>
            <button className="action-button settings" onClick={handleSettings}>
              <Settings size={20} />
              Settings
            </button>
          </div>
          <div className="profile-footer">
            <button className="action-button logout" onClick={handleLogout}>
              <LogOut size={20} />
              Sign out
            </button>
            <button className="action-button delete-account" onClick={handleDeleteAccount}>
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