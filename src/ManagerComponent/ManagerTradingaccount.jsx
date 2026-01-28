import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import TableStructure from "../commonComponent/TableStructure";
import HistoryModal from "../Modals/HistoryModal";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const ManagerTradingaccount = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyAccountId, setHistoryAccountId] = useState("");
  const [historyActiveTab, setHistoryActiveTab] = useState("transactions");
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [activeClientFilter, setActiveClientFilter] = useState(''); // default to all
  const { isDarkMode } = useTheme();

  // fetch users (admin) with pagination - using server-side pagination
  const handleFetch = React.useCallback(
    async ({ page = 1, pageSize = 10, query = "" } = {}) => {
      const endpoint = "/api/admin/trading-accounts/";
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (query) params.set("query", query);
      try {
        setLoading(true);
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
            : 0;
        // Always return exactly pageSize items for the current page
        let mapped = items.map((u) => ({
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
          // Active Client logic: 1 if balance > 10, else 0
          activeClient: (typeof u.balance === "number" && u.balance > 10) ? 1 : 0,
          groupName: u.group_name || "",
          alias: u.alias || "",
        }));
        // Filter by activeClient if filter is set
        if (activeClientFilter === '1') {
          mapped = mapped.filter(row => row.activeClient === 1);
        } else if (activeClientFilter === '0') {
          mapped = mapped.filter(row => row.activeClient === 0);
        }
        // If the backend returns more than pageSize, slice it (defensive)
        return { data: mapped.slice(0, pageSize), total: mapped.length };
      } catch {
        // console.error("Failed to load users:", err);
        return { data: [], total: 0 };
      }
      finally {
        setLoading(false);
      }
    },
    [activeClientFilter]
  );

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
    { Header: "Alias", accessor: "alias" },
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
      Header: "Active Client",
      accessor: "activeClient",
      filter: "select",
      filterOptions: [
        { value: '', label: 'All' },
        { value: '1', label: 'Active' },
        { value: '0', label: 'Inactive' },
      ],
      Cell: (value, row) => (
        <span className={value > 0 ? "text-green-500 font-bold" : "text-gray-400"}>
          {value > 0 ? "Active" : "Inactive"}
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

      <div className="mb-4 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-4">
          <button
            className={`w-32 py-2 text-base font-semibold border-2 transition-colors duration-200 rounded-full shadow-sm
              ${activeClientFilter === '1'
                ? 'bg-yellow-400 text-black border-yellow-500'
                : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-300 hover:text-black'}
            `}
            style={{ minWidth: 120 }}
            onClick={() => setActiveClientFilter('1')}
          >
            Active
          </button>
          <button
            className={`w-32 py-2 text-base font-semibold border-2 transition-colors duration-200 rounded-full shadow-sm
              ${activeClientFilter === '0'
                ? 'bg-yellow-400 text-black border-yellow-500'
                : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-500 hover:text-white'}
            `}
            style={{ minWidth: 120 }}
            onClick={() => setActiveClientFilter('0')}
          >
            Inactive
          </button>
        </div>
      </div>

      {loading && <div className="text-white">Loading…</div>}
      {error && <div className="text-red-400">{error}</div>}

      <TableStructure
        columns={columns}
        serverSide={true}
        data={data}
        isLoading={loading}
        onFetch={handleFetch}
        pageSize={10}
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
