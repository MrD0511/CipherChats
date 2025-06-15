import React, { useState, useEffect } from 'react';
import { X, Edit2, User } from 'lucide-react';
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
    profile_photo_preview: '/default-avatar.png',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

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
    } else if (formData.username !== initialData.username) {
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prevData) => ({
        ...prevData,
        profile_photo: file,
        profile_photo_preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const isValid = await validateForm();
    if (isValid) {
      const form_data = new FormData();
      form_data.append("username", formData.username);
      form_data.append("name", formData.name);
      if (formData.profile_photo) {
        form_data.append("profile_photo", formData.profile_photo);
      }
      
      try {
        const response = await axiosInstance.post('/user/profile/edit', form_data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setProfileDetails((prev: any) => {
          const data = {
            name: response.data.name,
            username: response.data.username,
            profile_url: response.data.profile_photo_url
          };
          if (prev) {
            return {
              ...prev,
              ...data
            };
          }
        });
        
        onClose();
      } catch (err) {
        console.error("Error updating profile: ", err);
      }
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
        
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
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Edit Profile</h2>
            <p className="text-gray-400 text-sm">Update your profile information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-gradient-to-r from-violet-500 to-cyan-400 p-1 bg-gradient-to-r from-violet-500 to-cyan-400">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                    {formData.profile_photo_preview && formData.profile_photo_preview !== '/default-avatar.png' ? 
                      <img 
                        src={formData.profile_photo_preview} 
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      /> :
                      <User className="w-10 h-10 text-gray-400" />
                    }
                  </div>
                </div>
                
                {/* Edit overlay */}
                <label 
                  htmlFor="profile_avatar" 
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <Edit2 size={20} className="text-white" />
                  <input
                    type="file"
                    id="profile_avatar"
                    name="profile_avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-gray-400 text-sm mt-2">Click to change avatar</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.username 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:border-violet-500 focus:ring-violet-500'
                  }`}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:border-violet-500 focus:ring-violet-500'
                  }`}
                  placeholder="Enter display name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-600 hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-700 to-cyan-700 hover:from-violet-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileDialog;