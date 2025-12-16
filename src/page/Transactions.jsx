// Updated Transactions Component with Status Filter Functionality
// (Design & logic unchanged – ONLY responsive improvements added)

import React, { useState, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";

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
    console.error("Error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Something went wrong while displaying the table.
        </div>
      );
    }

    return this.props.children;
  }
}

/* -------------------- CSV Helper -------------------- */
function convertToCSV(data, columns) {
  const header = columns.map((c) => c.Header).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const cell = row[c.accessor];
        if (typeof cell === "string") {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell ?? "";
      })
      .join(",")
  );
  return [header, ...rows].join("\r\n");
}

/* -------------------- Component -------------------- */
export default function Transactions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("Deposit");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* -------------------- Fetch -------------------- */
  const onFetch = useCallback(
    async ({ page: p = 1, pageSize: ps = 10, query = "" } = {}) => {
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

        let url = "";
        if (typeFilter === "Deposit") url = "/api/admin/deposit/?" + params;
        else if (typeFilter === "Withdrawal") url = "/api/admin/withdraw/?" + params;
        else url = "/api/admin/internal-transfer/?" + params;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Network error");
        const data = await res.json();

        let results = Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        const total = data.total ?? results.length;
        results = applyStatusFilter(results, statusFilter);

        const start = (p - 1) * ps;
        const sliced = results.slice(start, start + ps);

        const mapped = sliced.map((item) =>
          typeFilter === "Internal Transfer"
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
              }
        );

        return { data: mapped, total };
      } catch (e) {
        console.error(e);
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
      <button
        onClick={() => setStatusFilter(s)}
        className={`px-2 py-1 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap ${styles[s] || ""}`}
      >
        {s.toUpperCase()}
      </button>
    );
  };

  /* -------------------- Columns -------------------- */
  const columns =
    typeFilter === "Internal Transfer"
      ? [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "From Account ID", accessor: "fromAccountId" },
          { Header: "To Account ID", accessor: "toAccountId" },
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
    <div className="flex flex-col min-h-screen w-full bg-black text-yellow-400 p-3 sm:p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 mb-6 p-4 bg-black shadow-inner rounded-lg max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:col-span-3">
          <label className="text-xs font-semibold">Type</label>
          <select
            className="px-4 py-2 rounded border border-yellow-400 bg-black"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option>Deposit</option>
            <option>Withdrawal</option>
            <option>Internal Transfer</option>
          </select>
        </div>

        <div className="flex flex-col md:col-span-3">
          <label className="text-xs font-semibold">Status</label>
          <select
            className="px-4 py-2 rounded border border-yellow-400 bg-black"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold">From</label>
          <input
            type="date"
            className="px-4 py-2 rounded border border-yellow-400 bg-black"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="text-xs font-semibold">To</label>
          <input
            type="date"
            className="px-4 py-2 rounded border border-yellow-400 bg-black"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 md:col-span-2 md:justify-end">
          <button className="bg-yellow-500 text-black px-4 py-2 rounded flex items-center gap-1">
            <Download size={16} /> CSV
          </button>
          <button className="bg-yellow-500 text-black px-4 py-2 rounded flex items-center gap-1">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {tokenMissing && (
        <div className="bg-red-600 text-white p-3 rounded mb-4 max-w-[1400px] mx-auto w-full">
          Authentication token missing. Please login.
        </div>
      )}

      {/* Table */}
      <ErrorBoundary>
        <div className="flex-1 mx-auto w-full h-[60vh] md:h-[70vh] overflow-auto">
          <TableStructure
            columns={columns}
            serverSide
            onFetch={onFetch}
            page={page}
            pageSize={pageSize}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}

/* -------------------- Status Filter -------------------- */
function applyStatusFilter(results, status) {
  if (status === "all") return results;
  return results.filter((r) => r.status?.toLowerCase() === status);
}
