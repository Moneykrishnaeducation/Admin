import React, { useState, useEffect, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { get } from "../utils/api-config"; // import your API GET
import { Search } from "lucide-react";

const Activities = () => {
  const [activeLog, setActiveLog] = useState("client"); // "client" or "staff"

  const [clientLogs, setClientLogs] = useState([]);
  const [staffLogs, setStaffLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch logs from backend
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const clientRes = await get("activity/client-logs/");
        const staffRes = await get("activity/staff/");

        // Ensure consistent structure
        setClientLogs(
          clientRes?.map((item) => ({
            id: item.id,
            time: item.timestamp,
            user: item.user,
            activity: item.activity,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
          })) || []
        );

        setStaffLogs(
          staffRes?.map((item) => ({
            id: item.id,
            time: new Date(item.timestamp),
            user: item.user,
            activity: item.activity,
            ipAddress: item.ip_address,
            userAgent: item.user_agent,
          })) || []
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  // Decide which table data to show
  const data = useMemo(() => {
    return activeLog === "client" ? clientLogs : staffLogs;
  }, [activeLog, clientLogs, staffLogs]);

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

      {loading ? (
        <p className="text-yellow-400 text-center mt-10">Loading logs...</p>
      ) : error ? (
        <p className="text-red-500 text-center mt-10">{error}</p>
      ) : (
        <TableStructure columns={columns} data={data} />
      )}
    </div>
  );
};

export default Activities;
