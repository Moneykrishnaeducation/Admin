import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";

import Navbar from "../commonComponent/Navbar";
import Main from "../commonComponent/Mainpage";
import Dashboard from "../page/Dashboard";
import Mail from "../page/Mail";
import Settings from "../page/Settings";
import Propfirm from "../page/Propfirm";
import Tickets from "../page/Tickets";
import Activities from "../page/Activities";
import MamAccount from "../page/MamAccount";
import Login from "../page/Login";

const AppRoutes = () => {
  const location = useLocation();

  // Store current page in localStorage for all tabs
  useEffect(() => {
    localStorage.setItem('current_page', location.pathname);
  }, [location.pathname]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="w-screen flex">
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/propfirm" element={<Propfirm />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/mamaccount" element={<MamAccount />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Dashboard />} />
          <Route path="/mail" element={<Mail />} />
        </Routes>
      </Main>
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
