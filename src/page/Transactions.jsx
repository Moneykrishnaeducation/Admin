import React, { useState, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { Download, FileText } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/* -------------------- Error Boundary -------------------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Something went wrong while displaying transactions.
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------- Component -------------------- */
export default function Transactions() {
  const { isDarkMode } = useTheme();
  const rowsPerPage = 10; // 10 rows per page

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* -------------------- Fetch -------------------- */
  const onFetch = useCallback(
    async ({ page: p = 1, pageSize: ps = rowsPerPage, query = "" } = {}) => {
      try {
        setPage(p);
        setPageSize(ps);

        if (!window.authUtils) {
          setTokenMissing(true);
          return { data: [], total: 0 };
        }

        const isAuthed = await window.authUtils.checkAuth().catch(() => false);
        if (!isAuthed) {
          setTokenMissing(true);
          return { data: [], total: 0 };
        }

        setTokenMissing(false);
        const token = window.authUtils.getToken();

        const params = new URLSearchParams();
        if (fromDate) params.append("start_date", fromDate);
        if (toDate) params.append("end_date", toDate);
        params.append("page", p);
        params.append("pageSize", ps);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (query) params.append("search", query);

        let results = [];
        let total = 0;

        if (typeFilter === "all") {
          // Fetch all data from all endpoints (set large pageSize to get all)
          const allParams = new URLSearchParams(params);
          allParams.set("pageSize", "10000"); // Fetch up to 10000 records
          allParams.set("page", "1");

          const endpoints = [
            `/api/admin/deposit/?${allParams}`,
            `/api/admin/withdraw/?${allParams}`,
            `/api/admin/internal-transfer/?${allParams}`,
          ];

          const responses = await Promise.all(
            endpoints.map((url) =>
              fetch(url, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).then((res) => res.json())
            )
          );

          responses.forEach((data) => {
            const resResults = Array.isArray(data.results)
              ? data.results
              : Array.isArray(data)
              ? data
              : [];
            results = results.concat(resResults);
            total += data.total ?? resResults.length;
          });

          // Sort by created_at descending
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          // Apply client-side search filtering
          if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter((item) => {
              const isInternalTransfer = item.from_account || item.to_account;
              if (isInternalTransfer) {
                return (
                  (item.from_account || "").toLowerCase().includes(lowerQuery) ||
                  (item.to_account || "").toLowerCase().includes(lowerQuery) ||
                  (item.it_username || "").toLowerCase().includes(lowerQuery)
                );
              } else {
                return (
                  (item.trading_account_id || "").toLowerCase().includes(lowerQuery) ||
                  (item.trading_account_name || "").toLowerCase().includes(lowerQuery) ||
                  (item.email || "").toLowerCase().includes(lowerQuery)
                );
              }
            });
            total = results.length; // Update total after filtering
          }

          // Apply client-side pagination
          const startIndex = (p - 1) * ps;
          const endIndex = startIndex + ps;
          results = results.slice(startIndex, endIndex);
        } else {
          let url;
          if (typeFilter === "Deposit") {
            url = `/api/admin/deposit/?${params}`;
          } else if (typeFilter === "Withdrawal") {
            url = `/api/admin/withdraw/?${params}`;
          } else {
            url = `/api/admin/internal-transfer/?${params}`;
          }

          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) throw new Error("Network error");

          const data = await res.json();
          results = Array.isArray(data.results)
            ? data.results
            : Array.isArray(data)
            ? data
            : [];

          total = data.total ?? results.length;
        }

        const mapped = results.map((item) => {
          if (typeFilter === "all") {
            const isInternalTransfer = item.from_account || item.to_account;
            return isInternalTransfer
              ? {
                  id: item.id,
                  dateTime: new Date(item.created_at).toLocaleString(),
                  fromAccountId: item.from_account || "",
                  toAccountId: item.to_account || "",
                  accountHolder: item.it_username || "",
                  amountUSD: Number(item.amount || 0),
                  status: item.status || "",
                  source: item.source || "",
                  approvedBy: item.approved_by_username || "",
                  adminComment: item.admin_comment || "",
                  description: item.description || "",
                }
              : {
                  id: item.id,
                  dateTime: new Date(item.created_at).toLocaleString(),
                  accountId: item.trading_account_id || "",
                  accountName: item.trading_account_name || "",
                  email: item.email || "",
                  amountUSD: Number(item.amount || 0),
                  status: item.status || "",
                  source: item.source || "",
                  approvedBy: item.approved_by_username || "",
                  adminComment: item.admin_comment || "",
                  description: item.description || "",
                };
          } else {
            return typeFilter === "Internal Transfer"
              ? {
                  id: item.id,
                  dateTime: new Date(item.created_at).toLocaleString(),
                  fromAccountId: item.from_account || "",
                  toAccountId: item.to_account || "",
                  accountHolder: item.it_username || "",
                  amountUSD: Number(item.amount || 0),
                  status: item.status || "",
                  source: item.source || "",
                  approvedBy: item.approved_by_username || "",
                  adminComment: item.admin_comment || "",
                  description: item.description || "",
                }
              : {
                  id: item.id,
                  dateTime: new Date(item.created_at).toLocaleString(),
                  accountId: item.trading_account_id || "",
                  accountName: item.trading_account_name || "",
                  email: item.email || "",
                  amountUSD: Number(item.amount || 0),
                  status: item.status || "",
                  source: item.source || "",
                  approvedBy: item.approved_by_username || "",
                  adminComment: item.admin_comment || "",
                  description: item.description || "",
                };
          }
        });

        return { data: mapped, total };
      } catch (e) {
        console.error("Transactions fetch error:", e);
        setTokenMissing(true);
        return { data: [], total: 0 };
      }
    },
    [statusFilter, typeFilter, fromDate, toDate]
  );

  /* -------------------- Status Badge -------------------- */
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      failed: "bg-red-500/20 text-red-400",
      approved: "bg-green-500/20 text-green-400",
      completed: "bg-green-500/20 text-green-400",
    };

    const s = status?.toLowerCase() || "unknown";
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${styles[s] || ""}`}
      >
        {s.toUpperCase()}
      </span>
    );
  };

  /* -------------------- Columns -------------------- */
  const columns =
    typeFilter === "all"
      ? [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "Account ID", accessor: "accountId" },
          { Header: "Account Name", accessor: "accountName" },
          { Header: "Email", accessor: "email" },
          { Header: "Amount (USD)", accessor: "amountUSD" },
          { Header: "Status", accessor: "status", Cell: getStatusBadge },
          { Header: "Source", accessor: "source" },
          { Header: "Approved By", accessor: "approvedBy" },
          { Header: "Admin Comment", accessor: "adminComment" },
          { Header: "Description", accessor: "description" },
        ]
      : typeFilter === "Internal Transfer"
      ? [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "From Account", accessor: "fromAccountId" },
          { Header: "To Account", accessor: "toAccountId" },
          { Header: "Account Holder", accessor: "accountHolder" },
          { Header: "Amount (USD)", accessor: "amountUSD" },
          { Header: "Status", accessor: "status", Cell: getStatusBadge },
          { Header: "Source", accessor: "source" },
          { Header: "Approved By", accessor: "approvedBy" },
          { Header: "Admin Comment", accessor: "adminComment" },
          { Header: "Description", accessor: "description" },
        ]
      : [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "Account ID", accessor: "accountId" },
          { Header: "Account Name", accessor: "accountName" },
          { Header: "Email", accessor: "email" },
          { Header: "Amount (USD)", accessor: "amountUSD" },
          { Header: "Status", accessor: "status", Cell: getStatusBadge },
          { Header: "Source", accessor: "source" },
          { Header: "Approved By", accessor: "approvedBy" },
          { Header: "Admin Comment", accessor: "adminComment" },
          { Header: "Description", accessor: "description" },
        ];

  /* -------------------- UI -------------------- */
  return (
    <div className="flex flex-col min-h-screen  text-yellow-400 p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {tokenMissing && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          Authentication token missing. Please login.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-800 text-white border-yellow-400' : 'bg-white text-gray-900 border-gray-300'}`}
          >
            <option value="all">All</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Internal Transfer">Internal Transfer</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-800 text-white border-yellow-400' : 'bg-white text-gray-900 border-gray-300'}`}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={`px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-800 text-white border-yellow-400' : 'bg-white text-gray-900 border-gray-300'}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={`px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-800 text-white border-yellow-400' : 'bg-white text-gray-900 border-gray-300'}`}
          />
        </div>
      </div>

      <ErrorBoundary>
        <div className="flex-1 overflow-auto">
          <TableStructure
            columns={columns}
            serverSide
            onFetch={onFetch}
            page={page}
            pageSize={pageSize}
            initialPageSize={10}
            pageSizeOptions={[10]} // Fixed to 10 rows per page
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
