import React, { useState, useEffect } from "react";
import { X, TrendingUp, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

/**
 * IMPORTANT:
 * Backend APIs are NOT under /api
 * They live at root (/ib-user, /users, etc.)
 */
const apiClient = new AdminAuthenticatedFetch("");

const AddTradingAccountModal = ({
  visible,
  onClose,
  userName,
  userId,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState("Live");
  const [notifications, setNotifications] = useState([]);

  const [liveForm, setLiveForm] = useState({
    accountName: "",
    leverage: "",
    tradingGroup: "",
  });

  const [demoForm, setDemoForm] = useState({
    accountName: "",
    leverage: "",
    initialDeposit: "10000",
  });

  const [leverageOptions, setLeverageOptions] = useState([]);
  const [tradingGroups, setTradingGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ======================================================
   * TOAST NOTIFICATIONS
   * ====================================================== */
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3200);
  };

  /* ======================================================
   * LOAD OPTIONS
   * ====================================================== */
  useEffect(() => {
    if (visible) fetchOptions();
  }, [visible]);

  const fetchOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leverageData, groupsData] = await Promise.all([
        apiClient.get("/api/available-leverage/"),
        apiClient.get("/api/available-groups/"),
      ]);

      // Extract leverage value - if format is "1:1", take the part after the colon
      setLeverageOptions(
        (leverageData?.leverage_options || []).map((o) => {
          const value = typeof o === 'string' ? o : o.value;
          return value.includes(':') ? value.split(':')[1] : value;
        })
      );

      setTradingGroups(
        (groupsData?.groups || []).map((g) => ({
          value: g.id,
          label: g.label,
        }))
      );
    } catch {
      // console.error('Error fetching options:', err);
      setError("Failed to load options");
      showToast("Failed to load options", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
   * FORM HANDLERS
   * ====================================================== */
  const handleLiveFormChange = (e) => {
    const { name, value } = e.target;
    setLiveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDemoFormChange = (e) => {
    const { name, value } = e.target;
    setDemoForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ======================================================
   * CREATE ACCOUNTS
   * ====================================================== */
  const handleCreateLiveAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/api/create-trading-account/", {
        userId: String(userId),
        accountName: liveForm.accountName || userName,
        leverage: String(parseInt(liveForm.leverage, 10)),
        group: liveForm.tradingGroup,
      });

      showToast("Live trading account created successfully!", "success");
      setLiveForm({ accountName: "", leverage: "", tradingGroup: "" });
      setTimeout(() => onClose(), 1000);
    } catch {
      // console.error('Error creating live account:', err);
      setError("Failed to create live account");
      showToast("Failed to create live account", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/api/create-demo-account/", {
        userId: String(userId),
        accountName: demoForm.accountName || userName,
        leverage: String(parseInt(demoForm.leverage, 10)),
        balance: parseFloat(demoForm.initialDeposit),
      });

      showToast("Demo account created successfully!", "success");
      setDemoForm({ accountName: "", leverage: "", initialDeposit: "10000" });
      setTimeout(() => onClose(), 1000);
    } catch {
      // console.error('Error creating demo account:', err);
      setError("Failed to create demo account");
      showToast("Failed to create demo account", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  /* ======================================================
   * UI STYLES
   * ====================================================== */
  const bg = isDarkMode
    ? "bg-gray-900 text-yellow-300"
    : "bg-white text-black";

  const input = isDarkMode
    ? "bg-gray-800 border-yellow-600 text-yellow-200"
    : "bg-gray-50 border-gray-300";

  /* ======================================================
   * RENDER
   * ====================================================== */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div
        className={`w-full max-w-2xl rounded-lg shadow-xl ${bg}
        max-h-[95vh] overflow-y-auto`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-500">
            Add Trading Account
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 p-4 border-b">
          {["Live", "Demo"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
                activeTab === tab
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {tab === "Live" ? (
                <TrendingUp size={16} />
              ) : (
                <Play size={16} />
              )}
              {tab} Account
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center text-sm">Loading...</div>
          )}

          {/* LIVE ACCOUNT */}
          {activeTab === "Live" && (
            <form
              onSubmit={handleCreateLiveAccount}
              className="space-y-4"
            >
              <input
                name="accountName"
                placeholder="Account Name (optional)"
                value={liveForm.accountName}
                onChange={handleLiveFormChange}
                className={`w-full p-2 rounded border ${input}`}
              />

              <select
                name="leverage"
                value={liveForm.leverage}
                onChange={handleLiveFormChange}
                required
                className={`w-full p-2 rounded border ${input}`}
              >
                <option value="">Select Leverage</option>
                {leverageOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <select
                name="tradingGroup"
                value={liveForm.tradingGroup}
                onChange={handleLiveFormChange}
                required
                className={`w-full p-2 rounded border ${input}`}
              >
                <option value="">Select Trading Group</option>
                {tradingGroups.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-yellow-500 flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* DEMO ACCOUNT */}
          {activeTab === "Demo" && (
            <form
              onSubmit={handleCreateDemoAccount}
              className="space-y-4"
            >
              <input
                name="accountName"
                placeholder="Account Name (optional)"
                value={demoForm.accountName}
                onChange={handleDemoFormChange}
                className={`w-full p-2 rounded border ${input}`}
              />

              <select
                name="leverage"
                value={demoForm.leverage}
                onChange={handleDemoFormChange}
                required
                className={`w-full p-2 rounded border ${input}`}
              >
                <option value="">Select Leverage</option>
                {leverageOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="initialDeposit"
                min="100"
                step="0.01"
                value={demoForm.initialDeposit}
                onChange={handleDemoFormChange}
                className={`w-full p-2 rounded border ${input}`}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-yellow-500 flex items-center gap-2"
                >
                  <Play size={16} />
                  Create Demo
                </button>
              </div>
            </form>
          )}
        </div>
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
            {notification.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
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

export default AddTradingAccountModal;
