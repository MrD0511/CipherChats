import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import './profile_update.scss'
import axiosInstance from '../../axiosInstance';

const EditProfileDialog = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    profile_avatar: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validate_username = async (username) => {
    try {
      const response = await axiosInstance.get(`/user/check_username/${username}`);
      if (response.status === 200) {  // Corrected this part
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Min 3 characters';
    } else {
      // Await for the async username validation here
      const usernameAvailable = await validate_username(formData.username);
      if (!usernameAvailable) {
        newErrors.username = 'Username unavailable';
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        profile_avatar: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();  // Await here for async validation
    if (isValid) {
      const response = await axiosInstance.post('/user/profile/edit',formData) 
      if(response.status == 200){
        console.log("edited successfully")
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-profile-dialog-overlay">
      <div className="edit-profile-dialog">
        <button className="close-button" onClick={onClose}>
          <X size={18} />
        </button>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="avatar-section">
            <img
              src={formData.profile_avatar || '/default-avatar.png'}
              alt="Profile"
              className="current-avatar"
            />
            <label htmlFor="profile_avatar" className="edit-avatar-button">
              <Edit2 size={16} />
              <input
                type="file"
                id="profile_avatar"
                name="profile_avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <button type="submit" className="save-button">Save</button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileDialog;
