import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../helpers/apiClient';

const Profile = () => {
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    username: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient
      .get('profile/')
      .then((response) => {
        setProfile(response.data);
        setImagePreview(response.data.image || null);
      })
      .catch((error) => {
        setError('Failed to fetch profile data');
        console.error(error);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({ ...profile, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('email', profile.email);
    formData.append('name', profile.name || '');
    formData.append('username', profile.username || '');
    if (profile.image instanceof File) {
      formData.append('image', profile.image);
    } else if (!profile.image) {
      formData.append('image', '');
    }

    apiClient
      .put('profile/', formData)
      .then((response) => {
        setProfile(response.data);
        setImagePreview(response.data.image || null);
        setMessage('Profile updated successfully');
      })
      .catch((error) => {
        setError(error.response?.data?.detail || 'Failed to update profile');
      });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setMessage('');
    apiClient
      .post('change-password/', { new_password: newPassword, confirm_password: confirmPassword })
      .then(() => {
        setMessage('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((error) => {
        setError(error.response?.data?.detail || 'Failed to change password');
      });
  };

  return (
    <motion.div
      className="p-6 mx-auto"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-left text-black">Profile Settings</h2>
      {error && (
        <motion.p
          className="text-red-600 mb-6 text-center font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.p>
      )}
      {message && (
        <motion.p
          className="text-green-600 mb-6 text-center font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="p-6 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-black">User Information</h3>
          <div className="space-y-6 divide-y divide-gray-200">
            <div className="pt-6">
              <div className="flex justify-center mb-4">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                      onError={() => setImagePreview(null)}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 border-2 border-gray-200 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </motion.div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-2 border border-gray-200 rounded bg-gray-100 text-black/80 cursor-not-allowed"
              />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              />
            </div>
            <div className="pt-4">
              <button
                onClick={handleProfileUpdate}
                className="w-full p-2 bg-black text-white rounded hover:bg-black/80 transition-colors duration-200 font-medium"
              >
                Update Profile
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-6 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-black">Change Password</h3>
          <div className="space-y-6 divide-y divide-gray-200">
            <div className="pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              />
            </div>
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} // Fixed typo: onChae -> onChange
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-black text-black/80 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
              />
            </div>
            <div className="pt-4">
              <button
                onClick={handlePasswordChange}
                className="w-full p-2 bg-black text-white rounded hover:bg-black/80 transition-colors duration-200 font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;