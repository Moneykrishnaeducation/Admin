import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import TableStructure from '../commonComponent/TableStructure';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const client = new AdminAuthenticatedFetch('');
const Transactions = ({ visible, onClose, accountId, isDarkMode }) => {
  const modalBg = isDarkMode ? "bg-gray-900 text-yellow-300" : "bg-white text-black";
  const [activeTab, setActiveTab] = useState('completed');
  const [completedData, setCompletedData] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

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

      const data = await client.get(`/ib-user/${accountId}/transactions/`, {
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
              <TableStructure
                columns={transactionColumns}
                data={completedData}
                serverSide={false}
              />
            </section>
          )}

          {/* Pending Section */}
          {activeTab === 'pending' && (
            <section id="trans-pending-section" className="trans-section active">
              <TableStructure
                columns={transactionColumns}
                data={pendingData}
                serverSide={false}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
