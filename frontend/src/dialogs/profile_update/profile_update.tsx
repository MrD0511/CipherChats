import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import './profile_update.scss'
import axiosInstance from '../../axiosInstance';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    username: string;
    name: string;
    profile_url?: string;
  };
  setProfileDetails: React.Dispatch<React.SetStateAction<any>>;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ isOpen, onClose, initialData, setProfileDetails }) => {

  const [formData, setFormData] = useState<{
    username: string;
    name: string;
    profile_photo: File | null;
    profile_photo_preview: string;
  }>({
    username: '',
    name: '',
    profile_photo: null,
    profile_photo_preview: '/default-avatar.png', // Default avatar for preview
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData?.username,
        name: initialData?.name,
        profile_photo: null,
        profile_photo_preview: initialData?.profile_url || '/default-avatar.png',
      });
    }
  }, [initialData]);

  const validate_username = async (username: string) => {
    try {
      const response = await axiosInstance.get(`/user/check_username/${username}`);
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Min 3 characters';
    } else {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prevData) => ({
        ...prevData,
        profile_photo: file,
        profile_photo_preview: URL.createObjectURL(file), // This will generate a preview
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (isValid) {
      const form_data = new FormData();
      form_data.append("username", formData.username);
      form_data.append("name", formData.name);
      if (formData.profile_photo) {
        form_data.append("profile_photo", formData.profile_photo); // Only append if a new photo is selected
      }
      await axiosInstance.post('/user/profile/edit', form_data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).then((response)=>{
        setProfileDetails((prev: any)=>{
          const data = {
            name : response.data.name,
            username : response.data.username,
            profile_url : response.data.profile_photo_url
          }
          if (prev) {
            return {
              ...prev,
              ...data
            }
          }
        })
        setFormData({
          username: response.data.username,
          name: response.data.name,
          profile_photo: response.data.profile_photo_url,
          profile_photo_preview: '/default-avatar.png',
        });
        onClose();
      }).catch((err) => {
        console.error("Error updating profile : ",err);
      });
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
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="avatar-section">
            <img
              src={formData.profile_photo_preview} // Use the preview URL here
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
