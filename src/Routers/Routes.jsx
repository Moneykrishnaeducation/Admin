import { Navigate } from "react-router-dom";
// Simple auth check: returns true if user cookie exists and has a role
function isAuthenticated() {
  const userCookie = getCookie('user');
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      return !!user?.role;
    } catch {
      return false;
    }
  }
  // Fallback: check for role cookies
  const cookieRole = getCookie('userRole') || getCookie('user_role');
  return !!cookieRole;
}

// Route guard for protected routes
function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    // Call backend logout to ensure server-side session is cleared,
    // then clear client-side auth cookies. Render the Login UI
    // instead of performing a <Navigate> redirect.
    (async () => {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } 
      catch {
        // console.debug('[Routes] Logout API call failed:', e);
      }

      try {
        document.cookie = 'user=; Max-Age=0; path=/';
        document.cookie = 'userRole=; Max-Age=0; path=/';
        document.cookie = 'user_role=; Max-Age=0; path=/';
      } catch {
        // console.debug('[Routes] Clearing cookies failed:', e);
      }
    })();

    return <Navigate to="/" replace />;
  }

  return children;
}
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
import PamAccount from "../page/pamAccount.jsx";  
import TradingAccount from "../page/TradingAccount";
import Pendingrequest from "../page/Pendingrequest";
import DemoAccount from "../page/DemoAccount";
import Transactions from "../page/Transactions";
import Partnership from "../page/Partnership";
import AdminManagerList from "../page/Admin";
import GroupConfiguration from "../page/TradingGroup";
import InternalTransfer from "../page/InternalTransfer";

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
  const [routeRefreshKey, setRouteRefreshKey] = useState(0);

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


  // Wrap protected routes with RequireAuth
  const adminRoutes = [
    { path: "/dashboard", element: <RequireAuth><Dashboard /></RequireAuth> },
    { path: "/tradingaccounts", element: <RequireAuth><TradingAccount /></RequireAuth> },
    { path: "/settings", element: <RequireAuth><Settings /></RequireAuth> },
    { path: "/propfirm", element: <RequireAuth><Propfirm /></RequireAuth> },
    { path: "/user", element: <RequireAuth><User /></RequireAuth> },
    { path: "/tickets", element: <RequireAuth><Tickets /></RequireAuth> },
    { path: "/activities", element: <RequireAuth><Activities /></RequireAuth> },
    { path: "/mamaccount", element: <RequireAuth><MamAccount /></RequireAuth> },
    { path: "/pamaccount", element: <RequireAuth><PamAccount /></RequireAuth> },
    { path: "/pendingrequest", element: <RequireAuth><Pendingrequest /></RequireAuth> },
    { path: "/demo", element: <RequireAuth><DemoAccount /></RequireAuth> },
    { path: "/mail", element: <RequireAuth><Mail /></RequireAuth> },
    { path: "/transactions", element: <RequireAuth><Transactions /></RequireAuth> },
    { path: "/partnership", element: <RequireAuth><Partnership /></RequireAuth> },
    { path: "/admin", element: <RequireAuth><AdminManagerList /></RequireAuth> },
    { path: "/trading-group", element: <RequireAuth><GroupConfiguration /></RequireAuth> },
    { path: "/internal-transfer", element: <RequireAuth><InternalTransfer /></RequireAuth> },
  ];

  const managerRoutes = [
    { path: "/manager/dashboard", element: <RequireAuth><Dash /></RequireAuth> },
    { path: "/manager/user", element: <RequireAuth><ManagerUser /></RequireAuth> },
    { path: "/manager/tradingaccounts", element: <RequireAuth><ManagerTradingaccount /></RequireAuth> },
    { path: "/manager/demo", element: <RequireAuth><ManagerDemo /></RequireAuth> },
    { path: "/manager/transactions", element: <RequireAuth><ManagerTransactions /></RequireAuth> },
    { path: "/manager/tickets", element: <RequireAuth><ManagerTickets /></RequireAuth> },
    { path: "/manager/activities", element: <RequireAuth><ManagerActivities /></RequireAuth> },
    { path: "/manager/managermam", element: <RequireAuth><ManagerMamAccount/></RequireAuth> },
  ];

  const allowedRoutes = role === "admin" ? adminRoutes : managerRoutes;
  const fallbackRoute = role === "admin" ? <RequireAuth><Dashboard /></RequireAuth> : <RequireAuth><Dash /></RequireAuth>;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      {!isLoginPage && (
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setRouteRefreshKey={setRouteRefreshKey}
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
          <Routes key={routeRefreshKey}>
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
  } catch {
    // console.error('Error parsing cookie:', e);
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
          // console.debug('[Routes] Role from user cookie:', userFromCookie.role);
          return userFromCookie.role;
        }
      } catch {
        // console.debug('[Routes] Failed to parse user cookie:', e);
      }
    }
    
    // Fallback: check individual role cookies
    const cookieRole = getCookie('userRole') || getCookie('user_role');
    if (cookieRole) {
      // console.debug('[Routes] Role from role cookie:', cookieRole);
      return cookieRole;
    }
  } catch {
    // console.error('[Routes] Error reading user role:', e);
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

