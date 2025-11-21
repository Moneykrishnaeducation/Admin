import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";

import Navbar from "../commonComponent/Navbar";
import Main from "../commonComponent/Mainpage";
import Dashboard from "../page/Dashboard";

const AppRoutes = () => {
  const location = useLocation();

  // Store current page in localStorage for all tabs
  useEffect(() => {
    localStorage.setItem('current_page', location.pathname);
  }, [location.pathname]);

  const hideLayout = location.pathname === "/"; // hide navbar & main on login

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="w-screen flex">
      {!hideLayout && (
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      )}

      {!hideLayout ? (
        <Main isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Main>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
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
