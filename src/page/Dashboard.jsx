import React, { useState } from "react";
import Navbar from "../commonComponent/Navbar";
import { Users, CreditCard, Repeat } from "lucide-react"; // import icons

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stats = [
    { label: "Users", value: 1200 },
    { label: "Trading Accounts", value: 450 },
    { label: "Transactions", value: 3200 },
    { label: "Tickets", value: 28 },
    { label: "Users", value: 1200 },
    { label: "Trading Accounts", value: 450 },
    { label: "Transactions", value: 3200 },
    { label: "Tickets", value: 28 },
    { label: "Users", value: 1200 },
  ];

  const recentActivity = new Array(9).fill(null).map((_, index) => ({
    title: `Activity #${index + 1}`,
    description: "Details about this activity will appear here.",
  }));

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar */}
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-black text-yellow-400 p-4 sm:p-8 transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-2"></div>

        {/* Stats Buttons with icons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-6">
          <button className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base">
            <Users className="w-5 h-5" />
            User Account
          </button>
          <button className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base">
            <CreditCard className="w-5 h-5" />
            Trading Account
          </button>
          <button className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base">
            <Repeat className="w-5 h-5" />
            Transaction
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-black p-4 sm:p-6 rounded-xl text-center border border-yellow-300/20 shadow-[0px_0px_6px_rgba(255,255,255,0.2),0px_0px_10px_rgba(255,255,0,0.15)] hover:shadow-[0px_0px_10px_rgba(255,255,255,0.35),0px_0px_15px_rgba(255,255,0,0.25)] transition-all duration-300"
            >
              <p className="text-sm sm:text-lg text-yellow-300">{stat.label}</p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 sm:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Recent Activities</h2>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex flex-col border-b border-yellow-400/40 pb-2 sm:pb-3">
                <p className="text-sm sm:text-base text-white">{activity.description}</p>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
