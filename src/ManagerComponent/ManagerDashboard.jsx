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

  // Fetch dashboard data + activities
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await get("dashboard/data/");

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

    loadDashboardData();
  }, []);

  // Map API data to cards
  const stats = statsData
    ? [
        { label: "Total Trading Accounts", value: formatValue(statsData.total_trading_accounts) },
        { label: "Total Demo Accounts", value: formatValue(statsData.demo_accounts) },
        { label: "Total Users", value: formatValue(statsData.total_users) },
        { label: "Total Manager", value: formatValue(statsData.total_managers) },
        { label: "Total IBs", value: formatValue(statsData.total_ibs) },
        { label: "Active MAM Accounts", value: formatValue(statsData.active_mam_accounts) },
        { label: "MAM Investor Account", value: formatValue(statsData.mam_investor_accounts) },
        { label: "Total Prop Accounts", value: formatValue(statsData.total_prop_accounts) },
        { label: "Pending Transactions", value: formatValue(statsData.pending_transactions) },
        { label: "Pending Tickets", value: formatValue(statsData.pending_tickets) },
        { label: "Pending Requests", value: formatValue(statsData.pending_requests) },
        { label: "Pending Prop Requests", value: 0 },
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
