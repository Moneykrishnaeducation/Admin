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
} from "lucide-react";

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/users", icon: Users, label: "Users" },
    { path: "/tradingaccounts", icon: CreditCard, label: "Trading Accounts" },
    { path: "/demo", icon: CreditCard, label: "Demo Accounts" },
    { path: "/mam", icon: Users, label: "Mam" },
    { path: "/partnership", icon: Handshake, label: "Partnership" },
    { path: "/pendings", icon: Users, label: "Pendings" },
    { path: "/transactions", icon: Repeat, label: "Transactions" },
    { path: "/mailbox", icon: Monitor, label: "Mailbox" },
    { path: "/tickets", icon: Ticket, label: "Ticket" },
    { path: "/activities", icon: Calendar, label: "Activities" },
    { path: "/admin", icon: Headphones, label: "Admin" },
    { path: "/settings", icon: CreditCard, label: "Settings" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 h-[100vh] w-[60vw] md:w-[40vw] lg:w-[16vw] ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} px-3 py-5  z-50 shadow-lg
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Logo */}
      <div id="logo" className="mb-10">
        <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
          <img
            className="h-10 object-contain mx-auto cursor-pointer hover:scale-105 transition-transform duration-300"
            src="https://vtindex.com/img/logo/logo.svg"
            alt="Logo"
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div id="nav-content" className="flex flex-col gap-3">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-5 py-3 rounded-md text-sm font-medium transition-all duration-300 relative
                ${isActive ? "bg-yellow-600 text-black shadow-[0_0_20px_#FFD700]" : "hover:bg-yellow-900 hover:text-yellow-300"}`}
            >
              <Icon
                className={`text-lg relative z-10 ${isActive ? "text-black" : "text-yellow-400"} transition-all duration-300`}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
