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
import ManagerDashboard from '../ManagerComponent/Dashboard.jsx';
import ManagerUser from '../ManagerComponent/User.jsx';

const AppRoutes = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("current_page", location.pathname);
  }, [location.pathname]);

  // --------------------------
  // GET ROLE FROM LOCAL STORAGE
  // --------------------------
  const userData = JSON.parse(localStorage.getItem("user"));
  const role = userData?.role || "manager"; // default manager

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
    { path: "manager/dashboard", element: <ManagerDashboard /> },
    { path: "manager/user", element: <ManagerUser /> },
    { path: "manager/tradingaccount", element: <TradingAccount /> },
    { path: "manager/tradingaccounts", element: <TradingAccount /> },
    { path: "manager/demo", element: <DemoAccount /> },
    { path: "manager/transactions", element: <Transactions /> },
    { path: "manager/tickets", element: <Tickets /> },
    { path: "manager/activities", element: <Activities /> },
  ];

  const allowedRoutes = role === "admin" ? adminRoutes : managerRoutes;

  const isLoginPage = location.pathname === "/" || location.pathname === "/login";

  return (
    <div className="w-screen flex">
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
        <Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          <Routes>
            {allowedRoutes.map((r, i) => (
              <Route key={i} path={r.path} element={r.element} />
            ))}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Main>
      )}
    </div>
  );
};

const Routers = () => {
  // -------------------------------------------
  // BASE URL CHANGES BASED ON USER ROLE
  // -------------------------------------------
  const userData = JSON.parse(localStorage.getItem("user"));
  const role = userData?.role || "manager";

  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
};

export default Routers;
