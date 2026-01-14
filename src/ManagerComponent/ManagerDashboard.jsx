import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Users, CreditCard, Wallet, TrendingUp, AlertCircle, CheckCircle, X, ArrowRight } from "lucide-react";
import { get } from "../utils/api-config";
import { useTheme } from "../context/ThemeContext";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme() || { isDarkMode: true }; // Fallback to dark mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

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

  // Toast notification
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3200);
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

  // Map API data to cards with icons
  // Map stat label to navigation route
  const statRoutes = {
    "Total Clients": "/manager/user",
    "Live Trading Accounts": "/manager/tradingaccounts",
    "Demo Accounts": "/manager/demo",
    "IB Earnings": "/manager/ib-earnings",
    "Pending Transactions": "/manager/transactions",
    "Pending Tickets": "/manager/tickets?tab=pending",
    "Overall Deposits": "/manager/transactions",
    "Real Balance (USD)": "/manager/transactions",
    "Total Withdrawn": "/manager/transactions",
  };

  const stats = statsData
    ? [
        { label: "Total Clients", value: formatValue(statsData.total_clients), icon: Users },
        { label: "Live Trading Accounts", value: formatValue(statsData.live_accounts), icon: TrendingUp },
        { label: "Demo Accounts", value: formatValue(statsData.demo_accounts), icon: Wallet },
        { label: "IB Earnings", value: formatCurrency(statsData.ib_earnings), icon: CreditCard },
        { label: "Pending Transactions", value: formatValue(statsData.pending_transactions), icon: AlertCircle },
        { label: "Pending Tickets", value: formatValue(statsData.pending_tickets), icon: AlertCircle },
        { label: "Overall Deposits", value: formatCurrency(statsData.total_deposits), icon: Download },
        { label: "Real Balance (USD)", value: formatCurrency(statsData.total_balance), icon: Wallet },
        { label: "Total Withdrawn", value: formatCurrency(statsData.total_withdrawn), icon: TrendingUp },
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
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-white">
      <div className={`flex-1 min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} ${isDarkMode ? 'text-white' : 'text-black'} p-4 sm:p-8 transition-all duration-300 overflow-y-auto`}>
        {loading && (
          <div className="flex justify-center items-center min-h-screen">
            <div className="text-yellow-400 text-lg">Loading dashboard...</div>
          </div>
        )}

        {error && (
          <div className={`${isDarkMode ? 'bg-red-900/30 border-red-500' : 'bg-red-100 border-red-400'} border text-red-400 p-4 rounded-lg mb-6`}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const route = statRoutes[stat.label];
                return (
                  <div
                    key={index}
                    className={`rounded-lg p-3 text-center cursor-pointer
                      ${isDarkMode 
                        ? "bg-gradient-to-b from-gray-700 to-black shadow-lg" 
                        : "bg-gradient-to-b from-gray-100 to-white shadow-xl"}
                      h-[110px] w-full mx-auto
                      ${isDarkMode 
                        ? 'hover:shadow-[0_0_20px_rgba(255,215,0,0.8)]' 
                        : 'hover:shadow-[0_0_25px_rgba(255,215,0,1)]'}
                      hover:scale-[1.02]
                      transition-all duration-200
                      flex flex-col items-center justify-center`}
                    onClick={() => route && navigate(route)}
                  >
                    <Icon className="w-8 h-8 mb-2 text-yellow-400" />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{stat.label}</p>
                    <span className="block text-[18px] font-semibold mt-1 text-yellow-400">
                      {stat.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity Section */}
            <div className="mt-4 pl-2 w-full mx-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-yellow-400">Recent Activities</h3>
              </div>

              <div className={`${isDarkMode ? '' : 'bg-gray-50'} rounded-md shadow-md p-4 space-y-3 text-[15px]`} style={isDarkMode ? { backgroundColor: 'oklch(0.16 0 0)' } : {}}>
                {recentActivity.length === 0 ? (
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>No activities found.</p>
                ) : (
                  <>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div
                        key={index}
                        onClick={() => navigate('/manager/activities')}
                        className={`${isDarkMode ? '' : 'bg-gray-200'} p-3 rounded-md hover:shadow-[0_0_10px_rgba(255,215,0,0.4)] transition-all duration-200 flex justify-between items-center cursor-pointer`}
                        style={isDarkMode ? { backgroundColor: 'oklch(0.20 0 0)' } : {}}
                      >
                        <p>
                          <span className="font-bold text-yellow-400">{activity.message}:</span>{" "}
                          <span className={activity.user ? "text-green-400" : "text-red-400"}>
                            {activity.user}
                          </span>{" "}
                          (<span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>)
                        </p>
                        <ArrowRight className="w-4 h-4 text-yellow-400" />
                      </div>
                    ))}

                    {recentActivity.length > 2 && (
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/manager/activities')}
                          className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-all duration-200"
                        >
                          View More Activities →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg text-white transition-all duration-300 border
              ${
                notification.type === 'success'
                  ? 'bg-green-600/90 border-green-500'
                  : notification.type === 'error'
                  ? 'bg-red-600/90 border-red-500'
                  : notification.type === 'warning'
                  ? 'bg-yellow-600/90 border-yellow-500'
                  : 'bg-blue-600/90 border-blue-500'
              }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{notification.message}</span>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;
