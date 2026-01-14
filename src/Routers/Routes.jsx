import '../utils/auth-utils.js';

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";

import Navbar from "../commonComponent/Navbar";
import Main from "../commonComponent/Mainpage";
import Login from "../page/Login";

// Admin pages
import Dashboard from "../page/Dashboard";
import Mail from "../page/Mail";
import Settings from "../page/Settings";
import Propfirm from "../page/Propfirm";
import User from "../page/User";
import Tickets from "../page/Tickets";
import Activities from "../page/Activities";
import MamAccount from "../page/MamAccount";
import TradingAccount from "../page/TradingAccount";
import Pendingrequest from "../page/Pendingrequest";
import DemoAccount from "../page/DemoAccount";
import Transactions from "../page/Transactions";
import Partnership from "../page/Partnership";
import AdminManagerList from "../page/Admin";
import GroupConfiguration from "../page/TradingGroup";

// Manager pages
import Dash from "../ManagerComponent/ManagerDashboard";
import ManagerUser from "../ManagerComponent/ManagerUser";
import ManagerTradingaccount from '../ManagerComponent/ManagerTradingaccount';
import ManagerDemo from '../ManagerComponent/ManagerDemo';
import ManagerTickets from '../ManagerComponent/ManagerTickets';
import ManagerActivities from '../ManagerComponent/MangerActivities';
import ManagerTransactions from '../ManagerComponent/ManagerTransActions';
import ManagerMamAccount from '../ManagerComponent/ManagerMamAccount';

/* -------------------------------------------------- */
/* APP ROUTES */
/* -------------------------------------------------- */

const AppRoutes = ({ role }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ---------------- Responsive sidebar ---------------- */
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setIsSidebarOpen(isDesktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- Persist current page in cookies instead of localStorage ---------------- */
  useEffect(() => {
    // Current page is tracked via React Router's location state
    // No need to persist to storage - use location.pathname directly
  }, [location.pathname]);

  const isLoginPage =
    location.pathname === "/" || location.pathname === "/login";

  /* ---------------- Routes ---------------- */

  const adminRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/tradingaccounts", element: <TradingAccount /> },
    { path: "/settings", element: <Settings /> },
    { path: "/propfirm", element: <Propfirm /> },
    { path: "/user", element: <User /> },
    { path: "/tickets", element: <Tickets /> },
    { path: "/activities", element: <Activities /> },
    { path: "/mamaccount", element: <MamAccount /> },
    { path: "/pendingrequest", element: <Pendingrequest /> },
    { path: "/demo", element: <DemoAccount /> },
    { path: "/mail", element: <Mail /> },
    { path: "/transactions", element: <Transactions /> },
    { path: "/partnership", element: <Partnership /> },
    { path: "/admin", element: <AdminManagerList /> },
    { path: "/trading-group", element: <GroupConfiguration /> },
  ];

  const managerRoutes = [
    { path: "/manager/dashboard", element: <Dash /> },
    { path: "/manager/user", element: <ManagerUser /> },
    { path: "/manager/tradingaccounts", element: <ManagerTradingaccount /> },
    { path: "/manager/demo", element: <ManagerDemo /> },
    { path: "/manager/transactions", element: <ManagerTransactions /> },
    { path: "/manager/tickets", element: <ManagerTickets /> },
    { path: "/manager/activities", element: <ManagerActivities /> },
    { path: "/manager/managermam", element: <ManagerMamAccount/> },
  ];

  const allowedRoutes = role === "admin" ? adminRoutes : managerRoutes;
  const fallbackRoute = role === "admin" ? <Dashboard /> : <Dash />;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {!isLoginPage && (
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}

      {isLoginPage ? (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Main
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        >
          <Routes>
            {allowedRoutes.map((r, i) => (
              <Route key={i} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={fallbackRoute} />
          </Routes>
        </Main>
      )}
    </div>
  );
};

/* -------------------------------------------------- */
/* ROOT ROUTER */
/* -------------------------------------------------- */

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

// Helper to get role from cookies instead of localStorage
function getUserRole() {
  let role = "admin"; // Default to admin
  
  try {
    // Get role from cookies (set by backend)
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        const userFromCookie = JSON.parse(userCookie);
        if (userFromCookie?.role) {
          console.debug('[Routes] Role from user cookie:', userFromCookie.role);
          return userFromCookie.role;
        }
      } catch (e) {
        console.debug('[Routes] Failed to parse user cookie:', e);
      }
    }
    
    // Fallback: check individual role cookies
    const cookieRole = getCookie('userRole') || getCookie('user_role');
    if (cookieRole) {
      console.debug('[Routes] Role from role cookie:', cookieRole);
      return cookieRole;
    }
  } catch (e) {
    console.error('[Routes] Error reading user role:', e);
  }
  
  return role;
}

const Routers = () => {
  const [role, setRole] = useState(() => getUserRole());

  useEffect(() => {
    const syncRole = () => {
      const newRole = getUserRole();
      setRole(newRole);
    };

    syncRole();
    window.addEventListener("focus", syncRole);
    window.addEventListener("storage", syncRole);
    
    // Also check periodically in case cookies are updated
    const interval = setInterval(syncRole, 3000);

    return () => {
      window.removeEventListener("focus", syncRole);
      window.removeEventListener("storage", syncRole);
      clearInterval(interval);
    };
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <AppRoutes role={role} />
      </Router>
    </ThemeProvider>
  );
};

export default Routers;

