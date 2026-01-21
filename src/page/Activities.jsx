import React, { useState, useMemo, useEffect, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";

const Activities = () => {
  const [activeLog, setActiveLog] = useState("client"); // "client", "staff", or "error"
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  // Server-side fetch handler - called by TableStructure with page and pageSize
  const handleFetch = useCallback(async ({ page = 1, pageSize = 10, query = "" } = {}) => {
    setError(null);
    let endpoint;
    if (activeLog === "error") {
      endpoint = "/api/activity/error-logs/";
    } else if (activeLog === "client") {
      endpoint = "/api/activity/client-logs/";
    } else {
      endpoint = "/api/activity/staff/";
    }

    try {
      const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize)); // Use the page size from table dropdown
      if (query) params.set("query", String(query));

      let resJson;
      if (client && typeof client.get === "function") {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        const headers = { "Content-Type": "application/json" };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: "include", headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      const raw = Array.isArray(resJson.data)
        ? resJson.data
        : Array.isArray(resJson.results)
        ? resJson.results
        : Array.isArray(resJson)
        ? resJson
        : [];

      const mapped = raw.map((item, idx) => ({
        id: item.id ?? item.pk ?? idx,
        time: item.time ?? item.created_at ?? item.timestamp ?? item.date ?? null,
        user: item.user ?? item.username ?? item.email ?? item.name ?? "Unknown",
        activity: item.activity ?? item.action ?? item.event ?? "",
        statusCode: item.status_code ?? item.statusCode ?? "-",
        ipAddress: item.ip_address ?? item.ip ?? item.ipAddress ?? "",
        userAgent: item.user_agent ?? item.userAgent ?? "",
      }));

      const totalCount = typeof resJson.total === "number" ? resJson.total : typeof resJson.count === "number" ? resJson.count : mapped.length;
      return { data: mapped, total: totalCount };
    } catch (err) {
      setError(err.message || String(err));
      return { data: [], total: 0 };
    }
  }, [activeLog]);

  const columns = [
    {
      Header: "Time",
      accessor: "time",
      // TableStructure calls Cell as Cell(cellValue, row)
      Cell: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    { Header: "User", accessor: "user" },
    { Header: "Activity", accessor: "activity" },
    {
      Header: "Status Code",
      accessor: "statusCode",
      Cell: (value) => {
        if (value === "-") return value;
        const code = parseInt(value);
        const color = code >= 200 && code < 300 ? "text-green-600" : code >= 400 ? "text-red-600" : "text-yellow-600";
        return <span className={color}>{value}</span>;
      },
    },
    { Header: "IP Address", accessor: "ipAddress" },
    { Header: "User Agent", accessor: "userAgent" },
  ];

  return (
    <div className="p-6 max-w-8xl mx-auto">
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
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeLog === "error"
              ? "bg-red-500 text-white"
              : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
          }`}
          onClick={() => setActiveLog("error")}
        >
          Error Logs
        </button>
      </div>

      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <TableStructure
        key={activeLog}
        columns={columns}
        data={logs}
        serverSide={true}
        onFetch={handleFetch}
        isLoading={loading}
      />
    </div>
  );
};

export default Activities;
