import React, { useState, useEffect } from 'react';
import Header from './Header';
import { useTheme } from '../context/ThemeContext';
import ChatBot from './ChatBox';

const Main = ({ isSidebarOpen, setIsSidebarOpen, children }) => {
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`w-full ${isSidebarOpen ? 'lg:ml-[16vw]' : ''}`}>
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <ChatBot/>
      <div onClick={isMobile ? () => setIsSidebarOpen(false) : undefined} className={`overflow-auto h-[90vh] ${isDarkMode ? 'bg-black' : 'bg-white'} transition-all duration-300 ease-in-out `}>{children}</div>
    </div>
  );
};

export default Main;
