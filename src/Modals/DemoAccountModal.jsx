import React, { useState, useEffect } from "react";
import { X, Eye, Trash2 } from "lucide-react";

export default function DemoAccountModal({ isOpen, onClose, userRow, isDarkMode }) {
  const [search, setSearch] = useState("");
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = userRow ? userRow.id ?? userRow.userId ?? userRow.user_id : null;

  useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;
        const params = new URLSearchParams();
        params.set("user_id", String(userId));
        if (search) params.set("search", search);
        const res = await fetch(`/api/demo_accounts/?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to load demo accounts: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setDemoAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // debounce search
    const t = setTimeout(fetchData, 250);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [isOpen, userId, search]);

  if (!isOpen || !userRow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-[900px] max-h-[85vh] overflow-auto rounded-lg shadow-xl p-5 ${
          isDarkMode ? "bg-gray-900 text-yellow-300" : "bg-white text-black"
        }`}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-yellow-500">Demo Accounts</h2>
          <button onClick={onClose}>
            <X className="text-red-500" size={22} />
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search demo accounts..."
          className={`w-full mt-4 p-2 rounded border ${
            isDarkMode
              ? "bg-gray-800 text-yellow-200 border-yellow-600"
              : "bg-gray-100 text-black border-gray-300"
          }`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Table */}
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr
              className={
                isDarkMode
                  ? "bg-gray-800 text-yellow-300"
                  : "bg-gray-100 text-black"
              }
            >
              <th className="p-2">User ID</th>
              <th className="p-2">User Name</th>
              <th className="p-2">Account ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Registration</th>
              <th className="p-2">Country</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-center" colSpan="7">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-3 text-center text-red-400" colSpan="7">{error}</td>
              </tr>
            ) : demoAccounts && demoAccounts.length > 0 ? (
              demoAccounts.map((acc, index) => (
                <tr
                  key={acc.id ?? index}
                  className={`text-center ${
                    isDarkMode
                      ? "hover:bg-black/40"
                      : "hover:bg-gray-200 ease-in"
                  }`}
                >
                  <td className="p-2">{acc.user_id ?? acc.userId ?? acc.userId}</td>
                  <td className="p-2">{acc.name ?? acc.userName ?? acc.username}</td>
                  <td className="p-2">{acc.account_id ?? acc.accountId}</td>
                  <td className="p-2">{acc.email}</td>
                  <td className="p-2">{acc.registered_date ?? acc.registration}</td>
                  <td className="p-2">{acc.country}</td>
                  <td className="p-2 flex justify-center gap-2">
                    <button className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md flex items-center gap-1">
                      <Eye size={13} /> View
                    </button>
                    <button className="px-2 py-1 bg-red-500 text-white text-xs rounded-md flex items-center gap-1">
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 text-center text-red-400" colSpan="7">
                  No Demo Accounts Found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end mt-5">
          <button
            className="bg-red-500 hover:bg-red-600 py-2 px-5 rounded text-white font-bold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
