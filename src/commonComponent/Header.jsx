import React, { useState, useEffect, useRef } from "react";
import {
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { Bell, X, CheckCircle, Info, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// Helper to get cookie value
function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        let value = cookie.substring(nameEQ.length);
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
  } catch  {
    //console.error('Error parsing cookie:', e);
  }
  return '';
}

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isDarkMode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications] = useState(false);
  const [userName, setUserName] = useState("Admin User");


  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const panelRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const iconSize = "text-lg md:text-xl";

  // 🔥 User Profile set to static value (skipped API call)

  // 🔹 Mark single notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  // 🔹 Mark all as read
  const markAllAsRead = () => {
    setNotifications([]);
  };

  // 🔹 Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Load logged-in user's name from cookies only (not localStorage)
  useEffect(() => {
    const loadUserName = () => {
      try {
        // Get user data from cookies set by backend
        const userCookie = getCookie('user');
        if (userCookie) {
          const parsed = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie;
          // Try common name fields
          const name = parsed?.first_name || parsed?.name || parsed?.full_name || parsed?.username || parsed?.email;
          if (name) {
            setUserName(name);
            return;
          }
        }

        // Fallback to individual user_name or username cookies
        const userNameCookie = getCookie('user_name') || getCookie('username');
        if (userNameCookie) setUserName(userNameCookie);
      } catch (err) {
        // ignore malformed JSON
        //console.debug('Error loading user name from cookies:', err);
      }
    };

    loadUserName();

    const onStorage = (e) => {
      if (!e) return;
      // Listen for user data updates from other tabs
      if (e.key === 'user' || e.key === 'user_name' || e.key === 'username') {
        loadUserName();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 🔹 Handle logout
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // Call backend logout API to clear cookies and blacklist tokens
      try {
        const response = await fetch('/api/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies in the request
          body: JSON.stringify({})
        });
        
        if (!response.ok) {
          //console.warn('Logout API returned status:', response.status);
          // Continue with logout even if API fails - cookies will be cleared by the backend response
        }
      } catch (error) {
        //console.error('Failed to call logout API:', error);
        // Continue with logout even if API fails
      }

      // Clear all client-side storage
      sessionStorage.clear();
      localStorage.clear();

      // Trigger cross-tab logout notification
      import('../utils/api.js').then(({ triggerCrossTabLogout }) => {
        triggerCrossTabLogout();
      });

      // Small delay to ensure Set-Cookie headers are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to login page
      navigate("/");
    } finally {
      setLogoutLoading(false);
      setShowLogoutPopup(false);
    }
  };

  return (
    <header
      className={`flex h-[4rem] items-center justify-between px-4 md:px-6 py-3 ${
        isDarkMode
          ? "bg-black border-b border-gray-900"
          : "bg-white border-b border-gray-300"
      } shadow-[0_4px_6px_#FFD700] hover:shadow-[0_0_20px_#FFD700] transition-shadow duration-300`}
    >
      {/* SIDEBAR TOGGLE BUTTONS */}
      <>
        <button
          onClick={toggleSidebar}
          className="lg:flex relative w-6 h-6 flex flex-col justify-between items-center mr-3 md:mr-4"
        >
          <span
            className={`block h-0.5 w-6 ${
              isDarkMode ? "bg-white" : "bg-black"
            } rounded transform transition duration-300 ease-in-out ${
              isSidebarOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 ${
              isDarkMode ? "bg-white" : "bg-black"
            } rounded transition duration-300 ease-in-out ${
              isSidebarOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 ${
              isDarkMode ? "bg-white" : "bg-black"
            } rounded transform transition duration-300 ease-in-out ${
              isSidebarOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </>

      {/* CENTER PROFILE SECTION (REPLACES LOGO) */}
<div className="flex-1 flex justify-center">
  <div className="group flex items-center space-x-3 px-5 py-2.5 transition-all duration-300 cursor-pointer">
    {/* User Avatar with Glow */}
    <div className="relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-md group-hover:shadow-lg group-hover:shadow-yellow-400/50 transition-all duration-300">
      <FaUserCircle 
        className={`text-base md:text-lg ${isDarkMode ? "text-black" : "text-white"}`}
      />
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/30 to-transparent animate-pulse"></span>
    </div>
    
    {/* Username Card */}
    <div className="flex flex-col items-start justify-center">
      <span className="text-xs font-bold text-yellow-500 tracking-wider uppercase opacity-70 group-hover:opacity-100 transition-opacity">Welcome</span>
      <span
        className={`text-sm md:text-base font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent group-hover:from-yellow-200 group-hover:to-yellow-500 transition-all duration-300 line-clamp-1`}
      >
        {userName}
      </span>
    </div>

    {/* Status Badge */}
    {/* <div className="hidden sm:flex items-center space-x-1.5 ml-2 pl-2 group-hover:border-yellow-400/60 transition-colors">
      <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-md shadow-emerald-400/50 animate-pulse"></span>
      <span className="text-xs font-semibold text-emerald-400 tracking-wide">Online</span>
    </div> */}
  </div>
</div>


      {/* RIGHT SECTION */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Notification Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`${iconSize} relative ${
            isDarkMode ? "text-white" : "text-black"
          } hover:text-yellow-300 transition-colors`}
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Mode Toggle */}
        <button
          onClick={toggleMode}
          className={`${iconSize} ${
            isDarkMode ? "text-white" : "text-black"
          } hover:text-yellow-300 transition-colors`}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>

       

        {/* LOGOUT ICON */}
         <button
          onClick={() => setShowLogoutPopup(true)}
          className={`${iconSize} ${
            isDarkMode ? "text-white" : "text-black"
          } hover:text-red-500 transition-colors`}
        >
          <FaSignOutAlt />
        </button>
      </div>

      {/* NOTIFICATION PANEL */}
      {showNotifications && (
        <div
          ref={panelRef}
          className={`fixed top-16 right-3 w-[90%] sm:w-[22rem] md:w-[24rem] ${
            isDarkMode
              ? "bg-black border border-yellow-500"
              : "bg-white border border-yellow-500"
          } rounded-lg shadow-[0_0_20px_#FFD700] ${
            isDarkMode ? "text-white" : "text-black"
          } p-4 animate-slideIn z-50`}
        >
          {/* Header */}
          <div
            className={`flex justify-between items-center border-b ${
              isDarkMode ? "border-gray-800" : "border-gray-300"
            } pb-2 mb-3`}
          >
            <h2 className="text-lg font-semibold text-yellow-400">
              Notifications
            </h2>

            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs px-2 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-400 transition"
                >
                  Mark All
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className={`${
                  isDarkMode
                    ? "text-gray-400 hover:text-yellow-400"
                    : "text-gray-600 hover:text-yellow-400"
                } transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            {loadingNotifications ? (
              <p className="text-center text-gray-400">Loading…</p>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-center justify-between space-x-3 ${
                    isDarkMode
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "bg-gray-100 hover:bg-gray-200"
                  } p-3 rounded-md transition`}
                >
                  <div className="flex items-center space-x-3">
                    {notif.icon}
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {notif.message}
                    </p>
                  </div>
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Mark as Read
                  </button>
                </div>
              ))
            ) : (
              <p
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } text-center`}
              >
                No new notifications
              </p>
            )}
          </div>
        </div>
      )}

       {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div
            className={`w-[90%] sm:w-[350px] p-6 rounded-xl shadow-xl ${
              isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
          >
            <h2 className="text-lg font-semibold mb-3">Confirm Logout</h2>
            <p className="text-sm mb-6">Are you sure you want to log out?</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 text-sm"
              >
                {logoutLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );  
};

export default Header;
