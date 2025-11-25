import React, { useState, useMemo } from "react";
import { X, Eye, Trash2 } from "lucide-react";

export default function DemoAccountModal({
  isOpen,
  onClose,
  userRow,
  isDarkMode,
}) {
  if (!isOpen || !userRow) return null;

  // Demo Account Data - later API replace:
  const demoAccounts = [
    {
      userId: 1,
      userName: "John Doe",
      accountId: "D-1001",
      email: "john@example.com",
      registration: "2024-01-10",
      country: "USA",
    },
    {
      userId: 2,
      userName: "Jane",
      accountId: "D-2001",
      email: "jane@example.com",
      registration: "2024-02-11",
      country: "India",
    },
  ];

  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return demoAccounts.filter(
      (acc) =>
        acc.userId === userRow.id &&
        (acc.accountId.toLowerCase().includes(search.toLowerCase()) ||
          acc.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, userRow]);

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
            {filteredData.length > 0 ? (
              filteredData.map((acc, index) => (
                <tr
                  key={index}
                  className={`text-center ${
                    isDarkMode
                      ? "hover:bg-black/40"
                      : "hover:bg-gray-200 ease-in"
                  }`}
                >
                  <td className="p-2">{acc.userId}</td>
                  <td className="p-2">{acc.userName}</td>
                  <td className="p-2">{acc.accountId}</td>
                  <td className="p-2">{acc.email}</td>
                  <td className="p-2">{acc.registration}</td>
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
