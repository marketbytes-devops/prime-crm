import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, LayoutDashboard, User, Settings, Users, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/images/img-logo.png';

const Sidebar = ({ toggleSidebar }) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
    setIsClientsOpen(false);
    setIsProjectsOpen(false);
  };

  const toggleClients = () => {
    setIsClientsOpen(!isClientsOpen);
    setIsDashboardOpen(false);
    setIsProjectsOpen(false);
  };

  const toggleProjects = () => {
    setIsProjectsOpen(!isProjectsOpen);
    setIsDashboardOpen(false);
    setIsClientsOpen(false);
  };

  const handleLinkClick = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      toggleSidebar();
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      subItems: [
        { to: '/dashboard/project', label: 'Project Dashboard' },
        { to: '/dashboard/client', label: 'Client Dashboard' },
        { to: '/dashboard/hr', label: 'HR Dashboard' },
      ],
    },
    {
      label: 'Clients',
      icon: <Users className="w-5 h-5 mr-3" />,
      subItems: [
        { to: '/clients/add', label: 'Add Client' },
        { to: '/clients/view', label: 'View Client' },
      ],
    },
    {
      label: 'Projects',
      icon: <Folder className="w-5 h-5 mr-3" />,
      subItems: [
        { to: '/projects/details', label: 'Project Details' },
        { to: '/projects/add', label: 'Add Project' },
      ],
    },
    { to: '/profile', label: 'Profile', icon: <User className="w-5 h-5 mr-3" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5 mr-3" /> },
  ];

  return (
    <motion.div
      className="fixed top-0 left-0 w-72 h-screen bg-white shadow-lg flex flex-col border-r border-gray-200"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)' }}
      initial={{ opacity: 0, x: '-100%' }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      role="navigation"
      aria-label="Main sidebar navigation"
    >
      <div className="flex items-center justify-center py-4.5">
        <motion.img
          src={logo}
          className="w-24"
          alt="Prime Logo"
          aria-label="Prime Logo"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <ul className="space-y-4">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <>
                  <button
                    onClick={
                      item.label === 'Dashboard' ? toggleDashboard :
                      item.label === 'Clients' ? toggleClients :
                      toggleProjects
                    }
                    className="flex items-center justify-between w-full p-3 rounded-lg text-black/80 hover:bg-gray-100 hover:text-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-expanded={
                      item.label === 'Dashboard' ? isDashboardOpen :
                      item.label === 'Clients' ? isClientsOpen :
                      isProjectsOpen
                    }
                    aria-controls={`submenu-${index}`}
                    aria-label={`Toggle ${item.label} menu`}
                  >
                    <span className="flex items-center text-sm font-medium">
                      {item.icon}
                      {item.label}
                    </span>
                    {(
                      item.label === 'Dashboard' ? isDashboardOpen :
                      item.label === 'Clients' ? isClientsOpen :
                      isProjectsOpen
                    ) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 hover:text-black" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 hover:text-black" />
                    )}
                  </button>
                  <AnimatePresence>
                    {(item.label === 'Dashboard' ? isDashboardOpen :
                      item.label === 'Clients' ? isClientsOpen :
                      isProjectsOpen) && item.subItems && (
                      <div className="h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                        <motion.ul
                          id={`submenu-${index}`}
                          className="pl-4 mt-2 space-y-2"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          {item.subItems.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <NavLink
                                to={subItem.to}
                                className={({ isActive }) =>
                                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                    isActive
                                      ? 'bg-black text-white'
                                      : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                                  }`
                                }
                                onClick={handleLinkClick}
                                aria-current={location.pathname === subItem.to ? 'page' : undefined}
                              >
                                {subItem.label}
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-black text-white'
                        : 'text-black/80 hover:bg-gray-100 hover:text-black'
                    }`
                  }
                  onClick={handleLinkClick}
                  aria-current={location.pathname === item.to ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
};

Sidebar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;