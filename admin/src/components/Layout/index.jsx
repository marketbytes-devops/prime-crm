import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import apiClient from '../../helpers/apiClient';

const Layout = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleResize = () => {
      setIsSidebarOpen(mediaQuery.matches); 
    };

    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient
        .get('profile/')
        .then((response) => {
          setUser({
            username: response.data.username,
            image: response.data.image,
          });
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, [isAuthenticated]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <motion.div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-white transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
        initial={{ opacity: 0, x: '-100%' }}
        animate={{ opacity: 1, x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.1 }}
      >
        <Sidebar toggleSidebar={toggleSidebar} />
      </motion.div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      <div className="flex-1 flex flex-col">
        <div
          className={`fixed top-0 left-0 right-0 z-10 ${
            isSidebarOpen ? 'md:left-72' : 'left-0'
          } bg-gray-100 shadow-md`}
        >
          <Topbar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
            user={user}
          />
        </div>
        <main
          className={`bg-gradient-to-b from-blue-50 via-indigo-50 to-gray-200 flex-1 pt-20 p-6 ${
            isSidebarOpen ? 'md:ml-72' : 'ml-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;