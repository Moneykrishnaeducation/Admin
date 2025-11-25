import React, { useEffect, useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { get, post } from "../utils/api-config"; // Ensure post is available in api-config

const Modal = ({ open, onClose, title, children, actions, width = "w-80" }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`bg-black p-6 rounded shadow-lg max-h-[90vh] overflow-y-auto text-white ${width}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
        {children}
        <div className="flex justify-end gap-3 mt-4">{actions}</div>
      </div>
    </div>
  );
};

const DemoAccount = () => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [leverageModal, setLeverageModal] = useState(false);
  const [leverage, setLeverage] = useState("1:500"); // Starting leverage
  const [balanceModal, setBalanceModal] = useState(false);
  const [newBalance, setNewBalance] = useState("10000.00");
  const [viewModal, setViewModal] = useState(false);
  const [viewTab, setViewTab] = useState("history");

  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const leverageOptions = [
    "1:1", "1:2", "1:5", "1:10", "1:20", "1:50", "1:100", "1:200", "1:500", "1:1000",
  ];

  const historyColumns = [
    { Header: "Date", accessor: "date" },
    { Header: "Type", accessor: "type" },
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

  const columns = useMemo(
    () => [
      { Header: "ID", accessor: "id" },
      { Header: "Name", accessor: "name" },
      { Header: "Email", accessor: "email" },
      { Header: "Phone", accessor: "phone" },
      { Header: "Account ID", accessor: "account_id" },
      { Header: "Registered Date", accessor: "registered_date" },
      { Header: "Country", accessor: "country" },
    ],
    []
  );

  useEffect(() => {
    const loadDemoAccounts = async () => {
      try {
        const response = await get("demo_accounts/");
        setDemoAccounts(response);
      } catch (err) {
        setError("Failed to load demo accounts.");
      } finally {
        setLoading(false);
      }
    };

    loadDemoAccounts();
  }, []);

  const openLeverageModal = (row) => {
    setSelectedRow(row);
    setLeverage("1:500"); // Default leverage
    setLeverageModal(true);
  };

  const openBalanceModal = (row) => {
    setSelectedRow(row);
    setNewBalance("10000.00");
    setBalanceModal(true);
  };

  const openView = (row) => {
    setSelectedRow(row);
    setViewTab("history");
    setViewModal(true);
  };

  const handleLeverageSubmit = async () => {
    try {
      if (!selectedRow || !selectedRow.account_id) {
        alert("Account ID is missing!");
        return;
      }

      // Convert leverage from "1:500" to 500 for backend
      const leverageInt = parseInt(leverage.split(":")[1]);

      // Ensure the leverage value is from the predefined options
      if (!leverageOptions.includes(leverage)) {
        alert("Invalid leverage value selected.");
        return;
      }

      await post(
        `demo_accounts/${selectedRow.account_id}/reset_leverage/`,
        { leverage: leverageInt } // Send the leverage as an integer
      );

      alert(`Leverage reset to ${leverageInt} for ID ${selectedRow?.id}`);
      setLeverageModal(false);
      setSelectedRow(null);

      // Reload demo accounts after updating
      const demoAccountsResponse = await get("demo_accounts/");
      setDemoAccounts(demoAccountsResponse);

    } catch (err) {
      console.error("Error resetting leverage:", err);
      alert("Failed to reset leverage.");
    }
  };

  const handleBalanceSubmit = async () => {
    try {
      if (!selectedRow || !selectedRow.account_id) {
        alert("Account ID is missing!");
        return;
      }

      await post(
        `demo_accounts/${selectedRow.account_id}/reset_balance/`,
        { balance: newBalance }
      );

      alert(`Balance reset to $${newBalance} for ID ${selectedRow?.id}`);
      setBalanceModal(false);
      setSelectedRow(null);

      // Reload demo accounts after updating
      const demoAccountsResponse = await get("demo_accounts/");
      setDemoAccounts(demoAccountsResponse);

    } catch (err) {
      console.error("Error resetting balance:", err);
      alert("Failed to reset balance.");
    }
  };

  const actionsColumn = (row) => (
    <div className="flex gap-2">
      <button
        className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
        onClick={(e) => {
          e.stopPropagation();
          alert(`Disable clicked for ID ${row.id}`);
        }}
      >
        Disable
      </button>
      <button
        className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
        onClick={(e) => {
          e.stopPropagation();
          openView(row);
        }}
      >
        View
      </button>
      <button
        className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
        onClick={(e) => {
          e.stopPropagation();
          openBalanceModal(row);
        }}
      >
        Reset Balance
      </button>
      <button
        className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
        onClick={(e) => {
          e.stopPropagation();
          openLeverageModal(row);
        }}
      >
        Reset Leverage
      </button>
    </div>
  );

  const [expandedRow, setExpandedRow] = useState(null);

  const handleRowClick = (row) => {
    setExpandedRow(expandedRow === row.id ? null : row.id);
  };

  const renderRowSubComponent = (row) => {
    if (expandedRow !== row.id) return null;

    return (
      <tr>
        <td colSpan={columns.length} className="p-3">
          <div className="flex gap-4">{actionsColumn(row)}</div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loading ? (
        <p className="text-yellow-400">Loading demo accounts...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <TableStructure
          columns={columns}
          data={demoAccounts}
          renderRowSubComponent={renderRowSubComponent}
          onRowClick={handleRowClick}
        />
      )}

      {/* Reset Leverage Modal */}
      <Modal
        open={leverageModal}
        onClose={() => setLeverageModal(false)}
        title="Reset Leverage"
        actions={[
          <button
            key="cancel"
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white"
            onClick={() => setLeverageModal(false)}
          >
            Cancel
          </button>,
          <button
            key="ok"
            className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600"
            onClick={handleLeverageSubmit}
          >
            OK
          </button>,
        ]}
      >
        <p className="mb-2 text-white">Current Leverage: {leverage}</p>
        <label htmlFor="leverageInput" className="block mb-1 text-white">
          Select or enter the leverage
        </label>
        <input
          list="leverageOptions"
          id="leverageInput"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white"
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          autoFocus
        />
        <datalist id="leverageOptions">
          {leverageOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </Modal>

      {/* Reset Balance Modal */}
      <Modal
        open={balanceModal}
        onClose={() => setBalanceModal(false)}
        title="Reset Balance"
        actions={[
          <button
            key="cancel"
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white"
            onClick={() => setBalanceModal(false)}
          >
            Cancel
          </button>,
          <button
            key="ok"
            className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600"
            onClick={handleBalanceSubmit}
          >
            OK
          </button>,
        ]}
      >
        <p className="mb-2 text-white">Current Balance: $10000.00</p>
        <label htmlFor="balanceInput" className="block mb-1 text-white">
          Enter new balance
        </label>
        <input
          type="number"
          id="balanceInput"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          autoFocus
          min="0"
          step="0.01"
        />
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title="View Account Details"
        width="w-150"
        actions={[
          <button
            key="close"
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white"
            onClick={() => setViewModal(false)}
          >
            Close
          </button>,
        ]}
      >
        {/* Account Summary */}
        <div className="flex justify-between text-white mb-4">
          <div className="flex space-x-6">
            <h3 className="text-lg font-semibold">Balance: ${selectedRow?.balance}</h3>
            <h3 className="text-lg font-semibold">Equity: ${selectedRow?.equity}</h3>
            <h3 className="text-lg font-semibold">Open Positions: {selectedRow?.open_positions?.length || 0}</h3>
          </div>
        </div>

        {/* Tab Buttons for History and Positions */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${viewTab === 'history' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`}
            onClick={() => setViewTab('history')}
          >
            History
          </button>
          <button
            className={`px-4 py-2 rounded ${viewTab === 'positions' ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-white'}`}
            onClick={() => setViewTab('positions')}
          >
            Positions
          </button>
        </div>

        {/* Conditionally Render Tables based on Selected Tab */}
        {viewTab === 'history' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Account History</h3>
            <TableStructure
              columns={historyColumns}
              data={selectedRow?.history || []}
            />
          </div>
        )}

        {viewTab === 'positions' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Open Positions</h3>
            <TableStructure
              columns={positionsColumns}
              data={selectedRow?.open_positions || []}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DemoAccount;
