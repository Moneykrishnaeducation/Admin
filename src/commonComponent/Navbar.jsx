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
  ArrowLeftRight,
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
  } catch  {
    //console.error('Error parsing cookie:', e);
  }
  return '';
}

const Navbar = ({ isSidebarOpen, setIsSidebarOpen, setRouteRefreshKey }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [role, setRole] = React.useState("manager");
  const [isSuperuser, setIsSuperuser] = React.useState(false);

  // User role - read from cookies only
  React.useEffect(() => {
    const updateRole = () => {
      let currentRole = "manager";
      let superuserStatus = false;

      try {
        // Check user cookie first
        const userCookie = getCookie('user');
        if (userCookie) {
          try {
            const userFromCookie = JSON.parse(userCookie);
            if (userFromCookie?.role) {
              currentRole = userFromCookie.role;
              superuserStatus = userFromCookie?.is_superuser === true || userFromCookie?.is_superuser === 'true';
              setRole(currentRole);
              setIsSuperuser(superuserStatus);
              return;
            }
          } catch  {
            //console.debug('Failed to parse user cookie:', e);
          }
        }

        // Fallback: Check individual role cookies
        const cookieRole = getCookie('userRole') || getCookie('user_role');
        if (cookieRole) {
          currentRole = cookieRole;
          //console.debug('Role from role cookie:', currentRole);
        } else {
          //console.debug('No role found in cookies, defaulting to manager');
        }

        setRole(currentRole);
        setIsSuperuser(superuserStatus);
      } catch  {
        //console.error('Error reading user role:', e);
        setRole("manager");
        setIsSuperuser(false);
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

  const adminMenuItems = React.useMemo(() => [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/user", icon: Users, label: "User" },
    { path: "/pendingrequest", icon: CreditCard, label: "Pending request" },
    { path: "/tradingaccounts", icon: CreditCard, label: "Trading Accounts" },
    { path: "/demo", icon: CreditCard, label: "Demo Accounts" },
    { path: "/mamaccount", icon: Users, label: "Mam Account" },
    { path: "/propfirm", icon: Handshake, label: "Prop Firm" },
    { path: "/partnership", icon: Handshake, label: "Partnership" },
    { path: "/transactions", icon: Repeat, label: "Transactions" },
    { path: "/internal-transfer", icon: ArrowLeftRight, label: "Internal Transfer" },
    ...(isSuperuser ? [{ path: "/mail", icon: Monitor, label: "Mailbox" }] : []),
    { path: "/tickets", icon: Ticket, label: "Ticket" },
    { path: "/activities", icon: Calendar, label: "Activities" },
    { path: "/admin", icon: Headphones, label: "Admin" },
    ...(isSuperuser ? [{ path: "/settings", icon: CreditCard, label: "Settings" }] : []),
  ], [isSuperuser]);

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
                    w-[70vw] sm:w-48 md:w-56 lg:w-64
          ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}
          shadow-lg px-3 py-5`}
      >
        {/* Logo */}
        <div id="logo" className="mb-10 relative">
          <Link to={`${basePath}/dashboard`} onClick={() => setIsSidebarOpen(false)}>
            <img
              className="h-10 object-contain mx-auto cursor-pointer hover:scale-105 transition-transform duration-300"
              src={`/static/admin/logo.svg`}
              alt="VTINDEX logo"
              loading="lazy"
              decoding="async"
            />
          </Link>

          {/* Close button (mobile only) - positioned absolute so logo stays centered */}
          {isMobileView && (
            <button className="absolute right-3 top-2" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div id="nav-content" className="flex flex-col gap-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            const baseTextClass = isDarkMode ? 'text-gray-300 hover:text-yellow-400 hover:bg-gray-900' : 'text-gray-700 hover:text-yellow-400 hover:bg-gray-100';
            const activeClass = 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 text-black shadow-[0_0_20px_#FFD700]';
            const hoverBorderClass = isDarkMode ? 'hover:border-white' : 'hover:border-black';

            const itemClass = `flex items-center gap-4 px-5 py-3 rounded-md text-sm font-medium transition-all duration-200 relative ${isActive ? activeClass : baseTextClass}`;

            const content = (
              <>
                <span className={`absolute inset-0 rounded-md border-2 border-transparent ${hoverBorderClass} pointer-events-none transition-all duration-200`}></span>
                <Icon className={`text-xl relative z-10 ${isActive ? 'text-black' : 'text-yellow-400'} transition-all duration-200`} />
                <span className="relative z-10">{item.label}</span>
              </>
            );

            const handleMenuClick = (event) => {
              // Close sidebar on mobile
              if (isMobileView) setIsSidebarOpen(false);

              // If clicking the currently active route, refresh or reload
              if (location.pathname === item.path) {
                event?.preventDefault();
                if (typeof setRouteRefreshKey === 'function') {
                  setRouteRefreshKey((k) => k + 1);
                } else {
                  window.location.assign(item.path);
                }
              }
            };

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleMenuClick}
                className={itemClass}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
