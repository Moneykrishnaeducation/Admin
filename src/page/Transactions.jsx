import React from "react";
import { useEffect, useState } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { jsPDF } from "jspdf";
import { useTheme } from "../context/ThemeContext";

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
        // Escape double quotes by doubling them for CSV compatibility and wrap in double quotes
        if (typeof cell === "string") {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      })
      .join(",")
  );
  return [header, ...rows].join("\r\n");
}


export default function Transactions() {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("Deposit");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Load dummy data only once
  useEffect(() => {
    const dummyData = [
      {
        id: "TXN001",
        dateTime: "2025-01-12 10:30 AM",
        accountId: "ACC123",
        accountName: "John Doe",
        amountUSD: 250,
        status: "success",
        source: "Online",
        approvedBy: "Admin1",
        adminComment: "Verified",
        description: "Deposit transaction",
        type: "Deposit",
        fromAccountId: "",
        toAccountId: "",
        accountHolder: "",
      },
      {
        id: "TXN002",
        dateTime: "2025-01-14 02:45 PM",
        accountId: "ACC456",
        accountName: "Alice",
        amountUSD: 150,
        status: "pending",
        source: "Branch",
        approvedBy: "Admin2",
        adminComment: "Pending approval",
        description: "Withdrawal transaction",
        type: "Withdrawal",
        fromAccountId: "",
        toAccountId: "",
        accountHolder: "",
      },
      {
        id: "TXN003",
        dateTime: "2025-01-16 11:15 AM",
        accountId: "",
        accountName: "",
        amountUSD: 90,
        status: "failed",
        source: "Mobile",
        approvedBy: "Admin3",
        adminComment: "Failed due to insufficient funds",
        description: "Internal transfer transaction",
        type: "Internal Transfer",
        fromAccountId: "ACC789",
        toAccountId: "ACC101",
        accountHolder: "Bob Smith",
      },
    ];

    const timer = setTimeout(() => {
      setTransactions(dummyData);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Status badge UI
  const getStatusBadge = (status) => {
    const styles = {
      success: "bg-green-500/20 text-green-400",
      pending: "bg-yellow-500/20 text-yellow-400",
      failed: "bg-red-500/20 text-red-400",
    };

    // Safely handle undefined or null status
    const safeStatus = status ? status.toLowerCase() : "unknown";

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[safeStatus] || ""}`}>
        {safeStatus.toUpperCase()}
      </span>
    );
  };

  // Filtering logic
  const filtered = transactions.filter((tx) => {
    // No search filtering as search bar removed by user request
    const matchStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchType = typeFilter === "all" || tx.type === typeFilter;

    // Date filtering based on fromDate and toDate (inclusive)
    let txDate = tx.dateTime.split(" ")[0]; // Extract date part YYYY-MM-DD
    const matchFromDate = fromDate ? txDate >= fromDate : true;
    const matchToDate = toDate ? txDate <= toDate : true;

    return matchStatus && matchType && matchFromDate && matchToDate;
  });

  // Dynamic Table Columns for TableStructure based on typeFilter
  const columns =
    typeFilter === "Internal Transfer"
      ? [
          { Header: "Date/Time", accessor: "dateTime" },
          { Header: "From Account ID", accessor: "fromAccountId" },
          { Header: "To Account ID", accessor: "toAccountId" },
          { Header: "Account Holder", accessor: "accountHolder" },
          {
            Header: "Amount (USD)",
            accessor: "amountUSD",
            Cell: ({ value }) => <span className="font-semibold">${value}</span>,
          },
          {
            Header: "Status",
            accessor: "status",
            Cell: ({ value }) => getStatusBadge(value),
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
          {
            Header: "Amount (USD)",
            accessor: "amountUSD",
            Cell: ({ value }) => <span className="font-semibold">${value}</span>,
          },
          {
            Header: "Status",
            accessor: "status",
            Cell: ({ value }) => getStatusBadge(value),
          },
          { Header: "Source", accessor: "source" },
          { Header: "Approved By", accessor: "approvedBy" },
          { Header: "Admin Comment", accessor: "adminComment" },
          { Header: "Description", accessor: "description" },
        ];

  const handleExportCSV = () => {
    const csvContent = convertToCSV(filtered, columns);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const headers = columns.map(col => col.Header);
    const rows = filtered.map(row =>
      columns.map(col => {
        let cell = row[col.accessor];
        return typeof cell === "string" ? cell : (cell ?? "").toString();
      })
    );
  
    doc.setFontSize(18);
    doc.text("Transactions", 14, 22);
  
    let y = 30;
    doc.setFontSize(11);
    headers.forEach((header, index) => {
      doc.text(header, 14 + index * 40, y);
    });
    y += 8;
  
    rows.forEach(row => {
      row.forEach((cell, index) => {
        doc.text(cell, 14 + index * 40, y);
      });
      y += 8;
    });
  
    doc.save("transactions.pdf");
  };


  return (
    <div className="w-full p-6 bg-gray-50 dark:bg-gray-900 min-h-screen border border-gray-300 rounded-lg bg-white shadow-md">
      {/* Page Title */}
      <div className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Transactions</div>

      <div className="grid grid-cols-12 gap-4 mb-6 items-end border border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 shadow-inner">
        {/* Removed the search bar as per user request */}

        <div className="flex flex-col col-span-3">
          <label className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">Type</label>
          <select
            className="px-4 py-2 rounded border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
            onChange={(e) => setTypeFilter(e.target.value)}
            value={typeFilter}
          >
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Internal Transfer">Internal Transfer</option>
          </select>
        </div>

        <div className="flex flex-col col-span-3">
          <label className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">Status</label>
          <select
            className="px-4 py-2 rounded border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        

        <div className="flex flex-col col-span-2">
          <label htmlFor="from-date" className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">
            From Date
          </label>
          <input
            id="from-date"
            type="date"
            className="px-4 py-2 rounded border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col col-span-2">
          <label htmlFor="to-date" className="text-xs text-gray-700 dark:text-gray-300 mb-1 font-semibold">
            To Date
          </label>
          <input
            id="to-date"
            type="date"
            className="px-4 py-2 rounded border border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* Export buttons container right aligned horizontally */}
        <div className="flex justify-end col-span-2 space-x-2">
          <button
            onClick={handleExportCSV}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-yellow-400 text-black hover:bg-yellow-500"}`}
            type="button"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-primary-600 text-white hover:bg-primary-700"}`}
            type="button"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Render the filtered transactions table */}
      <ErrorBoundary>
        <TableStructure columns={columns} data={filtered} />
      </ErrorBoundary>
    </div>
  );
}
