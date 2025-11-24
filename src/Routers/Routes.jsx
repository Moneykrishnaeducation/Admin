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

const AppRoutes = () => {
  const location = useLocation();

  // Store current page in localStorage for all tabs
  useEffect(() => {
    localStorage.setItem('current_page', location.pathname);
  }, [location.pathname]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="w-screen flex">
      {!isLoginPage && (
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      )}

      {isLoginPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* If user navigates to root while on login, keep them on login */}
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tradingaccount" element={<TradingAccount />} />
            <Route path="/tradingaccounts" element={<TradingAccount />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/propfirm" element={<Propfirm />} />
            <Route path="/user" element={<User />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/mamaccount" element={<MamAccount />} />
            <Route path="/pendingrequest" element={<Pendingrequest />} />
            <Route path="/demo" element={<DemoAccount />} />
            <Route path="/mail" element={<Mail />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
          </Routes>
        </Main>
      )}
    </div>
  );
};

const Routers = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
};

export default Routers;
