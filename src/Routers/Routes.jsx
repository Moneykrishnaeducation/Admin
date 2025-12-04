import '../utils/auth-utils.js';

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";

import Navbar from "../commonComponent/Navbar";
import Main from "../commonComponent/Mainpage";
import Login from "../page/Login";
import Dashboard from "../page/Dashboard";
import Mail from "../page/Mail";
import Settings from "../page/Settings";
import Propfirm from "../page/Propfirm";
import User from "../page/User";
import Tickets from "../page/Tickets";
import Activities from "../page/Activities";
import MamAccount from "../page/MamAccount";
import TradingAccount from "../page/tradingaccount";
import Pendingrequest from "../page/Pendingrequest";
import DemoAccount from "../page/DemoAccount";
import Transactions from "../page/Transactions";
import Partnership from "../page/Partnership";
import AdminManagerList from "../page/Admin";
import GroupConfiguration from "../page/TradingGroup";
import Dash from "../ManagerComponent/Dashboard";
import ManagerUser from "../ManagerComponent/User";

const AppRoutes = ({ role }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("current_page", location.pathname);
  }, [location.pathname]);

  // --------------------------
  // ADMIN ROUTES
  // --------------------------
  const adminRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/tradingaccount", element: <TradingAccount /> },
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

  // --------------------------
  // MANAGER ROUTES
  // --------------------------
  const managerRoutes = [
    { path: "/dashboard", element: <Dash /> },
    { path: "/user", element: <ManagerUser /> },
  ];

  const allowedRoutes = role === "admin" ? adminRoutes : managerRoutes;

  const isLoginPage = location.pathname === "/" || location.pathname === "/login";

  return (
    <div className="w-screen flex">
      {!isLoginPage && (
        <Navbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          role={role}
        />
      )}

      {isLoginPage ? (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          <Routes>
            {allowedRoutes.map((r, i) => (
              <Route key={i} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={role === "admin" ? <Dashboard /> : <Dash />} />
          </Routes>
        </Main>
      )}
    </div>
  );
};

const Routers = () => {
  // -----------------------------------
  // GET ROLE FROM LOCAL STORAGE
  // -----------------------------------
  const [role, setRole] = useState(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    return userData?.role || "admin";
  });

  useEffect(() => {
    const checkRole = () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      const newRole = userData?.role || "admin";
      setRole(newRole);
    };

    // Check on mount
    checkRole();

    // Check on window focus (after login)
    window.addEventListener("focus", checkRole);

    return () => window.removeEventListener("focus", checkRole);
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
