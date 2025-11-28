import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import TableStructure from '../commonComponent/TableStructure';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const HistoryModal = ({ visible, onClose, accountId, activeTab, setActiveTab }) => {
  const [selectedDays, setSelectedDays] = useState(30);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiClient = new AdminAuthenticatedFetch('/api');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/trading-account/${accountId}/history/?days_back=${selectedDays}`);
      setHistoryData(response);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchHistory();
    }
  }, [accountId, selectedDays]);

  if (!visible) return null;

  const transactionsColumns = [
    { Header: "Date", accessor: "date" },
    { Header: "Type", accessor: "type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
    { Header: "Comment", accessor: "comment" },
  ];

  const transactionsData = historyData?.transactions?.map(transaction => ({
    date: new Date(transaction.created_at).toLocaleDateString(),
    type: transaction.transaction_type,
    amount: `$${transaction.amount}`,
    status: transaction.status,
    comment: transaction.description,
  })) || [];

  const positionsColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "Symbol", accessor: "symbol" },
    { Header: "Vol", accessor: "volume" },
    { Header: "Price", accessor: "price" },
    { Header: "P/L", accessor: "pl" },
  ];

  const positionsData = historyData?.positions?.map(position => ({
    id: position.id,
    symbol: position.symbol,
    volume: position.volume,
    price: position.price,
    pl: position.pl,
  })) || [];

  return (
    <ModalWrapper title={`Account Summary (ID: ${accountId})`} visible={visible} onClose={onClose}>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-6 bg-gray-900 p-4 rounded-lg border border-yellow-500/30 mb-6">
        <div>
          <p className="text-gray-400 text-sm">Balance</p>
          <p className="text-yellow-400 text-lg font-semibold">${historyData?.account_summary?.balance?.toFixed(2) || '0.00'}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Equity</p>
          <p className="text-yellow-400 text-lg font-semibold">${historyData?.account_summary?.equity?.toFixed(2) || '0.00'}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Open Positions</p>
          <p className="text-yellow-400 text-lg font-semibold">{historyData?.account_summary?.open_positions || 0}</p>
        </div>
      </div>

      {/* History Range Section */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-gray-400 text-sm">History Range:</label>
        <select
          value={selectedDays}
          onChange={(e) => setSelectedDays(Number(e.target.value))}
          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
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
