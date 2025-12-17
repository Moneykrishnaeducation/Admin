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

  /* ---------------- Persist current page ---------------- */
  useEffect(() => {
    localStorage.setItem("current_page", location.pathname);
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

const Routers = () => {
  const [role, setRole] = useState(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    return userData?.role || "admin";
  });

  useEffect(() => {
    const syncRole = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      setRole(userData?.role || "admin");
    };

    syncRole();
    window.addEventListener("focus", syncRole);
    window.addEventListener("storage", syncRole);

    return () => {
      window.removeEventListener("focus", syncRole);
      window.removeEventListener("storage", syncRole);
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
