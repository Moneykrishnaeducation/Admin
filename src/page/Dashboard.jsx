import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../commonComponent/Navbar";
import { Download } from "lucide-react";
import { get } from "../utils/api-config";
import { useTheme } from "../context/ThemeContext";
const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatValue = (value) => {
    if (typeof value === "number" && !Number.isInteger(value)) {
      return value.toFixed(2);
    }
    return value;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const statsResponse = await get("dashboard/data/");

        if (statsResponse.status === "success") {
          setStatsData(statsResponse.data);
        } else {
          setError("Failed to fetch dashboard stats");
        }

        const activityResponse = await get("dashboard/activity/");

        if (activityResponse.activities) {
          setRecentActivity(activityResponse.activities);
        } else {
          setError("Failed to fetch activities");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);



  // Map API data to cards + route links
  const stats = statsData
    ? [
        { label: "Total Trading Accounts", value: formatValue(statsData.total_trading_accounts), to: "/tradingaccounts" },
        { label: "Total Demo Accounts", value: formatValue(statsData.demo_accounts), to: "/demo" },
        { label: "Total Users", value: formatValue(statsData.total_users), to: "/user" },
        { label: "Total Manager", value: formatValue(statsData.total_managers), to: "/admin" },
        { label: "Total IBs", value: formatValue(statsData.total_ibs), to: "/partnership" },
        { label: "Active MAM Accounts", value: formatValue(statsData.active_mam_accounts), to: "/mamaccount" },
        { label: "MAM Investor Account", value: formatValue(statsData.mam_investor_accounts), to: "/mamaccount?tab=investor" },
        { label: "Total Prop Accounts", value: formatValue(statsData.total_prop_accounts), to: "/propfirm" },
        { label: "Pending Transactions", value: formatValue(statsData.pending_transactions), to: "/transactions" },
        { label: "Pending Tickets", value: formatValue(statsData.pending_tickets), to: "/tickets" },
        { label: "Pending Requests", value: formatValue(statsData.pending_requests), to: "/pendingrequest" },
        { label: "Pending Prop Requests", value: 0, to: "/propfirm?tab=requests" },

      ]
    : [];

  const downloadCSV = (url, filename) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You must be logged in to download CSV.");
      return;
    }

    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/csv",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to download CSV: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to download CSV. Make sure you are logged in.");
      });
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 min-h-screen text-yellow-400 p-4 sm:p-8 transition-all duration-300">

        {/* Stats Buttons */}
        <div className="flex flex-col sm:flex-row justify-around gap-3 sm:gap-6 mb-6">
          <button
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-all text-sm sm:text-base ${
              isDarkMode ? "bg-yellow-500 text-black hover:bg-yellow-300" : "bg-yellow-600 text-white hover:bg-yellow-700"
            }`}
            onClick={() => downloadCSV("/api/export/users/csv/", "users.csv")}
          >
            <Download className="w-5 h-5" /> User Account
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-all text-sm sm:text-base ${
              isDarkMode ? "bg-yellow-500 text-black hover:bg-yellow-300" : "bg-yellow-600 text-white hover:bg-yellow-700"
            }`}
            onClick={() => downloadCSV("/api/export/trading-accounts/csv/", "trading_accounts.csv")}
          >
            <Download className="w-5 h-5" /> Trading Account
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-all text-sm sm:text-base ${
              isDarkMode ? "bg-yellow-500 text-black hover:bg-yellow-300" : "bg-yellow-600 text-white hover:bg-yellow-700"
            }`}
            onClick={() => downloadCSV("/api/export/transactions/csv/", "transactions.csv")}
          >
            <Download className="w-5 h-5" /> Transaction
          </button>
        </div>

        {/* Stats Cards with Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.to}>
              <div
                className="
                  p-4 sm:p-6 rounded-xl text-center
                  bg-gray-300
                  border-l-4 border-animate
                  shadow-[0px_0px_6px_rgba(0,0,0,0.2)]
                  hover:shadow-[0px_0px_10px_rgba(255,215,0,0.25)]
                  transition-all duration-300
                  cursor-pointer
                "
              >
                <p className="text-xs sm:text-sm text-gray-800 font-medium">{stat.label}</p>
                <h2
                  className={`text-sm sm:text-base font-semibold mt-1 ${
                    stat.value < 10 ? "text-gray-600" : stat.value < 100 ? "text-orange-500" : "text-green-600"
                  }`}
                >
                  {stat.value}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 sm:mt-10">
          <h2 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Recent Activities
          </h2>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className={`
                  rounded-xl
                  p-2 sm:p-3
                  shadow-[0px_0px_10px_rgba(255,223,0,0.25)]
                  hover:shadow-[0px_0px_14px_rgba(255,223,0,0.45)]
                  border-l-4 border-yellow-500
                  transition-all duration-300
                  ${isDarkMode ? "bg-gray-800" : "bg-white"}
                `}
              >
                <p className={`text-sm sm:text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {activity.message}
                </p>
                <p className="text-yellow-400 text-xs mt-1">
                  {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}

            {recentActivity.length > 5 && (
              <div className="mt-3">
                <Link to="/activities" className="text-yellow-400 text-sm hover:underline cursor-pointer">
                  View more activities
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;