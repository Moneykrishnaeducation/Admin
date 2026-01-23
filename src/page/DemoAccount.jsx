import React, { useState, useMemo, useCallback, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import SubRowButtons from "../commonComponent/SubRowButtons";
import { get, post } from "../utils/api-config"; // Ensure post is available
import { useTheme } from '../context/ThemeContext';
const Modal = ({ open, onClose, title, children, actions, width = "w-80", isDarkMode }) => {
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${isDarkMode ? 'bg-black/70 backdrop-blur-md' : 'bg-white/70 backdrop-blur-sm'} p-2 sm:p-0`}
      onClick={onClose}
    >
      <div
        className={
          `${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} p-2 sm:p-6 rounded-2xl w-full max-w-md sm:max-w-2xl ${width} max-h-[90vh] overflow-y-auto relative border-2 border-yellow-400 shadow-[0_0_16px_2px_rgba(212,175,55,0.25)]`
        }
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
        <div className="flex justify-end gap-3 mt-4">{actions}</div>
      </div>
    </div>
  );
};

const DemoAccount = () => {
  const { isDarkMode } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [selectedRow, setSelectedRow] = useState(null);

  // Account status map (true = enabled, false = disabled)
  const [accountStatusMap, setAccountStatusMap] = useState({});

  // Modals
  const [leverageModal, setLeverageModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  // Leverage state
  const [leverage, setLeverage] = useState("1:500");
  const leverageOptions = [
    "1:1", "1:2", "1:5", "1:10", "1:20", "1:50", "1:100", "1:200", "1:500", "1:1000",
  ];

  // Balance state
  const [newBalance, setNewBalance] = useState("10000.00");

  // View modal tabs
  const [viewTab, setViewTab] = useState("history");
  const [viewData, setViewData] = useState(null);
  // Helper: safe currency formatter for view modal
  const formatCurrency = useCallback((v) => {
    try {
      if (v == null || v === '') return '0.00';
      const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
      return isFinite(n) ? n.toFixed(2) : '0.00';
    } catch (e) {
      return '0.00';
    }
  }, []);
  // Table columns
  const columns = useMemo(() => [
    { Header: "User ID", accessor: "user_id" },
    { Header: "Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    // { Header: "Phone", accessor: "phone" },
    { Header: "Account ID", accessor: "account_id" },
    { Header: "Balance", accessor: "balance" },
    { Header: "Leverage", accessor: "leverage" },
    {
      Header: "Status",
      accessor: "is_active",
      Cell: (cell) => {
        const raw = (cell && typeof cell === 'object' && 'value' in cell) ? cell.value : cell;
        const str = raw == null ? "" : String(raw).toLowerCase();
        const isActive = raw === true 
        || str === "true" || str === "1" || str === "active" || str === "running";
        const label = isActive ? "Active" : "Inactive";
        const colorClass = isActive ? "bg-green-500" : "bg-red-500";

        return (
          <span className="inline-flex items-center gap-2">
            <span className={`${colorClass} w-3 h-3 rounded-full inline-block`} />
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>{label}</span>
          </span>
        );
      },
    },
  ], [isDarkMode]);

  const historyColumns = [
    { Header: "Date", accessor: "created_at" },
    { Header: "Type", accessor: "transaction_type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Description", accessor: "description" },
  ];

  const positionsColumns = [
    { Header: "Ticket", accessor: "ticket" },
    { Header: "Symbol", accessor: "symbol" },
    { Header: "Type", accessor: "type" },
    { Header: "Size", accessor: "size" },
    { Header: "Price", accessor: "price" },
    { Header: "Profit", accessor: "profit" },
  ];

  // Server-side fetch handler for TableStructure
  const handleFetch = useCallback(async ({ page, pageSize, query }) => {
    try {
      const qParam = query ? `&query=${encodeURIComponent(query)}` : "";
      const res = await get(`demo_accounts/?page=${page}&page_size=${pageSize}${qParam}`);
      // normalize response: backend may return { data, total } or an array
      let raw = [];
      if (res) {
        if (Array.isArray(res)) raw = res;
        else if (Array.isArray(res.data)) raw = res.data;
        else raw = Array.isArray(res.results) ? res.results : [];
      }

      // If backend returned full list (not paged), apply client-side filtering and slicing
      const q = query ? String(query).toLowerCase() : "";
      let filtered = raw;
      if (q) {
        filtered = raw.filter((item) => {
          if (!item) return false;
          const fields = [item.name, item.email, item.account_id, item.phone];
          return fields.some((f) => f && String(f).toLowerCase().includes(q));
        });
      }

      const total = filtered.length;
      const start = Math.max(0, (Number(page || 1) - 1) * Number(pageSize || 10));
      const end = start + Number(pageSize || 10);
      const pageData = filtered.slice(start, end);

      // update account status map for visible rows
      if (Array.isArray(pageData) && pageData.length > 0) {
        setAccountStatusMap((prev) => {
          const next = { ...prev };
          pageData.forEach((acc) => {
            if (acc && acc.account_id !== undefined) next[acc.account_id] = !!acc.is_enabled;
          });
          return next;
        });
      }

      // first successful fetch -> clear initial loading indicator
      if (isInitialLoading) setIsInitialLoading(false);

      return { data: pageData, total };
    } catch (err) {
      return { data: [], total: 0 };
    }
  }, [isInitialLoading]);


  

  // Modals
  const openLeverageModal = (row) => {
    setSelectedRow(row);
    setLeverage("1:500");
    setLeverageModal(true);
  };

  const openBalanceModal = (row) => {
    setSelectedRow(row);
    setNewBalance("10000.00");
    setBalanceModal(true);
  };

  const openViewModal = async (row) => {
    setSelectedRow(row);
    setViewTab("history");

    try {
      const data = await get(`trading-account/${row.account_id}/history/?days_back=30`);
      setViewData(data);
      setViewModal(true);
    } catch (err) {
      alert("Failed to load account history.");
    }
  };

  /* -------------------- HELPERS -------------------- */
  const extractLeverageValue = (val) => {
    if (!val) return null;
    if (typeof val === "string" && val.includes(":")) {
      return parseInt(val.split(":")[1], 10);
    }
    return parseInt(val, 10);
  };

  /* -------------------- ACTIONS -------------------- */
  const handleLeverageSubmit = async () => {
    if (!selectedRow) return;

    try {
      const value = extractLeverageValue(leverage);

      await post(
        `demo_accounts/${selectedRow.account_id}/reset_leverage/`,
        { leverage: value }
      );

      alert("Leverage updated successfully");
      setLeverageModal(false);
      setIsInitialLoading(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to reset leverage");
    }
  };

  const handleBalanceSubmit = async () => {
    if (!selectedRow || !selectedRow.account_id) return;

    try {
      await post(`demo_accounts/${selectedRow.account_id}/reset_balance/`, { balance: newBalance });
      alert(`Balance reset to $${newBalance}`);
      setBalanceModal(false);
      setSelectedRow(null);

      // trigger table refresh
      setIsInitialLoading(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert("Failed to reset balance.");
    }
  };

  // Enable/Disable toggle
  const toggleAccountStatus = async (accountId) => {
    const isEnabled = accountStatusMap[accountId];
    const url = isEnabled
      ? `demo_accounts/${accountId}/disable/`
      : `demo_accounts/${accountId}/enable/`;

    try {
      await post(url);

      setAccountStatusMap(prev => ({
        ...prev,
        [accountId]: !isEnabled
      }));

      alert(`${isEnabled ? "Disabled" : "Enabled"} successfully.`);
    } catch (err) {
      alert("Failed to change account status.");
    }
  };

  // Actions column
  const actionsColumn = (row) => {
    const isEnabled = accountStatusMap[row.account_id];
    return (
      <div className="flex gap-2">
        <button
          className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
          onClick={(e) => { e.stopPropagation(); openViewModal(row); }}
        >
          View
        </button>

        <button
          className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
          onClick={(e) => { e.stopPropagation(); openBalanceModal(row); }}
        >
          Reset Balance
        </button>

        <button
          className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
          onClick={(e) => { e.stopPropagation(); openLeverageModal(row); }}
        >
          Reset Leverage
        </button>

        <button
          className={`px-2 py-1 rounded text-white ${isEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
          onClick={(e) => { e.stopPropagation(); toggleAccountStatus(row.account_id); }}
        >
          {isEnabled ? "Disable" : "Enable"}
        </button>
      </div>
    );
  };

  // Table expandable row
  const [expandedRow, setExpandedRow] = useState(null);
  const handleRowClick = (row) => setExpandedRow(expandedRow === row.id ? null : row.id);

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRow === row.id;
    const hasActionsColumn = typeof actionsColumn === 'function';
    const colSpan = columns.length + (hasActionsColumn ? 1 : 0);

    const actionItems = [
      { icon: "🔍", label: "View", onClick: () => openViewModal(row) },
      { icon: "💰", label: "Reset Balance", onClick: () => openBalanceModal(row) },
      { icon: "⚖️", label: "Reset Leverage", onClick: () => openLeverageModal(row) },
      { icon: row && row.account_id && accountStatusMap[row.account_id] ? "🛑" : "✅", label: row && row.account_id && accountStatusMap[row.account_id] ? "Disable" : "Enable", onClick: () => toggleAccountStatus(row.account_id) },
    ];

    return (
      <tr style={{ height: isExpanded ? 'auto' : '0px', overflow: 'hidden', padding: 0, margin: 0, border: 0 }}>
        <td colSpan={colSpan} className="p-0 m-0 border-0">
          <div
            style={{
              maxHeight: isExpanded ? 120 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.25s ease, opacity 0.25s ease',
              opacity: isExpanded ? 1 : 0,
            }}
            className=" text-yellow-400 rounded p-2 flex gap-4 flex-wrap"
          >
            <SubRowButtons actionItems={actionItems} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-9xl mx-auto">
      <TableStructure
        key={refreshKey} /* force remount when refreshKey changes */
        columns={columns}
        serverSide={true}
        onFetch={handleFetch}
        initialPageSize={10}
        renderRowSubComponent={renderRowSubComponent}
        onRowClick={handleRowClick}
      />

      {/* Reset Leverage Modal */}
      <Modal
        open={leverageModal}
        onClose={() => setLeverageModal(false)}
        title="Reset Leverage"
        isDarkMode={isDarkMode}
        actions={[
          <button key="cancel" className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'}`} onClick={() => setLeverageModal(false)}>Cancel</button>,
          <button key="ok" className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600" onClick={handleLeverageSubmit}>OK</button>,
        ]}
      >
        <p className={`mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Current Leverage: {leverage}</p>
        <label htmlFor="leverageInput" className={`block mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Select or enter leverage</label>
        <input
          list="leverageOptions"
          id="leverageInput"
          className={`border border-gray-300 rounded px-3 py-2 w-full mb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
        />
        <datalist id="leverageOptions">
          {leverageOptions.map(opt => <option key={opt} value={opt} />)}
        </datalist>
      </Modal>

      {/* Reset Balance Modal */}
      <Modal
        open={balanceModal}
        onClose={() => setBalanceModal(false)}
        title={<h2 className="text-[#d4af37] font-semibold">Reset Balance</h2>}
        isDarkMode={isDarkMode}
        actions={[
          <button key="cancel" className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'}`} onClick={() => setBalanceModal(false)}>Cancel</button>,
          <button key="ok" className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600" onClick={handleBalanceSubmit}>OK</button>,
        ]}
      >
        <p className={`mb-2 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Current Balance: <span className="text-[#d4af37] font-semibold">${formatCurrency(selectedRow?.balance ?? selectedRow?.current_balance ?? selectedRow?.account_summary?.balance ?? newBalance)}</span></p>
        <label htmlFor="balanceInput" className={`block mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Enter new balance</label>
        <input
          type="number"
          id="balanceInput"
          className={`border border-gray-300 rounded px-3 py-2 w-full mb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          min="0"
          step="0.01"
        />
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title={<h2 className="text-[#d4af37] font-semibold">View Account Details</h2>}
        width="sm:w-[90vw] md:w-[70vw]"
        isDarkMode={isDarkMode}
        actions={[
          <button key="close" className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'}`} onClick={() => setViewModal(false)}>Close</button>,
        ]}
      >
        {/* Account Summary */}
        {viewData && (
          <div className="mb-4">
            <div className={`p-3 sm:p-4 rounded-lg border border-yellow-500/30 mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Balance</p>
                  <p className="text-yellow-400 text-lg font-semibold">${formatCurrency(viewData.account_summary?.balance)}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Equity</p>
                  <p className="text-yellow-400 text-lg font-semibold">${formatCurrency(viewData.account_summary?.equity)}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open Positions</p>
                  <p className="text-yellow-400 text-lg font-semibold">{viewData.account_summary?.open_positions || 0}</p>
                </div>
              </div>
            </div>
            {/* Controls: History / Positions (left) and Search (right) on one line */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4">
              <div className="flex gap-2 sm:gap-3 mt-2">
                <button
                  className={`px-4 py-2 rounded w-full sm:w-auto ${viewTab === 'history' ? 'bg-yellow-600 text-black' : (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black')}`}
                  onClick={() => setViewTab('history')}
                >History</button>
                <button
                  className={`px-4 py-2 rounded w-full sm:w-auto ${viewTab === 'positions' ? 'bg-yellow-600 text-black' : (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black')}`}
                  onClick={() => setViewTab('positions')}
                >Positions</button>
              </div>
            </div>
          </div>
        )}
        {/* Tables */}
        <div className="overflow-x-auto">
          {viewTab === 'history' && viewData && (
            <TableStructure columns={historyColumns} data={viewData.transactions || []} />
          )}
          {viewTab === 'positions' && viewData && (
            <TableStructure columns={positionsColumns} data={viewData.positions || []} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DemoAccount;
