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
      pl: position.pl,
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
    <ModalWrapper title={`Account Summary (ID: ${accountId})`} visible={visible} onClose={onClose}>

      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-1 sm:gap-6 p-2 sm:p-4 rounded-lg border border-yellow-500/30 mb-4 sm:mb-6">
        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm mb-0.5">Balance</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">${historyData?.account_summary?.balance?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm mb-0.5">Equity</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">${historyData?.account_summary?.equity?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="text-center py-1">
          <p className="text-gray-400 text-xs sm:text-sm mb-0.5">Open Positions</p>
          <p className="text-yellow-400 text-sm sm:text-lg font-semibold">{historyData?.account_summary?.open_positions || 0}</p>
        </div>
      </div>

          {/* Compact Controls: Transactions / Open Positions + History Range in one line */}
<<<<<<< HEAD
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 w-full">
            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
            	  setActiveTab("transactions");
            	  setCurrentPage(1);
          	}}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded transition text-xs sm:text-sm ${
                  activeTab === "transactions"
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                Transactions
              </button>

              <button
                onClick={() => {
            	  setActiveTab("positions");
            	  setCurrentPage(1);
          	}}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 rounded transition text-xs sm:text-sm ${
                  activeTab === "positions"
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                Open Positions
              </button>
=======
          <div className="flex items-center justify-between gap-4 mb-4 flex-nowrap w-full">
            {/* Count badges for Transactions and Open Positions */}
            <div className="flex-1 flex items-center gap-2">

              {/* Transactions Button with Notification Badge */}
              <div className="relative inline-block">
                <button
                  onClick={() => {
                    setActiveTab("transactions");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded transition ${
                    activeTab === "transactions"
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  Transactions
                  {/* Notification badge in top-right corner */}
                  {transactionsData.length > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow">
                      {transactionsData.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Open Positions Button with Notification Badge */}
              <div className="relative inline-block">
                <button
                  onClick={() => {
                    setActiveTab("positions");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded transition ${
                    activeTab === "positions"
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  Open Positions
                  {positionsData.length > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow">
                      {positionsData.length}
                    </span>
                  )}
                </button>
              </div>
>>>>>>> c0e34f07972a68499e95cce33664118281f3cca5
            </div>

            <div className="flex gap-1 sm:gap-2 w-full sm:w-auto sm:justify-end">
                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                  className="bg-gray-700 text-white px-2 py-2 rounded border border-gray-600 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
                <button
                  onClick={fetchHistory}
                  disabled={loading}
                  className="bg-yellow-400 text-black px-2 sm:px-3 py-2 rounded hover:bg-yellow-500 transition disabled:opacity-50 text-xs sm:text-sm font-semibold flex-1 sm:flex-none"
                >
                  {loading ? 'Refresh...' : 'Refresh'}
                </button>
              </div>
          </div>

      {/* Table Section */}
      <div className="mt-4 w-full overflow-x-auto">
        {activeTab === "transactions" && (
          <div className={`border rounded ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
            <table className="text-xs sm:text-sm border-collapse w-full">
              <thead className="sticky top-0 z-10">
                <tr className={isDarkMode ? "bg-yellow-500/20 border-b border-yellow-500/50" : "bg-yellow-400/20 border-b border-yellow-400/50"}>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Date</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Type</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Amount</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Status</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold hidden sm:table-cell ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Comment</th>
                </tr>
              </thead>
            </table>
            <div className={`overflow-y-auto max-h-64 sm:max-h-80 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <table className="text-xs sm:text-sm border-collapse w-full">
                <tbody>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((row, idx) => (
                      <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-100'} transition`}>
                        <td className={`px-2 sm:px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.date}</td>
                        <td className={`px-2 sm:px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.type}</td>
                        <td className={`px-2 sm:px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.amount}</td>
                        <td className="px-2 sm:px-3 py-2 truncate">
                          <span className={`px-2 py-1 rounded text-xs font-semibold inline-block ${row.status === 'approved' ? isDarkMode ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700' : isDarkMode ? 'bg-yellow-500/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-2 sm:px-3 py-2 truncate hidden sm:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.comment}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={`px-2 sm:px-3 py-4 text-center text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {transactionsData.length > itemsPerPage && (
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 px-2 sm:px-3 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Page {currentPage} of {totalTransactionPages} | Showing {paginatedTransactions.length} of {transactionsData.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${currentPage === 1 ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed' : isDarkMode ? 'bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/50' : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalTransactionPages))}
                    disabled={currentPage === totalTransactionPages}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${currentPage === totalTransactionPages ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed' : isDarkMode ? 'bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/50' : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "positions" && (
          <div className={`border rounded ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'}`}>
            <table className="text-xs sm:text-sm border-collapse w-full">
              <thead className="sticky top-0 z-10">
                <tr className={isDarkMode ? "bg-yellow-500/20 border-b border-yellow-500/50" : "bg-yellow-400/20 border-b border-yellow-400/50"}>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold hidden sm:table-cell ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>ID</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Symbol</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Vol</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Price</th>
                  <th className={`px-2 sm:px-3 py-2 text-left font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>P/L</th>
                </tr>
              </thead>
            </table>
            <div className={`overflow-y-auto max-h-64 sm:max-h-96 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <table className="text-xs sm:text-sm border-collapse w-full">
                <tbody>
                  {paginatedPositions.length > 0 ? (
                    paginatedPositions.map((row, idx) => (
                      <tr key={idx} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-100'} transition`}>
                        <td className={`px-2 sm:px-3 py-2 truncate hidden sm:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.id}</td>
                        <td className={`px-2 sm:px-3 py-2 font-semibold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.symbol}</td>
                        <td className={`px-2 sm:px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.volume}</td>
                        <td className={`px-2 sm:px-3 py-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.price}</td>
                        <td className="px-2 sm:px-3 py-2 truncate">
                          <span className={`font-semibold ${parseFloat(row.pl) >= 0 ? isDarkMode ? 'text-green-400' : 'text-green-600' : isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            {row.pl}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={`px-2 sm:px-3 py-4 text-center text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No positions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {positionsData.length > itemsPerPage && (
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 px-2 sm:px-3 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Page {currentPage} of {totalPositionPages} | Showing {paginatedPositions.length} of {positionsData.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${currentPage === 1 ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed' : isDarkMode ? 'bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/50' : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPositionPages))}
                    disabled={currentPage === totalPositionPages}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${currentPage === totalPositionPages ? isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed' : isDarkMode ? 'bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/50' : 'bg-yellow-200 text-yellow-700 hover:bg-yellow-300'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      
    </ModalWrapper>
  );
};

export default HistoryModal;
