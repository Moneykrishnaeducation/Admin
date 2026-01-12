import React, { useState, useMemo, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import TableStructure from "../commonComponent/TableStructure";
import SubRowButtons from "../commonComponent/SubRowButtons";
import { get, post } from "../utils/api-config";

export default function DemoAccountModal({ isOpen, onClose, userRow, isDarkMode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [selectedRow, setSelectedRow] = useState(null);
  const [accountStatusMap, setAccountStatusMap] = useState({});

  // read user role from cookie (userRole or user_role)
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    const role = (getCookie('userRole') || getCookie('user_role') || '').toString().toLowerCase();
    setUserRole(role || null);
  }, []);

  // Modals
  const [leverageModal, setLeverageModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  // Leverage state
  const [leverage, setLeverage] = useState("1:500");
  const leverageOptions = [
    "1:1",
    "1:2",
    "1:5",
    "1:10",
    "1:20",
    "1:50",
    "1:100",
    "1:200",
    "1:500",
    "1:1000",
  ];

  // Balance state
  const [newBalance, setNewBalance] = useState("10000.00");

  // View modal tabs/data
  const [viewTab, setViewTab] = useState("history");
  const [viewData, setViewData] = useState(null);

  const userId = userRow?.id ?? userRow?.userId ?? userRow?.user_id ?? null;

  const columns = useMemo(
    () => [
      { Header: "User ID", accessor: "user_id" },
      { Header: "Name", accessor: "name" },
      { Header: "Email", accessor: "email" },
      { Header: "Phone", accessor: "phone" },
      { Header: "Account ID", accessor: "account_id" },
      { Header: "Registered Date", accessor: "registered_date" },
      { Header: "Country", accessor: "country" },
    ],
    []
  );

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

  const handleFetch = useCallback(
    async ({ page, pageSize, query }) => {
      try {
        const qParam = query ? `&query=${encodeURIComponent(query)}` : "";
        const userParam = userId ? `&user_id=${encodeURIComponent(userId)}` : "";
        const res = await get(`demo_accounts/?page=${page}&page_size=${pageSize}${qParam}${userParam}`);

        let raw = [];
        if (res) {
          if (Array.isArray(res)) raw = res;
          else if (Array.isArray(res.data)) raw = res.data;
          else raw = Array.isArray(res.results) ? res.results : [];
        }

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

        if (Array.isArray(pageData) && pageData.length > 0) {
          setAccountStatusMap((prev) => {
            const next = { ...prev };
            pageData.forEach((acc) => {
              if (acc && acc.account_id !== undefined) next[acc.account_id] = !!acc.is_enabled;
            });
            return next;
          });
        }

        if (isInitialLoading) setIsInitialLoading(false);

        return { data: pageData, total };
      } catch (err) {
        console.error("Failed to fetch demo accounts page:", err);
        return { data: [], total: 0 };
      }
    },
    [refreshKey, userId, isInitialLoading]
  );

  useEffect(() => {
    setIsInitialLoading(true);
  }, [refreshKey]);

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
      console.error("Failed to load account history:", err);
      alert("Failed to load account history.");
    }
  };

  const extractLeverageValue = (val) => {
    if (!val) return null;
    if (typeof val === "string" && val.includes(":")) {
      return parseInt(val.split(":")[1], 10);
    }
    return parseInt(val, 10);
  };

  const handleLeverageSubmit = async () => {
    if (!selectedRow) return;

    try {
      const value = extractLeverageValue(leverage);

      await post(`demo_accounts/${selectedRow.account_id}/reset_leverage/`, { leverage: value });

      alert("Leverage updated successfully");
      setLeverageModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
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
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to reset balance.");
    }
  };

  const toggleAccountStatus = async (accountId) => {
    const isEnabled = accountStatusMap[accountId];
    const url = isEnabled ? `demo_accounts/${accountId}/disable/` : `demo_accounts/${accountId}/enable/`;

    try {
      await post(url);

      setAccountStatusMap((prev) => ({ ...prev, [accountId]: !isEnabled }));

      alert(`${isEnabled ? "Disabled" : "Enabled"} successfully.`);
    } catch (err) {
      console.error(err);
      alert("Failed to change account status.");
    }
  };

  const actionsColumn = (row) => {
    const isEnabled = accountStatusMap[row.account_id];
    const showView = userRole !== 'admin';
    return (
      <div className="flex gap-2">
        {showView && (
          <button
            className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
            onClick={(e) => {
              e.stopPropagation();
              openViewModal(row);
            }}
          >
            View
          </button>
        )}
      </div>
    );
  };

  const [expandedRow, setExpandedRow] = useState(null);
  const handleRowClick = (row) => setExpandedRow(expandedRow === row.id ? null : row.id);

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRow === row.id;
    const hasActionsColumn = typeof actionsColumn === "function";
    const colSpan = columns.length + (hasActionsColumn ? 1 : 0);

    let actionItems = [
      { icon: "🔍", label: "View", onClick: () => openViewModal(row) },
      { icon: "💰", label: "Reset Balance", onClick: () => openBalanceModal(row) },
      { icon: "⚖️", label: "Reset Leverage", onClick: () => openLeverageModal(row) },
      {
        icon: row && row.account_id && accountStatusMap[row.account_id] ? "🛑" : "✅",
        label:
          row && row.account_id && accountStatusMap[row.account_id] ? "Disable" : "Enable",
        onClick: () => toggleAccountStatus(row.account_id),
      },
    ];

    return (
      <tr style={{ height: isExpanded ? "auto" : "0px", overflow: "hidden", padding: 0, margin: 0, border: 0 }}>
        <td colSpan={colSpan} className="p-0 m-0 border-0">
          <div
            style={{
              maxHeight: isExpanded ? 120 : 0,
              overflow: "hidden",
              transition: "max-height 0.25s ease, opacity 0.25s ease",
              opacity: isExpanded ? 1 : 0,
            }}
            className=" text-yellow-400 rounded p-2 flex gap-4 flex-wrap"
          >
            {userRole == 'admin' && (
              <SubRowButtons actionItems={actionItems} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`w-[95%] max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          isDarkMode ? "bg-gray-900 text-yellow-300 border border-yellow-500/20" : "bg-white text-gray-800"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/30">
          <h2 className="text-xl font-semibold text-yellow-400">Demo Accounts – User {userId ? `#${userId}` : ""}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/20 transition">
            <X className="text-red-500" size={22} />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-700/30">
            <TableStructure
              key={refreshKey}
              columns={columns}
              serverSide={true}
              onFetch={handleFetch}
              initialPageSize={10}
              renderRowSubComponent={renderRowSubComponent}
              onRowClick={handleRowClick}
              actionsColumn={actionsColumn}
            />
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-700/30">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition">Close</button>
        </div>

        {/* Leverage Modal */}
        {leverageModal && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50" onClick={() => setLeverageModal(false)}>
            <div className="bg-black p-6 rounded shadow-lg max-h-[90vh] overflow-y-auto text-white w-80" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-4">Reset Leverage</h2>
              <p className="mb-2">Current Leverage: {leverage}</p>
              <label className="block mb-1">Select or enter leverage</label>
              <input list="leverageOptions" value={leverage} onChange={(e) => setLeverage(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white" />
              <datalist id="leverageOptions">{leverageOptions.map((opt) => <option key={opt} value={opt} />)}</datalist>
              <div className="flex justify-end gap-3 mt-4">
                <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white" onClick={() => setLeverageModal(false)}>Cancel</button>
                <button className="bg-yellow-500 px-4 py-2 rounded text-black" onClick={handleLeverageSubmit}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Modal */}
        {balanceModal && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50" onClick={() => setBalanceModal(false)}>
            <div className="bg-black p-6 rounded shadow-lg max-h-[90vh] overflow-y-auto text-white w-80" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-4">Reset Balance</h2>
              <p className="mb-2">Current Balance: $10000.00</p>
              <label className="block mb-1">Enter new balance</label>
              <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} min="0" step="0.01" className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white" />
              <div className="flex justify-end gap-3 mt-4">
                <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white" onClick={() => setBalanceModal(false)}>Cancel</button>
                <button className="bg-yellow-500 px-4 py-2 rounded text-black" onClick={handleBalanceSubmit}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModal && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50" onClick={() => setViewModal(false)}>
            <div className="bg-black p-6 rounded shadow-lg max-h-[90vh] overflow-y-auto text-white w-[90%] max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-4">View Account Details</h2>
              {viewData && (
                <div className="flex justify-between text-white mb-4 space-x-6">
                  <h3 className="text-lg font-semibold">Balance: ${viewData.account_summary?.balance || 0}</h3>
                  <h3 className="text-lg font-semibold">Equity: ${viewData.account_summary?.equity || 0}</h3>
                  <h3 className="text-lg font-semibold">Open Positions: {viewData.account_summary?.open_positions || 0}</h3>
                </div>
              )}

              <div className="flex gap-4 mb-4">
                <button className={`px-4 py-2 rounded ${viewTab === 'history' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`} onClick={() => setViewTab('history')}>History</button>
                <button className={`px-4 py-2 rounded ${viewTab === 'positions' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`} onClick={() => setViewTab('positions')}>Positions</button>
              </div>

              {viewTab === 'history' && viewData && <TableStructure columns={historyColumns} data={viewData.transactions || []} />}
              {viewTab === 'positions' && viewData && <TableStructure columns={positionsColumns} data={viewData.positions || []} />}

              <div className="flex justify-end mt-4">
                <button className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white" onClick={() => setViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
