import React, { useState, useEffect } from "react";
import { X, Eye, Trash2 } from "lucide-react";

export default function DemoAccountModal({
  isOpen,
  onClose,
  userRow,
  isDarkMode,
}) {
  const [search, setSearch] = useState("");
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId =
    userRow?.id ?? userRow?.userId ?? userRow?.user_id ?? null;

  useEffect(() => {
    if (!isOpen || !userId) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          user_id: String(userId),
        });
        if (search) params.set("search", search);

        const res = await fetch(
          `/api/demo_accounts/?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!res.ok)
          throw new Error(`Failed to load demo accounts (${res.status})`);

        const data = await res.json();
        if (!cancelled) setDemoAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const debounce = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(debounce);
    };
  }, [isOpen, userId, search]);

  if (!isOpen || !userRow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* MODAL CONTAINER */}
      <div
        className={`w-[95%] max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDarkMode
            ? "bg-gray-900 text-yellow-300 border border-yellow-500/20"
            : "bg-white text-gray-800"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
          <h2 className="text-xl font-semibold text-yellow-400">
            Demo Accounts – User #{userId}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-red-500/20 transition"
          >
            <X className="text-red-500" size={22} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-4">
          <input
            type="text"
            placeholder="Search demo accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-lg px-4 py-2 outline-none border transition ${
              isDarkMode
                ? "bg-gray-800 text-yellow-200 border-yellow-500/30 focus:border-yellow-400"
                : "bg-gray-100 border-gray-300 focus:border-gray-500"
            }`}
          />
        </div>

        {/* TABLE SECTION (SCROLL FIXED) */}
        <div className="px-6 pb-6">
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-700/30">
            <table className="w-full overflow-auto text-sm">
              {/* STICKY HEADER */}
              <thead className="sticky top-0 z-10">
                <tr
                  className={
                    isDarkMode
                      ? "bg-gray-800 text-yellow-300"
                      : "bg-gray-200 text-gray-800"
                  }
                >
                  <th className="p-3 text-left">User ID</th>
                  <th className="p-3 text-left">User Name</th>
                  <th className="p-3 text-left">Account ID</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Registered</th>
                  <th className="p-3 text-left">Country</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center">
                      Loading demo accounts...
                    </td>
                  </tr>
                )}

                {error && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && demoAccounts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-red-400">
                      No Demo Accounts Found
                    </td>
                  </tr>
                )}

                {demoAccounts.map((acc, index) => (
                  <tr
                    key={acc.id ?? index}
                    className={`transition ${
                      isDarkMode
                        ? "hover:bg-black/40"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <td className="p-3">{acc.user_id}</td>
                    <td className="p-3">{acc.name}</td>
                    <td className="p-3 font-mono">
                      {acc.account_id}
                    </td>
                    <td className="p-3">{acc.email}</td>
                    <td className="p-3">
                      {acc.registered_date}
                    </td>
                    <td className="p-3">{acc.country}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs transition">
                        <Eye size={14} />
                        View
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs transition">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-700/30">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
