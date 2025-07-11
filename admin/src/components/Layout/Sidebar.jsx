import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  FilePlus,
  FileText,
  ListOrdered,
  Wrench,
  CheckCircle,
  User,
  Settings,
  Send,
  Archive,
  Tag,
  SquaresUnite,
  Users,
  MessageSquareQuote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/images/img-logo.png";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [isPreJobOpen, setIsPreJobOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const preJobPaths = ["/pre-job/add-rfq", "/pre-job/view-rfq", "/pre-job/view-quotation"];
    const settingsPaths = [
      "/settings/rfq-channel",
      "/settings/product",
      "/settings/item",
      "/settings/unit",
      "/settings/team",
    ];
    setIsPreJobOpen(preJobPaths.includes(location.pathname));
    setIsSettingsOpen(settingsPaths.includes(location.pathname));
  }, [location.pathname]);

  const togglePreJob = () => setIsPreJobOpen(!isPreJobOpen);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  const menuItems = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    {
      label: "Pre-Job",
      icon: <FileText className="w-5 h-5 mr-3" />,
      subItems: [
        { to: "/pre-job/add-rfq", label: "Add RFQ", icon: <FilePlus className="w-5 h-5 mr-3" /> },
        { to: "/pre-job/view-rfq", label: "View RFQ", icon: <FileText className="w-5 h-5 mr-3" /> },
        { to: "/pre-job/view-quotation", label: "Quotation", icon: <MessageSquareQuote className="w-5 h-5 mr-3" /> },
      ],
    },
    {
      to: "/job-execution/initiate-work-order",
      label: "Initiate Work Order",
      icon: <ListOrdered className="w-5 h-5 mr-3" />,
    },
    {
      to: "/job-execution/processing-work-orders",
      label: "Processing Work Orders",
      icon: <Wrench className="w-5 h-5 mr-3" />,
    },
    {
      to: "/post-job/completed-wo",
      label: "Completed WO",
      icon: <CheckCircle className="w-5 h-5 mr-3" />,
    },
    { to: "/profile", label: "Profile", icon: <User className="w-5 h-5 mr-3" /> },
    {
      label: "Settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      subItems: [
        { to: "/settings/series", label: "Series", icon: <Users className="w-5 h-5 mr-3" /> },
        { to: "/settings/rfq-channel", label: "RFQ Channel", icon: <Send className="w-5 h-5 mr-3" /> },
        { to: "/settings/product", label: "Product", icon: <Archive className="w-5 h-5 mr-3" /> },
        { to: "/settings/item", label: "Item", icon: <Tag className="w-5 h-5 mr-3" /> },
        { to: "/settings/unit", label: "Unit", icon: <SquaresUnite className="w-5 h-5 mr-3" /> },
        { to: "/settings/team", label: "Team", icon: <Users className="w-5 h-5 mr-3" /> },
      ],
    },
  ];

  return (
    <motion.div
      className="fixed top-0 left-0 w-72 h-screen bg-white shadow-lg flex flex-col z-50"
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="p-4 flex items-center justify-center border-b border-gray-200">
        <img src={logo} className="w-24" alt="Prime Logo" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <>
                  <button
                    onClick={item.label === "Pre-Job" ? togglePreJob : toggleSettings}
                    className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-gray-700 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
                  >
                    <span className="flex items-center text-sm font-medium">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.label === "Pre-Job" ? (
                      isPreJobOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : isSettingsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <AnimatePresence>
                    {(item.label === "Pre-Job" ? isPreJobOpen : isSettingsOpen) && (
                      <motion.ul
                        className="ml-4 mt-1 space-y-1"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <NavLink
                              to={subItem.to}
                              className={({ isActive }) =>
                                `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                                  ? "bg-indigo-500 text-white"
                                  : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
                                }`
                              }
                              onClick={() => isMobile() && toggleSidebar()}
                            >
                              {subItem.icon}
                              {subItem.label}
                            </NavLink>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-700 hover:bg-indigo-500 hover:text-white"
                    }`
                  }
                  onClick={() => isMobile() && toggleSidebar()}
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

export default Sidebar;