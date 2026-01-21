import React, { useState } from "react";
import TableStructure from "../commonComponent/TableStructure";
import HistoryModal from "../Modals/HistoryModal";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const ManagerTradingaccount = () => {
  const [data, setData] = useState([]);
  const [page] = useState(1);
  const [pageSize] = useState(10);

  const [loading] = useState(false);
  const [error] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyAccountId, setHistoryAccountId] = useState("");
  const [historyActiveTab, setHistoryActiveTab] = useState("transactions");
  const [selectedRowData, setSelectedRowData] = useState(null);

  // fetch users (admin) with pagination
  const fetchUsers = React.useCallback(
      async ({ page: p = 1, pageSize: ps = 10, query = "" }) => {
        const endpoint = "/api/admin/trading-accounts/";
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("pageSize", String(ps));
        if (query) params.set("query", query);
        try {
          const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
          let resJson;
          if (client && typeof client.get === "function") {
            resJson = await client.get(`${endpoint}?${params.toString()}`);
          } else {
            // Tokens are now in HttpOnly cookies - no need to manually add Authorization header
            const headers = { "Content-Type": "application/json" };
            const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: "include", headers });
            if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
            resJson = await res.json();
          }
          const items = Array.isArray(resJson.data)
            ? resJson.data
            : Array.isArray(resJson)
            ? resJson
            : resJson.results || [];
          const total =
            typeof resJson.total === "number"
              ? resJson.total
              : typeof resJson.count === "number"
              ? resJson.count
              : items.length;
          const mapped = items.map((u) => ({
            userId: u.user_id ?? u.id ?? u.pk,
            name: `${u.username || "-"}`.trim(),
            email: u.email,
            accountId: u.account_id || "-",
            balance: typeof u.balance === "number" ? u.balance : 0,
            equity: typeof u.equity === "number" ? u.equity : 0,
            openPositions: typeof u.open_positions === "number" ? u.open_positions : 0,
            leverage : u.leverage || "-",
            status: u.status ? "Running" : "Stopped",
            country: u.country || "-",
            isEnabled: Boolean(u.is_is_enabled ?? u.enabled ?? u.is_enabled),
          }));
          setData(mapped);
          return { data: mapped, total };
        } catch  {
          // console.error("Failed to load users:", err);
          return { data: [], total: 0 };
        }
      },
      []
    );

  React.useEffect(() => {
    fetchUsers(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Fetch open positions for all accounts
  React.useEffect(() => {
    if (data.length === 0) return;
    
    const fetchOpenPositions = async () => {
      try {
        const apiClient = new AdminAuthenticatedFetch('/api');
        const updatedData = await Promise.all(
          data.map(async (item) => {
            try {
              const response = await apiClient.get(`/trading-account/${item.accountId}/history/?days_back=30`);
              return {
                ...item,
                openPositions: response.account_summary?.open_positions || 0,
              };
            } catch{
              // console.error(`Error fetching positions for account ${item.accountId}:`, error);
              return item;
            }
          })
        );
        setData(updatedData);
      } catch  {
        // console.error('Error fetching open positions:', error);
      }
    };

    fetchOpenPositions();
  }, [data.length]);

  const fetchHistory = async (accountId, days = 30) => {
    try {
      const apiClient = new AdminAuthenticatedFetch('/api');
      const response = await apiClient.get(`/trading-account/${accountId}/history/?days_back=${days}`);
      setHistoryData(response);
    } catch {
      // console.error('Error fetching history:', error);
    }
  };

  // ======================
  // Table Columns
  // ======================

  const columns = [
    { Header: "User ID", accessor: "userId" },
    { Header: "Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "accountId" },
    {
      Header: "Balance",
      accessor: "balance",
    },
    { Header: "Leverage", accessor: "leverage" },
    {
      Header: "Status",
      accessor: "status",
      Cell: (accessor) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${accessor === "Running" ? "bg-green-500" : "bg-gray-500"
            } text-white`}
        >
          {accessor}
        </span>
      ),
    },
    {
      Header: "History",
      accessor: "history",
      Cell: (cellValue, row) => (
        <button
          className="relative bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition inline-block"
          onClick={async () => {
            setHistoryAccountId(row.accountId);
            setSelectedRowData(row);
            setHistoryModalOpen(true);
            // Fetch history data and update selectedRowData with account_summary
            try {
              const apiClient = new AdminAuthenticatedFetch('/api');
              const response = await apiClient.get(`/trading-account/${row.accountId}/history/?days_back=30`);
              if (response.account_summary) {
                setSelectedRowData(prev => ({
                  ...prev,
                  balance: response.account_summary.balance,
                  equity: response.account_summary.equity,
                  openPositions: response.account_summary.open_positions,
                }));
                
                // Update the main data table with the fetched open_positions
                setData(prevData =>
                  prevData.map(item =>
                    item.accountId === row.accountId
                      ? { ...item, openPositions: response.account_summary.open_positions }
                      : item
                  )
                );
              }
            } catch {
              // console.error('Error fetching history:', error);
            }
          }}
        >
          View
          {row.openPositions > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full shadow-lg animate-pulse">
              {row.openPositions > 99 ? '99+' : row.openPositions}
            </span>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Trading Accounts</h2>

      {loading && <div className="text-white">Loading…</div>}
      {error && <div className="text-red-400">{error}</div>}

      <TableStructure
        columns={columns}
        data={data}
        initialPageSize={10}
      />

      <HistoryModal
        visible={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        accountId={historyAccountId}
        activeTab={historyActiveTab}
        setActiveTab={setHistoryActiveTab}
        rowData={selectedRowData}
      />
    </div>
  );
};

export default ManagerTradingaccount;
