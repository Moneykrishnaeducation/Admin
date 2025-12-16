import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import TableStructure from "../commonComponent/TableStructure";
import SubRowButtons from "../commonComponent/SubRowButtons";
import { get, post } from "../utils/api-config";

/* -------------------- MODAL -------------------- */
const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  width = "max-w-md",
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3"
      onClick={onClose}
    >
      <div
        className={`w-full ${width} bg-black text-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          {title}
        </h2>
        {children}
        <div className="flex flex-wrap justify-end gap-3 mt-4">
          {actions}
        </div>
      </div>
    </div>
  );
};

/* -------------------- MAIN -------------------- */
const DemoAccount = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);

  /* Account enable/disable state */
  const [accountStatusMap, setAccountStatusMap] = useState({});

  /* Modals */
  const [leverageModal, setLeverageModal] = useState(false);
  const [balanceModal, setBalanceModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  /* Leverage */
  const [leverage, setLeverage] = useState("1:500");
  const leverageOptions = [
    "1:10",
    "1:20",
    "1:50",
    "1:100",
    "1:200",
    "1:500",
    "1:1000",
  ];

  /* Balance */
  const [newBalance, setNewBalance] = useState("10000.00");

  /* View modal */
  const [viewTab, setViewTab] = useState("history");
  const [viewData, setViewData] = useState(null);

  /* -------------------- TABLE -------------------- */
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

  const handleFetch = useCallback(async ({ page, pageSize, query }) => {
    try {
      const res = await get(
        `demo_accounts/?page=${page}&page_size=${pageSize}`
      );

      const rows = res?.results || res?.data || [];

      setAccountStatusMap((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          if (r?.account_id !== undefined) {
            next[r.account_id] = !!r.is_active;
          }
        });
        return next;
      });

      return {
        data: rows,
        total: res?.count || rows.length,
      };
    } catch (err) {
      console.error(err);
      return { data: [], total: 0 };
    }
  }, [refreshKey]);

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
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to reset leverage");
    }
  };

  const handleBalanceSubmit = async () => {
    if (!selectedRow) return;

    try {
      await post(
        `demo_accounts/${selectedRow.account_id}/reset_balance/`,
        { balance: newBalance }
      );

      alert("Balance reset successfully");
      setBalanceModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to reset balance");
    }
  };

  const toggleAccountStatus = async (accountId) => {
    const isEnabled = accountStatusMap[accountId];
    const endpoint = isEnabled ? "disable" : "enable";

    try {
      await post(
        `demo_accounts/${accountId}/${endpoint}/`,
        {} // ✅ REQUIRED
      );

      setAccountStatusMap((prev) => ({
        ...prev,
        [accountId]: !isEnabled,
      }));

      alert(`${isEnabled ? "Disabled" : "Enabled"} successfully`);
    } catch (err) {
      console.error(err);
      alert("Failed to change account status");
    }
  };

  const openViewModal = async (row) => {
    setSelectedRow(row);
    setViewTab("history");
    try {
      const data = await get(
        `trading-account/${row.account_id}/history/?days_back=30`
      );
      setViewData(data);
      setViewModal(true);
    } catch {
      alert("Failed to load account details");
    }
  };

  /* -------------------- ACTION COLUMN -------------------- */
  const actionsColumn = (row) => {
    const enabled = accountStatusMap[row.account_id];

    return (
      <div className="flex flex-wrap gap-2">
        <button
          className="bg-yellow-600 px-2 py-1 rounded text-white"
          onClick={() => openViewModal(row)}
        >
          View
        </button>

        <button
          className="bg-yellow-600 px-2 py-1 rounded text-white"
          onClick={() => {
            setSelectedRow(row);
            setBalanceModal(true);
          }}
        >
          Reset Balance
        </button>

        <button
          className="bg-yellow-600 px-2 py-1 rounded text-white"
          onClick={() => {
            setSelectedRow(row);
            setLeverageModal(true);
          }}
        >
          Reset Leverage
        </button>

        <button
          className={`px-2 py-1 rounded text-white ${
            enabled
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
          onClick={() => toggleAccountStatus(row.account_id)}
        >
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>
    );
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className="p-4 sm:p-6 max-w-[95vw] mx-auto">
      <TableStructure
        key={refreshKey}
        columns={columns}
        serverSide
        onFetch={handleFetch}
        renderActions={actionsColumn}
      />

      {/* RESET LEVERAGE */}
      <Modal
        open={leverageModal}
        onClose={() => setLeverageModal(false)}
        title="Reset Leverage"
        actions={[
          <button
            key="c"
            className="bg-gray-700 px-4 py-2 rounded"
            onClick={() => setLeverageModal(false)}
          >
            Cancel
          </button>,
          <button
            key="o"
            className="bg-yellow-500 px-4 py-2 rounded text-black"
            onClick={handleLeverageSubmit}
          >
            OK
          </button>,
        ]}
      >
        <input
          list="leverageList"
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
        />
        <datalist id="leverageList">
          {leverageOptions.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Modal>

      {/* RESET BALANCE */}
      <Modal
        open={balanceModal}
        onClose={() => setBalanceModal(false)}
        title="Reset Balance"
        actions={[
          <button
            key="c"
            className="bg-gray-700 px-4 py-2 rounded"
            onClick={() => setBalanceModal(false)}
          >
            Cancel
          </button>,
          <button
            key="o"
            className="bg-yellow-500 px-4 py-2 rounded text-black"
            onClick={handleBalanceSubmit}
          >
            OK
          </button>,
        ]}
      >
        <input
          type="number"
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          step="0.01"
        />
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title="Account Details"
        width="max-w-5xl"
        actions={[
          <button
            key="c"
            className="bg-gray-700 px-4 py-2 rounded"
            onClick={() => setViewModal(false)}
          >
            Close
          </button>,
        ]}
      >
        {viewData && (
          <>
            <div className="flex flex-wrap gap-6 mb-4">
              <p>Balance: ${viewData.account_summary?.balance || 0}</p>
              <p>Equity: ${viewData.account_summary?.equity || 0}</p>
              <p>Open Positions: {viewData.account_summary?.open_positions || 0}</p>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                className={`px-3 py-1 rounded ${
                  viewTab === "history"
                    ? "bg-yellow-600 text-black"
                    : "bg-gray-700"
                }`}
                onClick={() => setViewTab("history")}
              >
                History
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  viewTab === "positions"
                    ? "bg-yellow-600 text-black"
                    : "bg-gray-700"
                }`}
                onClick={() => setViewTab("positions")}
              >
                Positions
              </button>
            </div>

            {viewTab === "history" && (
              <TableStructure
                columns={historyColumns}
                data={viewData.transactions || []}
              />
            )}
            {viewTab === "positions" && (
              <TableStructure
                columns={positionsColumns}
                data={viewData.positions || []}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default DemoAccount;
