import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import TableStructure from "../commonComponent/TableStructure";
import { apiCall } from "../utils/api";

/* =====================================================
   CONFIG
===================================================== */
const USER_TICKETS_API = "/tickets/";
const ADMIN_TICKETS_API = "/admin-tickets/";

const Tickets = ({ isAdmin = false }) => {
  const { isDarkMode } = useTheme();

  /* =====================================================
     STATE
  ===================================================== */
  const [activeTab, setActiveTab] = useState("Waiting");
  const [tickets, setTickets] = useState({
    open: [],
    pending: [],
    closed: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =====================================================
     TAB → BACKEND STATUS MAP
  ===================================================== */
  const tabStatusMap = {
    Waiting: "open",
    Pending: "pending",
    Closed: "closed",
  };

  /* =====================================================
     FETCH TICKETS
  ===================================================== */
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = isAdmin ? ADMIN_TICKETS_API : USER_TICKETS_API;

      const data = await apiCall(endpoint, {
        method: "GET",
      });

      setTickets({
        open: data.open || [],
        pending: data.pending || [],
        closed: data.closed || [],
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isAdmin]);

  /* =====================================================
     ACTIONS (FRONTEND ONLY DEMO)
     NOTE: Replace with API PATCH when backend is ready
  ===================================================== */
  const openTicket = (id) => {
    setTickets((prev) => ({
      ...prev,
      open: prev.open.filter((t) => t.id !== id),
      pending: [
        ...prev.pending,
        prev.open.find((t) => t.id === id),
      ],
    }));
  };

  const closeTicket = (id) => {
    setTickets((prev) => ({
      ...prev,
      pending: prev.pending.filter((t) => t.id !== id),
      closed: [
        ...prev.closed,
        prev.pending.find((t) => t.id === id),
      ],
    }));
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */
  const columns = [
    {
      Header: "Created Date",
      accessor: "created_at",
      Cell: (value) => new Date(value).toLocaleDateString(),
    },
    { Header: "Ticket ID", accessor: "id" },
    { Header: "User ID", accessor: "created_by" },
    { Header: "Subject", accessor: "subject" },
    { Header: "Status", accessor: "status" },
  ];

  /* =====================================================
     FILTERED DATA BY TAB
  ===================================================== */
  const tableData = useMemo(() => {
    return tickets[tabStatusMap[activeTab]] || [];
  }, [tickets, activeTab]);

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div
      className={`${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      } h-full px-4 py-6 md:px-8`}
    >
      <header className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">
          {isAdmin ? "Admin Support Tickets" : "My Support Tickets"}
        </h2>
      </header>

      {/* TABS */}
      <div className="flex justify-center gap-4 mb-6">
        {["Waiting", "Pending", "Closed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-md font-semibold transition
              ${
                activeTab === tab
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-yellow-300"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div
        className={`rounded-lg border ${
          isDarkMode
            ? "border-gray-800 bg-black"
            : "border-gray-300 bg-white"
        } shadow-md p-4`}
      >
        {loading && (
          <p className="text-center text-yellow-400">Loading tickets...</p>
        )}

        {error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <TableStructure
            columns={columns}
            data={tableData}
            actionsColumn={(row) => {
              if (activeTab === "Waiting") {
                return (
                  <button
                    onClick={() => openTicket(row.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Open
                  </button>
                );
              }

              if (activeTab === "Pending") {
                return (
                  <button
                    onClick={() => closeTicket(row.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Close
                  </button>
                );
              }

              return null;
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Tickets;
