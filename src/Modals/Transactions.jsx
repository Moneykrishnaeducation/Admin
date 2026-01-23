import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import TableStructure from "../commonComponent/TableStructure";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const client = new AdminAuthenticatedFetch("");

const Transactions = ({ visible, onClose, accountId, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("completed");
  const [completedData, setCompletedData] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= THEME CLASSES ================= */
  const modalBg = isDarkMode
    ? "bg-black text-white border-yellow-700"
    : "bg-white text-black border-gray-200";

  const headerBorder = isDarkMode ? "border-yellow-700/30" : "border-gray-200";
  const titleText = isDarkMode ? "text-yellow-400" : "text-yellow-600";

  const tabBase =
    "px-4 py-2 rounded-md text-sm font-semibold transition-all";
  const tabActive = isDarkMode
    ? "bg-yellow-500 text-black"
    : "bg-yellow-400 text-black";
  const tabInactive = isDarkMode
    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  /* ================================================ */

  useEffect(() => {
    if (visible && accountId) {
      fetchTransactions();
    }
  }, [visible, accountId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await client.get(`/api/ib-user/${accountId}/transactions/`);

      setCompletedData(data.completed || []);
      setPendingData(data.pending || []);
      setTotalCompleted(data.total_completed || 0);
      setTotalPending(data.total_pending || 0);
      setUserName(data.user_name || "");
    } catch (err) {
      // console.error("Fetch transactions error:", err);
      alert(`Error fetching transactions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  // Consistent backdrop blur overlay for both themes
  const overlayCls = "absolute inset-0 bg-neutral-900/60 backdrop-blur-lg transition-all duration-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
      {/* Overlay */}
      <div className={overlayCls} onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl max-h-[90vh] rounded-lg shadow-xl border flex flex-col ${modalBg}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${headerBorder}`}
        >
          <h3 className={`text-base sm:text-xl font-bold ${titleText}`}>
            Transactions Summary – {userName}
          </h3>
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="Close transactions"
          >
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveTab("completed")}
              className={`${tabBase} ${
                activeTab === "completed" ? tabActive : tabInactive
              }`}
            >
              Completed ({totalCompleted})
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`${tabBase} ${
                activeTab === "pending" ? tabActive : tabInactive
              }`}
            >
              Pending ({totalPending})
            </button>
          </div>

          {/* Table Wrapper – RESPONSIVE FIX */}
          <div className="w-full overflow-x-auto overflow-y-auto max-h-[60vh] rounded-lg">
            {loading ? (
              <div className="text-center py-10 text-gray-400">
                Loading transactions...
              </div>
            ) : activeTab === "completed" ? (
              <TableStructure
                columns={transactionColumns}
                data={completedData}
                serverSide={false}
              />
            ) : (
              <TableStructure
                columns={transactionColumns}
                data={pendingData}
                serverSide={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
