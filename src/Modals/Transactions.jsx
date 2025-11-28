import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import TableStructure from '../commonComponent/TableStructure';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('/api');
const client = new AdminAuthenticatedFetch('');
const Transactions = ({ visible, onClose, accountId, isDarkMode }) => {
  const modalBg = isDarkMode ? "bg-gray-900 text-yellow-300" : "bg-white text-black";
  const btnPrimary = "bg-yellow-500 text-black hover:bg-yellow-400";
  const btnGhost = isDarkMode ? "bg-gray-800 text-white border border-gray-700" : "bg-gray-100 text-black border border-gray-200";
  const [activeTab, setActiveTab] = useState('completed');
  const [completedData, setCompletedData] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination and search states
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedPageSize, setCompletedPageSize] = useState(10);
  const [completedPage, setCompletedPage] = useState(1);
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingPage, setPendingPage] = useState(1);

  useEffect(() => {
    if (visible && accountId) {
      fetchTransactions();
    }
  }, [visible, accountId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token")
        : null;

      const data = await client.get(`/user/${accountId}/transactions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setCompletedData(data.completed || []);
      setPendingData(data.pending || []);
      setTotalCompleted(data.total_completed || 0);
      setTotalPending(data.total_pending || 0);
      setUserName(data.user_name || '');
    } catch (err) {
      console.error("Fetch transactions error:", err);
      alert(`Error fetching transactions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search
  const getFilteredData = (data, search) => {
    if (!search) return data;
    return data.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  };

  const completedFiltered = getFilteredData(completedData, completedSearch);
  const pendingFiltered = getFilteredData(pendingData, pendingSearch);

  // Columns for TableStructure
  const transactionColumns = useMemo(
    () => [
      { Header: "ID", accessor: "id" },
      { Header: "Date", accessor: "date" },
      { Header: "Amount", accessor: "amount" },
      { Header: "Type", accessor: "type" },
      { Header: "Account", accessor: "account" },
      { Header: "Status", accessor: "status" },
      { Header: "Approved By", accessor: "approvedBy" },
      { Header: "Approval Date", accessor: "approvalDate" },
      { Header: "Description", accessor: "description" },
    ],
    []
  );

  // onFetch for completed transactions
  const handleCompletedFetch = React.useCallback(
    async ({ page: p = 1, pageSize: ps = 10, query = "" }) => {
      const filtered = getFilteredData(completedData, query);
      const start = (p - 1) * ps;
      const end = start + ps;
      const paginated = filtered.slice(start, end);
      return { data: paginated, total: filtered.length };
    },
    [completedData]
  );

  // onFetch for pending transactions
  const handlePendingFetch = React.useCallback(
    async ({ page: p = 1, pageSize: ps = 10, query = "" }) => {
      const filtered = getFilteredData(pendingData, query);
      const start = (p - 1) * ps;
      const end = start + ps;
      const paginated = filtered.slice(start, end);
      return { data: paginated, total: filtered.length };
    },
    [pendingData]
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative max-w-4xl w-full mx-4 rounded-lg shadow-xl ${modalBg} border ${isDarkMode ? "border-yellow-700" : "border-gray-200"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? "#b8860b33" : "#eee" }}>
          <h3 className={`text-xl font-bold ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>Transactions Summary for {userName}</h3>
          <button className="p-1" onClick={onClose} aria-label="Close transactions">
            <X />
          </button>
        </div>
        <div className="p-6">
          <div className="trans-tabs">
            <button
              className={`trans-tab ${activeTab === 'completed' ? 'active' : ''}`}
              data-tab="trans-completed-section"
              onClick={() => setActiveTab('completed')}
            >
              Completed ({totalCompleted})
            </button>
            <button
              className={`trans-tab ${activeTab === 'pending' ? 'active' : ''}`}
              data-tab="trans-pending-section"
              onClick={() => setActiveTab('pending')}
            >
              Pending ({totalPending})
            </button>
          </div>

          {/* Completed Section */}
          {activeTab === 'completed' && (
            <section id="trans-completed-section" className="trans-section active">
              <div className="trans-search">
                <input
                  id="trans-completed-search"
                  type="text"
                  placeholder="Search completed transactions"
                  value={completedSearch}
                  onChange={(e) => setCompletedSearch(e.target.value)}
                />
                <select
                  id="trans-completed-size"
                  value={completedPageSize}
                  onChange={(e) => setCompletedPageSize(Number(e.target.value))}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              <TableStructure
                columns={transactionColumns}
                onFetch={handleCompletedFetch}
                serverSide={false}
                initialPageSize={completedPageSize}
                searchQuery={completedSearch}
              />
            </section>
          )}

          {/* Pending Section */}
          {activeTab === 'pending' && (
            <section id="trans-pending-section" className="trans-section active">
              <div className="trans-search">
                <input
                  id="trans-pending-search"
                  type="text"
                  placeholder="Search pending transactions"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                />
                <select
                  id="trans-pending-size"
                  value={pendingPageSize}
                  onChange={(e) => setPendingPageSize(Number(e.target.value))}
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              <TableStructure
                columns={transactionColumns}
                onFetch={handlePendingFetch}
                serverSide={false}
                initialPageSize={pendingPageSize}
                searchQuery={pendingSearch}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
