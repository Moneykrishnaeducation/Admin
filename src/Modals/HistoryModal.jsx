import React from 'react';
import ModalWrapper from './ModalWrapper';
import TableStructure from '../commonComponent/TableStructure';

const HistoryModal = ({ visible, onClose, accountId, activeTab, setActiveTab }) => {
  if (!visible) return null;

  const transactionsColumns = [
    { Header: "Date", accessor: "date" },
    { Header: "Type", accessor: "type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
    { Header: "Comment", accessor: "comment" },
  ];

  const transactionsData = [
    {
      date: "2023-06-10",
      type: "Deposit",
      amount: "$1000",
      status: "Completed",
      comment: "Initial Deposit",
    },
    {
      date: "2023-06-15",
      type: "Withdrawal",
      amount: "$500",
      status: "Completed",
      comment: "Cashout",
    },
    {
      date: "2023-07-01",
      type: "Credit In",
      amount: "$200",
      status: "Approved",
      comment: "-",
    },
    {
      date: "2023-07-05",
      type: "Credit Out",
      amount: "$100",
      status: "Approved",
      comment: "Requested",
    },
  ];

  const positionsColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "Symbol", accessor: "symbol" },
    { Header: "Vol", accessor: "volume" },
    { Header: "Price", accessor: "price" },
    { Header: "P/L", accessor: "pl" },
  ];

  const positionsData = [
    {
      id: 1,
      symbol: "XAUUSD",
      volume: 0.50,
      price: "2350.20",
      pl: "+$120.00",
    },
    {
      id: 2,
      symbol: "EURUSD",
      volume: 1.00,
      price: "1.0820",
      pl: "-$30.00",
    },
  ];

  return (
    <ModalWrapper title={`Account Summary (ID: ${accountId})`} visible={visible} onClose={onClose}>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-6 bg-gray-900 p-4 rounded-lg border border-yellow-500/30 mb-6">
        <div>
          <p className="text-gray-400 text-sm">Balance</p>
          <p className="text-yellow-400 text-lg font-semibold">$0.00</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Equity</p>
          <p className="text-yellow-400 text-lg font-semibold">$0.00</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Open Positions</p>
          <p className="text-yellow-400 text-lg font-semibold">0</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 rounded transition ${
            activeTab === "transactions"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          Transactions
        </button>

        <button
          onClick={() => setActiveTab("positions")}
          className={`px-4 py-2 rounded transition ${
            activeTab === "positions"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          Open Positions
        </button>
      </div>

      {/* Table Section */}
      <div className="mt-4">
        {activeTab === "transactions" && (
          <TableStructure columns={transactionsColumns} data={transactionsData} />
        )}
        {activeTab === "positions" && (
          <TableStructure columns={positionsColumns} data={positionsData} />
        )}
      </div>

      {/* Close Button */}
      <div className="flex justify-end mt-6">
        <button
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
};

export default HistoryModal;
