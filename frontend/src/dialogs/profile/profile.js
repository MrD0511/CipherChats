import React, { useState } from 'react';
import { X, Settings, LogOut, Trash2, Edit2, UserCircleIcon } from 'lucide-react';
import './profile.scss';

const ProfileDialog = ({ isOpen, onClose, onEditProfile }) => {
  const [user] = useState({
    name: 'John Doe',
    username: 'johndoe',
    avatarUrl: null,
  });

  const handleEditProfile = () => {
    // Implement edit profile logic
    console.log('Edit profile');
    onEditProfile()
    onClose()
  };

  const handleSettings = () => {
    // Implement settings logic
    console.log('Open settings');
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout');
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
              {user.avatarUrl ? 
                <img src={user.avatarUrl} alt={user.name} />   :
                <UserCircleIcon className='noAvatar'/>
              }
              
            </div>
            <h2 className="name">{user.name}</h2>
            <p className="username">@{user.username}</p>
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
              Log out
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