import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../commonComponent/Navbar";
import { Download } from "lucide-react";
import { get } from "../utils/api-config";

const ManagerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format numbers with 2 decimal places ONLY if decimal exists
  const formatValue = (value) => {
    if (typeof value === "number" && !Number.isInteger(value)) {
      return value.toFixed(2);
    }
    return value;
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Fetch dashboard data + activities
  const loadDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const managerStatus = window.__managerStatus;
      const url = managerStatus ? `dashboard/data/?manager_status=${encodeURIComponent(managerStatus)}` : 'dashboard/data/';
      const statsResponse = await get(url);

      if (statsResponse.status === "success") {
        setStatsData(statsResponse.data);
      } else {
        setError("Failed to fetch dashboard stats");
      }

      // Fetch dashboard activities
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

  useEffect(() => {
    loadDashboardData();

    // Listen for manager_status messages from parent
    const handleMessage = (event) => {
      if (event.data.type === 'MANAGER_STATUS' && event.data.status) {
        window.__managerStatus = event.data.status;
        console.log('Dashboard iframe received manager_status:', event.data.status);
        // Refetch data with the new manager_status
        loadDashboardData();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Map API data to cards
  const stats = statsData
    ? [
        { label: "Total Clients", value: formatValue(statsData.total_clients) },
        { label: "Live Trading Accounts", value: formatValue(statsData.live_accounts) },
        { label: "Demo Accounts", value: formatValue(statsData.demo_accounts) },
        { label: "IB Earnings", value: formatCurrency(statsData.ib_earnings) },
        { label: "Pending Transactions", value: formatValue(statsData.pending_transactions) },
        { label: "Pending Tickets", value: formatValue(statsData.pending_tickets) },
        { label: "Overall Deposits", value: formatCurrency(statsData.total_deposits) },
        { label: "Real Balance (USD)", value: formatCurrency(statsData.total_balance) },
        { label: "Total Withdrawn", value: formatCurrency(statsData.total_withdrawn) },
      ]
    : [];

  // CSV Download Handler with Authentication

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-yellow-400">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex-1 min-h-screen  text-yellow-400 p-4 sm:p-8 transition-all duration-300">

       
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className=" p-4 sm:p-6 rounded-xl text-center border border-yellow-300/20 shadow-[0px_0px_6px_rgba(255,255,255,0.2),0px_0px_10px_rgba(255,255,0,0.15)] hover:shadow-[0px_0px_10px_rgba(255,255,255,0.35),0px_0px_15px_rgba(255,255,0,0.25)] transition-all duration-300"
            >
              <p className="text-sm sm:text-lg text-yellow-300">{stat.label}</p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 sm:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-white text-sm sm:text-base">No activities found.</p>
            ) : (
              <>
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="border-b border-yellow-400/40 pb-2 sm:pb-3">
                    <p className="text-white text-sm sm:text-base">{activity.message}</p>
                    <p className="text-yellow-400 text-xs mt-1">
                      {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}

                {recentActivity.length > 5 && (
                  <div className="mt-3">
                    <Link
                      to="/activities"
                      className="text-yellow-400 text-sm hover:underline cursor-pointer"
                    >
                      View more activities
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;
