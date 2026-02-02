import React, { useState, useEffect } from 'react';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';
import ChatBot from './ChatBox';
import ManagerAdminChat from './ManagerAdminChat';
import { getCookie } from '../utils/api';

const Main = ({ isSidebarOpen, setIsSidebarOpen, children }) => {
  const { isDarkMode } = useTheme();
  const [isMobileView, setIsMobileView] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);

      // Auto open sidebar on desktop
      if (!isMobile) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  // Get user role on mount
  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        try {
          const userData = JSON.parse(userCookie);
          setUserRole(userData.role || null);
          return;
        } catch {
          // console.debug("Could not parse user cookie");
        }
      }
      
      const role = getCookie("userRole") || getCookie("user_role");
      if (role) {
        setUserRole(role);
      }
    } catch (err) {
      // console.error("Error getting user role:", err);
    }
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300
        ${!isMobileView && isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
      `}
    >
      {/* Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* ChatBot */}
      {userRole?.toLowerCase() === 'manager' ? <ManagerAdminChat /> : <ChatBot />}

      {/* Main Content */}
      <div
        onClick={isMobileView ? () => setIsSidebarOpen(false) : undefined}
        className={`overflow-auto h-[calc(100vh-4rem)]
          ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}
          transition-all duration-300 ease-in-out
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default Main;
