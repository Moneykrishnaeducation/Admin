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
  const [total, setTotal] = useState(0);
  const [activeTotal, setActiveTotal] = useState(0);
  const [inactiveTotal, setInactiveTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  // const { isDarkMode } = useTheme(); // Remove unused var

  // fetch users (admin) with pagination for all, no pagination for filtered
  const handleFetch = React.useCallback(
    async ({ page = 1, pageSize = 10, query = "", filter = activeClientFilter } = {}) => {
      setCurrentPage(page);
      setCurrentPageSize(pageSize);
      let endpoint = "/api/admin/trading-accounts/";
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (query) params.set("query", query);
      // Add filter param as a query param
      if (filter === '1') {
        params.set("active", "1");
      } else if (filter === '0') {
        params.set("inactive", "1");
      } else {
        params.set("all", "1");
      }
      try {
        setLoading(true);
        const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
        let resJson;
        if (client && typeof client.get === "function") {
          resJson = await client.get(`${endpoint}?${params.toString()}`);
        } else {
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
          activeClient: (typeof u.balance === "number" && u.balance >= 10) ? 1 : 0,
          groupName: u.group_name || "",
          alias: u.alias || "",
        }));
        // Calculate total active/inactive from all items (not just current page)
        const allActive = items.filter(u => typeof u.balance === 'number' && u.balance >= 10).length;
        const allInactive = items.filter(u => typeof u.balance === 'number' && u.balance < 10).length;
        setActiveTotal(allActive);
        setInactiveTotal(allInactive);
        // No client-side filter needed, handled by backend
        // Use backend total if available, else fallback to mapped.length
        const totalCount = typeof resJson.count === 'number' ? resJson.count : mapped.length;
        setTotal(totalCount);
        return { data: mapped, total: totalCount };
      } catch {
        setActiveTotal(0);
        setInactiveTotal(0);
        return { data: [], total: 0 };
      }
      finally {
        setLoading(false);
      }
    },
    [activeClientFilter]
  );

  // Refetch data when filter changes
  React.useEffect(() => {
    handleFetch({ page: currentPage, pageSize: currentPageSize });
  }, [activeClientFilter, handleFetch, currentPage, currentPageSize]);

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
            } catch {
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
  }, [data]);

  // Removed unused fetchHistory and setHistoryData

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
      Cell: (value) => (
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

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-end gap-3">
        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            className="w-48 py-2 px-3 text-base font-semibold border-2 rounded-md shadow-sm bg-yellow-100 text-yellow-700 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={activeClientFilter}
            onChange={e => setActiveClientFilter(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">All Clients</option>
            <option value="1">Active Clients</option>
            <option value="0">Inactive Clients</option>
          </select>
        </div>
      </div>
      
      {/* Show correct range and total above table */}
      <div className="text-right text-sm text-gray-500 mb-2">
        {total > 0 ? (
          <>
            Showing {(currentPage - 1) * currentPageSize + 1}
            {' '}to {Math.min(currentPage * currentPageSize, total)}
            {' '}of {total} {activeClientFilter === '1' ? 'Active' : activeClientFilter === '0' ? 'Inactive' : ''} Clients
            <br />
          </>
        ) : (
          <>No Clients Found</>
        )}
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
