
import React, { useMemo, useState } from "react";
import TableStructure from "../commonComponent/TableStructure";

const DemoAccount = () => {
  const [resetLeverageModalOpen, setResetLeverageModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [leverage, setLeverage] = useState("500x");

  // New state for reset balance modal
  const [resetBalanceModalOpen, setResetBalanceModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState("10000.00");


  // State for View modal and tab
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState("history");

  const leverageOptions = [
    "1x",
    "2x",
    "5x",
    "10x",
    "20x",
    "50x",
    "100x",
    "500x",
    "10000x",
  ];

  // Sample static data for view modal tables
  const accountSummary = {
    balance: 0,
    equity: 0,
    openPositions: 0,
  };

  const historyColumns = [
    { Header: "Date", accessor: "date" },
    { Header: "Type", accessor: "type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Description", accessor: "description" },
  ];

  const historyData = [
    // Empty initially, showing "No recent transactions"
  ];

  const positionsColumns = [
    { Header: "Ticket", accessor: "ticket" },
    { Header: "Symbol", accessor: "symbol" },
    { Header: "Type", accessor: "type" },
    { Header: "Size", accessor: "size" },
    { Header: "Price", accessor: "price" },
    { Header: "Profit", accessor: "profit" },
  ];

  const positionsData = [
    // Empty initially
  ];

  const openResetLeverageModal = (row) => {
    setSelectedRow(row);
    setLeverage("500x");
    setResetLeverageModalOpen(true);
  };

  const closeResetLeverageModal = () => {
    setResetLeverageModalOpen(false);
    setSelectedRow(null);
  };

  const openResetBalanceModal = (row) => {
    setSelectedRow(row);
    // Default balance can be set per user data or static
    setNewBalance("10000.00");
    setResetBalanceModalOpen(true);
  };

  const closeResetBalanceModal = () => {
    setResetBalanceModalOpen(false);
    setSelectedRow(null);
  };

  const openViewModal = (row) => {
    setSelectedRow(row);
    setViewTab("history");
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedRow(null);
  };

  const handleLeverageInputChange = (e) => {
    setLeverage(e.target.value);
  };

  const handleNewBalanceInputChange = (e) => {
    setNewBalance(e.target.value);
  };

  const handleLeverageSubmit = () => {
    alert(`Leverage reset to ${leverage} for ID ${selectedRow?.id}`);
    closeResetLeverageModal();
  };

  const handleResetBalanceSubmit = () => {
    alert(`Balance reset to $${newBalance} for ID ${selectedRow?.id}`);
    closeResetBalanceModal();
  };

  const handleViewTabChange = (tab) => {
    setViewTab(tab);
  };

  const columns = useMemo(() => [
    { Header: "ID", accessor: "id" },
    { Header: "Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Phone", accessor: "phone" },
    { Header: "Account ID", accessor: "accountId" },
    { Header: "Registered Date", accessor: "registeredDate" },
    { Header: "Country", accessor: "country" },
  ], []);

  const data = useMemo(() => [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      phone: "+1-202-555-0123",
      accountId: "AC10001",
      registeredDate: "2023-01-15",
      country: "USA",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@example.com",
      phone: "+44-20-7946-0958",
      accountId: "AC10002",
      registeredDate: "2023-02-20",
      country: "UK",
    },
    {
      id: 3,
      name: "Carlos Morales",
      email: "carlos.morales@example.com",
      phone: "+52-55-1234-5678",
      accountId: "AC10003",
      registeredDate: "2023-03-05",
      country: "Mexico",
    },
  ], []);

  const actionsColumn = (row) => {
    return (
      <div className="flex gap-2">
        <button
          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation();
            alert(`Disable clicked for ID ${row.id}`);
          }}
        >
          Disable
        </button>
        <button
          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            openViewModal(row);
          }}
        >
          View
        </button>
        <button
          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
          onClick={(e) => {
            e.stopPropagation();
            // open alert replaced by modal open
            openResetBalanceModal(row);
          }}
        >
          Reset Balance
        </button>
        <button
          className="bg-yellow-600 text-black px-2 py-1 rounded hover:bg-yellow-700"
          onClick={(e) => {
            e.stopPropagation();
            openResetLeverageModal(row);
          }}
        >
          Reset Leverage
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TableStructure
        columns={columns}
        data={data}
        actionsColumn={actionsColumn}
      />

        {resetLeverageModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={closeResetLeverageModal}
          >
            <div
              className="bg-black p-6 rounded shadow-lg w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-white">Reset Leverage</h2>
              <p className="mb-2 text-white">
                Current Leverage: 500x
              </p>
              <label htmlFor="leverageInput" className="block mb-1 text-white">
                Select or enter the leverage
              </label>
              <input
                list="leverageOptions"
                id="leverageInput"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white"
                value={leverage}
                onChange={handleLeverageInputChange}
                autoFocus
              />
              <datalist id="leverageOptions">
                {leverageOptions.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
              <div className="flex justify-end gap-3">
                <button
                  className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white"
                  onClick={closeResetLeverageModal}
                >
                  Cancel
                </button>
                <button
                  className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600"
                  onClick={handleLeverageSubmit}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {resetBalanceModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={closeResetBalanceModal}
          >
            <div
              className="bg-black p-6 rounded shadow-lg w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-white">Reset Balance</h2>
              <p className="mb-2 text-white">
                Current Balance: $10000.00
              </p>
              <label htmlFor="balanceInput" className="block mb-1 text-white">
                Enter new balance
              </label>
              <input
                type="number"
                id="balanceInput"
                className="border border-gray-300 rounded px-3 py-2 w-full mb-4 bg-gray-800 text-white"
                value={newBalance}
                onChange={handleNewBalanceInputChange}
                autoFocus
                min="0"
                step="0.01"
              />
              <div className="flex justify-end gap-3">
                <button
                  className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-white"
                  onClick={closeResetBalanceModal}
                >
                  Cancel
                </button>
                <button
                  className="bg-yellow-500 px-4 py-2 rounded text-black hover:bg-yellow-600"
                  onClick={handleResetBalanceSubmit}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {viewModalOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={closeViewModal}
          >
            <div
              className="bg-black p-6 rounded shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-white">
                Account History & Live Positions
              </h2>
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-white">
                <div>
                  <span className="font-semibold">Balance: </span>${accountSummary.balance.toFixed(2)}{" "}
                  <span className="font-semibold ml-4">Equity: </span>${accountSummary.equity.toFixed(2)}{" "}
                  <span className="font-semibold ml-4">Open Positions: </span>{accountSummary.openPositions}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded ${
                      viewTab === "history"
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    onClick={() => handleViewTabChange("history")}
                  >
                    History
                  </button>
                  <button
                    className={`px-4 py-2 rounded ${
                      viewTab === "positions"
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    onClick={() => handleViewTabChange("positions")}
                  >
                    Positions
                  </button>
                </div>
              </div>
              {viewTab === "history" ? (
                <TableStructure
                  columns={historyColumns}
                  data={historyData}
                />
              ) : (
                <TableStructure
                  columns={positionsColumns}
                  data={positionsData}
                />
              )}
              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={closeViewModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default DemoAccount;
