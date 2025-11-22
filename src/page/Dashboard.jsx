import React from "react";
import Navbar from "../commonComponent/Navbar";
import { useState } from "react";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stats = [
    { label: "Users", value: 1200 },
    { label: "Trading Accounts", value: 450 },
    { label: "Transactions", value: 3200 },
    { label: "Tickets", value: 28 },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-black text-yellow-400 p-8 transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 p-6 rounded shadow-lg hover:shadow-yellow-500 transition-shadow"
            >
              <p className="text-sm text-yellow-300">{stat.label}</p>
              <h2 className="text-2xl font-bold">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Placeholder Content */}
        <div className="mt-10">
          <div className="bg-gray-900 p-6 rounded shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Recent Activities</h2>
            <p>Activity logs will appear here...</p>
          </div>

          <div className="bg-gray-900 p-6 rounded shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Notifications</h2>
            <p>No new notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
