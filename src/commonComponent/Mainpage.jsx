import React, { useState, useEffect } from 'react';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';
import ChatBot from './ChatBox';

const Main = ({ isSidebarOpen, setIsSidebarOpen, children }) => {
  const { isDarkMode } = useTheme();
  const [isMobileView, setIsMobileView] = useState(false);

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

  return (
    <div
      className={`w-full transition-all duration-300
        ${!isMobileView && isSidebarOpen ? 'lg:ml-[18vw]' : 'ml-0'}
      `}
    >
      {/* Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* ChatBot */}
      <ChatBot />

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
