import React, { useState, useEffect } from "react";
import { X, TrendingUp, Play } from "lucide-react";
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
        apiClient.get("/available-leverage/"),
        apiClient.get("/available-groups/"),
      ]);

      setLeverageOptions(
        (leverageData?.leverage_options || []).map((o) => o.value)
      );

      setTradingGroups(
        (groupsData?.groups || []).map((g) => ({
          value: g.id,
          label: g.label,
        }))
      );
    } catch (err) {
      setError("Failed to load options");
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
      await apiClient.post("/create-trading-account/", {
        userId: String(userId),
        accountName: liveForm.accountName || userName,
        leverage: String(parseInt(liveForm.leverage, 10)),
        group: liveForm.tradingGroup,
      });

      onClose();
    } catch (err) {
      setError("Failed to create live account");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/create-demo-account/", {
        userId: String(userId),
        accountName: demoForm.accountName || userName,
        leverage: String(parseInt(demoForm.leverage, 10)),
        balance: parseFloat(demoForm.initialDeposit),
      });

      onClose();
    } catch (err) {
      setError("Failed to create demo account");
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
    </div>
  );
};

export default AddTradingAccountModal;
