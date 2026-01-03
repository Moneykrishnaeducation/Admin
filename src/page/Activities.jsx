import React, { useState, useMemo, useEffect, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";

const Activities = () => {
  const [activeLog, setActiveLog] = useState("client"); // "client" or "staff"
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_total, setTotal] = useState(0);

  // Server-side fetch handler for TableStructure
  const handleFetch = useCallback(async ({ page = 1, pageSize = 100, query = "" } = {}) => {
    setError(null);
    const endpoint = activeLog === "client" ? "/api/activity/client-logs/" : "/api/activity/staff/";

    try {
      const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
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

  const data = useMemo(() => logs, [logs]);

  // Fetch once when activeLog changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await handleFetch();
        if (!mounted) return;
        setLogs(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
      </div>

      {loading && <div className="mb-4">Loading {activeLog} logs...</div>}
      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <TableStructure
        key={activeLog} // reset paging when switching logs
        columns={columns}
        data={data}
        serverSide={false}
      />
    </div>
  );
};

export default Activities;
