import { Menu, X, LogOut, Settings, Globe, AlarmClockCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import apiClient from '../../helpers/apiClient';
import Dropdown from '../Dropdown';

const Topbar = ({ toggleSidebar, isSidebarOpen, isAuthenticated, setIsAuthenticated, user, setWidgetSettings, setLanguage }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [language, setLocalLanguage] = useState('en');
  const [localWidgetSettings, setLocalWidgetSettings] = useState({
    totalProjects: true,
    totalHoursLogged: true,
    completedProjects: true,
    ongoingProjects: true,
    dueProjects: true,
  });
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user?.image) {
      setProfileImage(user.image);
    } else if (isAuthenticated) {
      apiClient
        .get('profile/')
        .then((response) => {
          setProfileImage(response.data.image || null);
        })
        .catch((error) => {
          console.error('Error fetching profile image:', error);
        });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let timer;
    if (isCheckedIn) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const handleLanguageChange = (lang) => {
    setLocalLanguage(lang);
    setLanguage(lang);
  };

  const handleWidgetSettingsChange = (widget) => {
    const updatedSettings = {
      ...localWidgetSettings,
      [widget]: !localWidgetSettings[widget],
    };
    setLocalWidgetSettings(updatedSettings);
    setWidgetSettings(updatedSettings);
  };

  const handleCheckInOut = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false);
      setElapsedTime(0);
    } else {
      setIsCheckedIn(true);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="rounded-b-3xl flex items-center justify-between p-4 bg-white text-black shadow-lg border-b border-gray-200"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.1 }}
    >
      <div className="flex items-center space-x-2">
        <button
          className="p-2 rounded transition-colors duration-200 bg-gray-100 hover:bg-black hover:text-white"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleCheckInOut}
          className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center space-x-2 min-w-fit whitespace-nowrap"
        >
          <AlarmClockCheck size={12} className="w-4 h-4 text-gray-600" />
          <span className='text-sm font-semibold'>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
        </button>
        {isCheckedIn && (
          <span className="text-sm text-black/80">{formatTime(elapsedTime)}</span>
        )}
        <Dropdown triggerText="Widget Settings" icon={Settings}>
          <div className="space-y-2 w-[250px]">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localWidgetSettings.totalProjects}
                onChange={() => handleWidgetSettingsChange('totalProjects')}
                className="form-checkbox accent-black"
              />
              <span className="text-sm">Show Total Projects</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localWidgetSettings.totalHoursLogged}
                onChange={() => handleWidgetSettingsChange('totalHoursLogged')}
                className="form-checkbox accent-black"
              />
              <span className="text-sm">Show Hours Logged</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localWidgetSettings.completedProjects}
                onChange={() => handleWidgetSettingsChange('completedProjects')}
                className="form-checkbox accent-black"
              />
              <span className="text-sm">Show Completed Projects</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localWidgetSettings.ongoingProjects}
                onChange={() => handleWidgetSettingsChange('ongoingProjects')}
                className="form-checkbox accent-black"
              />
              <span className="text-sm">Show Ongoing Projects</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localWidgetSettings.dueProjects}
                onChange={() => handleWidgetSettingsChange('dueProjects')}
                className="form-checkbox accent-black"
              />
              <span className="text-sm">Show Due Projects</span>
            </label>
          </div>
        </Dropdown>
        <Dropdown triggerText="Language" icon={Globe}>
          <div className="w-[250px]">
            <button
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
              onClick={() => handleLanguageChange('en')}
            >
              English
            </button>
            <button
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
              onClick={() => handleLanguageChange('es')}
            >
              Spanish
            </button>
            <button
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
              onClick={() => handleLanguageChange('fr')}
            >
              French
            </button>
          </div>
        </Dropdown>
        {isAuthenticated && user?.username ? (
          <span className="hidden sm:block text-sm text-black/80 font-medium">{user.username}</span>
        ) : (
          <span className="hidden sm:block text-sm text-gray-500 font-medium">Guest</span>
        )}
        {isAuthenticated && profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border border-gray-300"
            onError={() => setProfileImage(null)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300"></div>
        )}
        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setIsAuthenticated(false);
              }}
              className="flex items-center space-x-2 rounded text-sm text-black/80 hover:bg-black hover:text-white transition-colors duration-300 p-2"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Topbar;