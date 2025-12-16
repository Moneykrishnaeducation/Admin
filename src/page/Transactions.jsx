import React, { useState, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";
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
        const results = Array.isArray(data.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        const total = data.total ?? results.length;

        const mapped = results.map((item) =>
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
    typeFilter === "Internal Transfer"
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
    <div className="flex flex-col min-h-screen bg-black text-yellow-400 p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {tokenMissing && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          Authentication token missing. Please login.
        </div>
      )}

      <ErrorBoundary>
        <div className="flex-1 overflow-auto">
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
