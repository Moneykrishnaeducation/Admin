import React, { useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const sampleClientLogs = [
  {
    id: 1,
    time: new Date("2024-06-01T10:15:00"),
    user: "ClientUser1",
    activity: "Logged in",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
  {
    id: 2,
    time: new Date("2024-06-01T11:20:00"),
    user: "ClientUser2",
    activity: "Viewed report",
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
];

const sampleStaffLogs = [
  {
    id: 1,
    time: new Date("2024-06-01T09:05:00"),
    user: "StaffUser1",
    activity: "Updated ticket status",
    ipAddress: "10.0.0.1",
    userAgent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64)",
  },
  {
    id: 2,
    time: new Date("2024-06-01T12:45:00"),
    user: "StaffUser2",
    activity: "Closed ticket",
    ipAddress: "10.0.0.2",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
];

const Activities = () => {
  const { isDarkMode } = useTheme();
  const [activeLog, setActiveLog] = useState("client"); // "client" or "staff"
  const [searchText, setSearchText] = useState("");

  const data = useMemo(() => {
    const logs = activeLog === "client" ? sampleClientLogs : sampleStaffLogs;
    if (!searchText.trim()) {
      return logs;
    }
    const lowerSearch = searchText.toLowerCase();
    return logs.filter(
      (log) =>
        log.user.toLowerCase().includes(lowerSearch) ||
        log.activity.toLowerCase().includes(lowerSearch) ||
        log.ipAddress.toLowerCase().includes(lowerSearch) ||
        log.userAgent.toLowerCase().includes(lowerSearch) ||
        log.time.toLocaleString().toLowerCase().includes(lowerSearch)
    );
  }, [activeLog, searchText]);

  const columns = [
    {
      Header: "Time",
      accessor: "time",
      Cell: (value) => value.toLocaleString(),
    },
    { Header: "User", accessor: "user" },
    { Header: "Activity", accessor: "activity" },
    { Header: "IP Address", accessor: "ipAddress" },
    { Header: "User Agent", accessor: "userAgent" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeLog === "client"
              ? "bg-yellow-500 text-black"
              : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
          }`}
          onClick={() => setActiveLog("client")}
        >
          Client Logs
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeLog === "staff"
              ? "bg-yellow-500 text-black"
              : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
          }`}
          onClick={() => setActiveLog("staff")}
        >
          Staff Logs
        </button>
      </div>

      <div className={`flex justify-end mb-4`}>
        <div
          className={`flex items-center gap-2 border border-yellow-500 rounded-md px-3 py-2 w-full sm:w-72 ${
            isDarkMode ? "bg-black" : "bg-white"
          } hover:bg-gray-900 transition`}
        >
          <Search size={18} className="text-yellow-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`bg-transparent w-full focus:outline-none ${
              isDarkMode
                ? "text-yellow-300 placeholder-yellow-400"
                : "text-black placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      <TableStructure columns={columns} data={data} />
    </div>
  );
};

export default Activities;
