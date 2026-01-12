// Updated Transactions Component with Status Filter Functionality
// (Only added necessary functionality for status filtering, no other code modified)

import React from "react";
import { useState, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", _error, errorInfo);
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

function convertToCSV(data, columns) {
  const header = columns.map((col) => col.Header).join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const cell = row[col.accessor];
        if (typeof cell === "string") {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      })
      .join(",")
  );
  return [header, ...rows].join("\r\n");
}

export default function ManagerTransactions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("IB Clients Deposit");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [tokenMissing, setTokenMissing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Format date to DD-MM-YYYY HH:MM:SS
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

const onFetch = useCallback(
  async ({ page: p = 1, pageSize: ps = 10, query = "" } = {}) => {
    try {
      console.log("[onFetch] Pagination Triggered:", p, ps);

      // UPDATE LOCAL STATE SO TABLE KNOWS ACTIVE PAGE
      setPage(p);
      setPageSize(ps);

      const apiClient = new AdminAuthenticatedFetch("");
      setTokenMissing(false);

      const params = new URLSearchParams();
      if (fromDate) params.append("start_date", fromDate);
      if (toDate) params.append("end_date", toDate);

      // IMPORTANT — ALWAYS USE FUNCTION ARGUMENTS
      params.append("page", p);
      params.append("pageSize", ps);

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (query) params.append("search", query);

      let url = "";
      if (typeFilter === "IB Clients Deposit") url = `/api/admin/ib-clients-deposit/?${params.toString()}`;
      else if (typeFilter === "IB Clients Withdrawal") url = `/api/admin/ib-clients-withdraw/?${params.toString()}`;
      else if (typeFilter === "IB Clients Internal Transfer") url = `/api/admin/ib-clients-internal-transfer/?${params.toString()}`;

      const data = await apiClient.get(url);

      let results = [];
      let totalCount = 0;

      if (Array.isArray(data.results)) {
        results = data.results;
        totalCount = data.total ?? results.length;
      } else if (Array.isArray(data.data)) {
        // Handle IB clients deposit API response
        results = data.data;
        totalCount = data.total ?? results.length;
      } else if (Array.isArray(data)) {
        results = data;
        totalCount = data.length;
      }

      results = applyStatusFilter(results, statusFilter);

      if (query) {
        const q = query.toLowerCase();
        results = results.filter((item) =>
          Object.values(item).some((val) => val && val.toString().toLowerCase().includes(q))
        );
      }

      const startIndex = (p - 1) * ps;
      const paginatedResults = results.slice(startIndex, startIndex + ps);

      const mappedData = paginatedResults.map((item) => {
        if (typeFilter === "IB Clients Internal Transfer") {
          return {
            id: item.id,
            dateTime: formatDate(item.created_at),
            fromAccountId: item.from_account || "",
            toAccountId: item.to_account || "",
            accountHolder: item.it_username || "",
            amountUSD: item.amount ? Number(item.amount) : 0,
            status: item.status || "",
            source: item.source || "",
            approvedBy: item.approved_by_username || "",
            adminComment: item.admin_comment || "",
            description: item.description || "",
            type: item.transaction_type || "",
            userId: item.user_id || null,
            username: item.username || "",
            email: item.email || "",
          };
        }

        return {
          id: item.id,
          dateTime: formatDate(item.created_at),
          accountId: item.trading_account_id || "",
          accountName: item.trading_account_name || "",
          amountUSD: item.amount ? Number(item.amount) : 0,
          status: item.status || "",
          source: item.source || "",
          approvedBy: item.approved_by_username || "",
          adminComment: item.admin_comment || "",
          description: item.description || "",
          type: item.transaction_type || "",
          userId: item.user_id || null,
          username: item.username || "",
          email: item.email || "",
        };
      });

      return { data: mappedData, total: totalCount };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTokenMissing(true);
      return { data: [], total: 0 };
    }
  },
  [statusFilter, typeFilter, fromDate, toDate]
);



  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      failed: "bg-red-500/20 text-red-400",
      approved: "bg-green-500/20 text-green-400",
      completed: "bg-green-500/20 text-green-400",
    };
    const safeStatus = status ? status.toLowerCase() : "unknown";

    return (
      <button
        className={`px-2 py-1 rounded text-xs font-semibold ${styles[safeStatus] || ""} cursor-pointer hover:opacity-80`}
        onClick={() => setStatusFilter(safeStatus)}
      >
        {safeStatus.toUpperCase()}
      </button>
    );
  };

  const columns =
    typeFilter === "IB Clients Internal Transfer"
      ? [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "From Account ID", accessor: "fromAccountId" },
          { Header: "To Account ID", accessor: "toAccountId" },
          { Header: "Account Holder", accessor: "accountHolder" },
          {
            Header: "Amount (USD)",
            accessor: "amountUSD",
            Cell: (value) => <span className="font-semibold">${value}</span>,
          },
          {
            Header: "Status",
            accessor: "status",
            Cell: (value) => getStatusBadge(value),
          },
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
          {
            Header: "Amount (USD)",
            accessor: "amountUSD",
            Cell: (value) => <span className="font-semibold">${value}</span>,
          },
          {
            Header: "Status",
            accessor: "status",
            Cell: (value) => getStatusBadge(value),
          },
          { Header: "Source", accessor: "source" },
          { Header: "Approved By", accessor: "approvedBy" },
          { Header: "Admin Comment", accessor: "adminComment" },
          { Header: "Description", accessor: "description" },
        ];

  const fetchAllData = async () => {
    try {
      const apiClient = new AdminAuthenticatedFetch("");

      const params = new URLSearchParams();
      if (fromDate) params.append("start_date", fromDate);
      if (toDate) params.append("end_date", toDate);

      // Do not append page and pageSize to fetch all data
      if (statusFilter !== "all") params.append("status", statusFilter);

      let url = "";
      if (typeFilter === "IB Clients Deposit") url = `/api/admin/ib-clients-deposit/?${params.toString()}`;
      else if (typeFilter === "IB Clients Withdrawal") url = `/api/admin/ib-clients-withdraw/?${params.toString()}`;
      else if (typeFilter === "IB Clients Internal Transfer") url = `/api/admin/ib-clients-internal-transfer/?${params.toString()}`;

      const data = await apiClient.get(url);

      let results = [];
      if (Array.isArray(data.results)) {
        results = data.results;
      } else if (Array.isArray(data.data)) {
        // Handle IB clients deposit API response
        results = data.data;
      } else if (Array.isArray(data)) {
        results = data;
      }

      results = applyStatusFilter(results, statusFilter);

      const mappedData = results.map((item) => {
        if (typeFilter === "IB Clients Internal Transfer") {
          return {
            id: item.id,
            dateTime: formatDate(item.created_at),
            fromAccountId: item.from_account || "",
            toAccountId: item.to_account || "",
            accountHolder: item.it_username || "",
            amountUSD: item.amount ? Number(item.amount) : 0,
            status: item.status || "",
            source: item.source || "",
            approvedBy: item.approved_by_username || "",
            adminComment: item.admin_comment || "",
            description: item.description || "",
            type: item.transaction_type || "",
            userId: item.user_id || null,
            username: item.username || "",
            email: item.email || "",
          };
        }

        return {
          id: item.id,
          dateTime: formatDate(item.created_at),
          accountId: item.trading_account_id || "",
          accountName: item.trading_account_name || "",
          amountUSD: item.amount ? Number(item.amount) : 0,
          status: item.status || "",
          source: item.source || "",
          approvedBy: item.approved_by_username || "",
          adminComment: item.admin_comment || "",
          description: item.description || "",
          type: item.transaction_type || "",
          userId: item.user_id || null,
          username: item.username || "",
          email: item.email || "",
        };
      });

      return mappedData;
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      return [];
    }
  };

  const handleExportCSV = () => {
    fetchAllData().then((data) => {
      const csvContent = convertToCSV(data, columns);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

const handleExportPDF = () => {
  fetchAllData().then((data) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const headers = columns.map((col) => col.Header);
    const rows = data.map((row) =>
      columns.map((col) => {
        let cell = row[col.accessor];
        return typeof cell === "string" ? cell : (cell ?? "").toString();
      })
    );

    doc.setFontSize(14);
    doc.text("Transactions", 14, 18);

    let y = 30;
    doc.setFontSize(6);

    // Define column widths based on content for landscape
    const columnWidths = [30, 20, 25, 35, 18, 12, 18, 25, 30, 35]; // Further adjusted

    // Draw table headers
    headers.forEach((header, index) => {
      const x = 14 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
      doc.text(header, x, y);
    });

    y += 6;

    // Draw a line under headers
    doc.line(14, y - 2, 14 + columnWidths.reduce((a, b) => a + b, 0), y - 2);

    rows.forEach((row) => {
      if (y > 180) { // Adjusted for landscape
        doc.addPage();
        y = 20;
        // Redraw headers on new page
        doc.setFontSize(6);
        headers.forEach((header, index) => {
          const x = 14 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
          doc.text(header, x, y);
        });
        y += 6;
        doc.line(14, y - 2, 14 + columnWidths.reduce((a, b) => a + b, 0), y - 2);
      }

      row.forEach((cell, index) => {
        const x = 14 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
        // Truncate long text if necessary
        const maxWidth = columnWidths[index] - 1;
        const truncatedCell = cell.length > maxWidth ? cell.substring(0, maxWidth) + '...' : cell;
        doc.text(truncatedCell, x, y);
      });

      y += 5; // Even tighter spacing
    });

    doc.save("transactions.pdf");
  });
};


  return (
    <div className=" flex flex-col min-h-screen w-full text-yellow-400 p-6">
      <div className="text-2xl font-bold text-yellow-400 mb-4 text-center md:text-left">Transactions</div>

      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 mb-6 items-end rounded-lg p-4 shadow-inner w-full max-w-[1400px] mx-auto">
        <div className="flex flex-col col-span-1 md:col-span-3">
          <label className="text-xs text-yellow-400 mb-1 font-semibold">Type</label>
          <select
            className="px-4 py-2 rounded border border-yellow-400  text-yellow-400 w-full"
            onChange={(e) => setTypeFilter(e.target.value)}
            value={typeFilter}
          >
            <option value="IB Clients Deposit">IB Clients Deposit</option>
            <option value="IB Clients Withdrawal">IB Clients Withdrawal</option>
            <option value="IB Clients Internal Transfer">IB Clients Internal Transfer</option>
          </select>
        </div>

        <div className="flex flex-col col-span-1 md:col-span-3">
          <label className="text-xs text-yellow-400 mb-1 font-semibold">Status</label>
          <select
            className="px-4 py-2 rounded border border-yellow-400  text-yellow-400 w-full"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className="flex flex-col col-span-1 md:col-span-2">
          <label className="text-xs text-yellow-400 mb-1 font-semibold">From Date</label>
          <input
            type="date"
            className="px-4 py-2 rounded border border-yellow-400  text-yellow-400 w-full"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col col-span-1 md:col-span-2">
          <label className="text-xs text-yellow-400 mb-1 font-semibold">To Date</label>
          <input
            type="date"
            className="px-4 py-2 rounded border border-yellow-400  w-full"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="flex flex-row gap-2 col-span-2 md:col-span-2 justify-end">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-black hover:bg-yellow-600 transition flex items-center justify-center"
          >
            <Download size={18} />
            CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500 text-black hover:bg-yellow-600 transition flex items-center justify-center"
          >
            <FileText size={18} />
            PDF
          </button>
        </div>
      </div>

      {tokenMissing && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded max-w-[1400px] mx-auto w-full">
          Authentication token not found. Please log in to access transactions.
        </div>
      )}

      <ErrorBoundary>
    <div className="flex-1 max-w-[1400px] mx-auto w-full h-[70vh]">
      <TableStructure
  columns={columns}
  serverSide={true}
  onFetch={onFetch}
  page={page}
  pageSize={pageSize}
/>

    </div>
  </ErrorBoundary>

    </div>
  );
}

// ✔ Added status filter functionality (statusFilter now applied directly on fetched results)
function applyStatusFilter(results, statusFilter) {
  if (statusFilter === "all") return results;
  return results.filter((item) => item.status?.toLowerCase() === statusFilter.toLowerCase());
}