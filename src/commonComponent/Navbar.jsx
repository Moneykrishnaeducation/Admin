// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  Home,
  CreditCard,
  Users,
  Handshake,
  Monitor,
  Ticket,
  Repeat,
  Calendar,
  Headphones,
  X,
} from "lucide-react";

// Helper to get a cookie value - properly handles URL-encoded cookies
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
  } catch (e) {
    console.error('Error parsing cookie:', e);
  }
  return '';
}

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [role, setRole] = React.useState("manager");

  // User role - read from cookies only
  React.useEffect(() => {
    const updateRole = () => {
      let currentRole = "manager";

      try {
        // Check user cookie first
        const userCookie = getCookie('user');
        if (userCookie) {
          try {
            const userFromCookie = JSON.parse(userCookie);
            if (userFromCookie?.role) {
              currentRole = userFromCookie.role;
              console.debug('Role from user cookie:', currentRole);
              setRole(currentRole);
              return;
            }
          } catch (e) {
            console.debug('Failed to parse user cookie:', e);
          }
        }

        // Fallback: Check individual role cookies
        const cookieRole = getCookie('userRole') || getCookie('user_role');
        if (cookieRole) {
          currentRole = cookieRole;
          console.debug('Role from role cookie:', currentRole);
        } else {
          console.debug('No role found in cookies, defaulting to manager');
        }

        setRole(currentRole);
      } catch (e) {
        console.error('Error reading user role:', e);
        setRole("manager");
      }
    };

    // Update role immediately on mount
    updateRole();

    // Listen for storage changes (from other tabs/windows)
    window.addEventListener('storage', updateRole);

    // Re-check role when location changes (page navigation)
    return () => {
      window.removeEventListener('storage', updateRole);
    };
  }, [location]);

  // Detect screen size
  React.useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);

      // Auto-open sidebar on desktop
      if (!isMobile) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarOpen]);

  /* ---------------- Menu Definitions ---------------- */

  const adminMenuItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/user", icon: Users, label: "User" },
    { path: "/pendingrequest", icon: CreditCard, label: "Pending request" },
    { path: "/tradingaccounts", icon: CreditCard, label: "Trading Accounts" },
    { path: "/demo", icon: CreditCard, label: "Demo Accounts" },
    { path: "/mamaccount", icon: Users, label: "Mam Account" },
    { path: "/propfirm", icon: Handshake, label: "Prop Firm" },
    { path: "/partnership", icon: Handshake, label: "Partnership" },
    { path: "/transactions", icon: Repeat, label: "Transactions" },
    { path: "/mail", icon: Monitor, label: "Mailbox" },
    { path: "/tickets", icon: Ticket, label: "Ticket" },
    { path: "/activities", icon: Calendar, label: "Activities" },
    { path: "/admin", icon: Headphones, label: "Admin" },
    { path: "/settings", icon: CreditCard, label: "Settings" },
  ];

  const managerMenuItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/user", icon: Users, label: "User" },
    { path: "/tradingaccounts", icon: CreditCard, label: "Trading Accounts" },
    { path: "/demo", icon: CreditCard, label: "Demo Accounts" },
    { path: "/managermam", icon: Users, label: "Mam Account" },
    { path: "/transactions", icon: Repeat, label: "Transactions" },
    { path: "/tickets", icon: Ticket, label: "Ticket" },
    { path: "/activities", icon: Calendar, label: "Activities" },
  ];

  const basePath = role === "manager" ? "/manager" : "";
  const menuItems = (role === "admin" ? adminMenuItems : managerMenuItems).map(
    (item) => ({
      ...item,
      path: basePath + item.path,
    })
  );

  /* ---------------- Render ---------------- */

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileView && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <nav
        className={`nav-1 fixed top-0 left-0 h-screen z-50 overflow-y-auto transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-[70vw] sm:w-[50vw] md:w-[40vw] lg:w-[18vw]
          ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}
          shadow-lg px-3 py-3`}
      >
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <Link to={`${basePath}/dashboard`}>
            <img
              className="h-10 object-contain cursor-pointer"
              src={`/static/admin/logo.svg`}
              alt="Logo"
            />
          </Link>

          {/* Close button (mobile only) */}
          {isMobileView && (
            <button className="ml-auto" onClick={() => setIsSidebarOpen(false)}>
              <X />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={isMobileView ? () => setIsSidebarOpen(false) : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition
                  ${!isActive ? isDarkMode 
                        ? "bg-gradient-to-t from-gray-700 to-black shadow-lg hover:bg-gradient-to-r from-gray-700 to-black shadow-lg" 
                        : "bg-gradient-to-t from-gray-100 to-white shadow-xl hover:bg-gradient-to-r from-gray-100 to-white shadow-xl" : ""}
                  ${
                    isActive
                      ? "bg-yellow-500 text-black shadow-md"
                      : "hover:bg-yellow-500"
                  }`}
              >
                <Icon
                  className={`${
                    isActive ? "text-black" : "text-yellow-400"
                  }`}
                  size={18}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
