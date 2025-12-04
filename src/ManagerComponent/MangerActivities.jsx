import React, { useState, useMemo, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";

const ManagerActivities = () => {
// "client" or "staff"
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Server-side fetch handler for TableStructure
  const handleFetch = async ({ page, pageSize, query }) => {
    setError(null);
    const endpoint ="/api/activity/client-logs/";

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      const params = new URLSearchParams();
      params.set('page', String(page || 1));
      params.set('page_size', String(pageSize || 10));
      if (query) params.set('query', String(query));

      let resJson;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      // Expect backend to return { data: [...], total: N }
      const items = Array.isArray(resJson.data) ? resJson.data : [];
      const total = typeof resJson.total === 'number' ? resJson.total : (Array.isArray(resJson) ? resJson.length : 0);

      const mapped = items.map((item, idx) => ({
        id: item.id ?? item.pk ?? idx,
        time: item.time ?? item.created_at ?? item.timestamp ?? item.date ?? null,
        user: item.user ?? item.username ?? item.email ?? item.name ?? "Unknown",
        activity: item.activity ?? item.action ?? item.event ?? "",
        ipAddress: item.ip_address ?? item.ip ?? item.ipAddress ?? "",
        userAgent: item.user_agent ?? item.userAgent ?? "",
      }));

      return { data: mapped, total };
    } catch (err) {
      setError(err.message || String(err));
      return { data: [], total: 0 };
    }
  };

  const data = useMemo(() => logs, [logs]);

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeLog === "client"
              ? "bg-yellow-500 text-black"
              : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-300"
          }`}
        >
          Client Logs
        </button>
      </div>

      {loading && <div className="mb-4">Loading {activeLog} logs...</div>}
      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <TableStructure
        key={activeLog} // reset paging when switching logs
        columns={columns}
        data={[]}
        serverSide={true}
        onFetch={handleFetch}
      />
    </div>
  );
};

export default ManagerActivities;
