import React, { useState, useEffect, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import TableStructure from '../commonComponent/TableStructure';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from '../context/ThemeContext';


const HistoryModal = ({ visible, onClose, accountId, activeTab, setActiveTab }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;
  const [selectedDays, setSelectedDays] = useState(30);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
    // Only run if accountId and selectedDays change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, selectedDays]);

  // Memoize computed data to prevent unnecessary re-renders
  const transactionsData = useMemo(() => {
    return historyData?.transactions?.map(transaction => ({
      date: new Date(transaction.created_at).toLocaleDateString(),
      type: transaction.transaction_type,
      amount: `$${transaction.amount}`,
      status: transaction.status,
      comment: transaction.description,
    })) || [];
  }, [historyData?.transactions]);

  const positionsData = useMemo(() => {
    return historyData?.positions?.map(position => ({
      id: position.id,
      symbol: position.symbol,
      volume: position.volume,
      price: position.price,
      profit: position.profit,
    })) || [];
  }, [historyData?.positions]);

  // Memoize pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactionsData.slice(startIndex, endIndex);
  }, [transactionsData, currentPage, itemsPerPage]);

  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return positionsData.slice(startIndex, endIndex);
  }, [positionsData, currentPage, itemsPerPage]);

  const totalTransactionPages = useMemo(() => {
    return Math.ceil(transactionsData.length / itemsPerPage);
  }, [transactionsData.length, itemsPerPage]);

  const totalPositionPages = useMemo(() => {
    return Math.ceil(positionsData.length / itemsPerPage);
  }, [positionsData.length, itemsPerPage]);


  // Notification logic (define as memoized values to avoid ReferenceError)
  const showTransactionsDot = useMemo(() => false, []);
  const showPositionsDot = useMemo(() => false, []);

  if (!visible) return null;

  // Remove unused column definitions to prevent linting errors

  return (
    <ModalWrapper
      title={`Account Summary (ID: ${accountId})`}
      visible={visible}
      onClose={onClose}
    >
      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 p-2 sm:p-4 rounded-lg border border-yellow-500/30 mb-4 sm:mb-6">
        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm">Balance</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">
            ${historyData?.account_summary?.balance?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm">Equity</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">
            ${historyData?.account_summary?.equity?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm">Open Positions</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">
            {historyData?.account_summary?.open_positions || 0}
          </p>
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 mb-4 w-full">
        <div className="flex w-full lg:w-auto gap-2">
          {["transactions", "positions"].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`flex-1 lg:flex-none px-3 py-2 rounded text-xs sm:text-sm transition ${activeTab === tab
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
            >
              {tab === "transactions" ? "Transactions" : "Open Positions"}
            </button>
          ))}
        </div>

        <div className="flex w-full lg:w-auto gap-2 lg:ml-auto">
          <select
            value={selectedDays}
            onChange={e => setSelectedDays(Number(e.target.value))}
            className="flex-1 lg:flex-none bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 text-xs sm:text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex-1 lg:flex-none bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition disabled:opacity-50 text-xs sm:text-sm font-semibold"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===== TABLES ===== */}
      <div className="w-full">
        {/* ================= TRANSACTIONS ================= */}
        {activeTab === "transactions" && (
          <div className={`rounded border ${isDarkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-50"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-xs sm:text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className={isDarkMode ? "bg-yellow-500/20" : "bg-yellow-400/20"}>
                    {["Date", "Type", "Amount", "Status", "Comment"].map((h, i) => (
                      <th
                        key={i}
                        className={`px-3 py-2 text-center font-semibold ${i === 4 ? "hidden sm:table-cell" : ""
                          } ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length ? (
                    paginatedTransactions.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b transition ${isDarkMode
                            ? "border-gray-700 hover:bg-gray-700/50"
                            : "border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <td className="px-3 py-2 text-center">{row.date}</td>
                        <td className="px-3 py-2 text-center">{row.type}</td>
                        <td className="px-3 py-2 text-center">{row.amount}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${row.status === "approved"
                                ? isDarkMode
                                  ? "bg-green-500/30 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : isDarkMode
                                  ? "bg-yellow-500/30 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center hidden sm:table-cell">
                          {row.comment}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {transactionsData.length > itemsPerPage && (
              <div className={`flex flex-col sm:flex-row justify-between gap-2 p-3 text-xs ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <span>
                  Page {currentPage} of {totalTransactionPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalTransactionPages}
                    onClick={() => setCurrentPage(p => Math.min(totalTransactionPages, p + 1))}
                    className="px-3 py-1 rounded bg-yellow-400 text-black disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= POSITIONS ================= */}
        {activeTab === "positions" && (
          <div className={`rounded border ${isDarkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-300 bg-gray-50"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-[520px] w-full text-xs sm:text-sm">
                <thead>
                  <tr className={isDarkMode ? "bg-yellow-500/20" : "bg-yellow-400/20"}>
                    {["ID", "Symbol", "Vol", "Price", "P/L"].map((h, i) => (
                      <th
                        key={i}
                        className={`px-3 py-2 text-center font-semibold ${i === 0 ? "hidden sm:table-cell" : ""
                          } ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPositions.length ? (
                    paginatedPositions.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="hidden sm:table-cell px-3 py-2 text-center">{row.id}</td>
                        <td className="px-3 py-2 text-center font-semibold">{row.symbol}</td>
                        <td className="px-3 py-2 text-center">{row.volume}</td>
                        <td className="px-3 py-2 text-center">{row.price}</td>
                        <td className={`px-3 py-2 text-center font-semibold ${parseFloat(row.profit) >= 0
                            ? "text-green-500"
                            : "text-red-500"
                          }`}>
                          {row.profit}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        No positions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>

  );
};

export default HistoryModal;
