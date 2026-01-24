import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import TableStructure from "../commonComponent/TableStructure";
import { apiCall } from "../utils/api";
import { AiOutlineClose } from "react-icons/ai";

/* =====================================================
   DATE FORMATTING UTILITY
===================================================== */
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}:${month}:${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return "N/A";
  }
};

/* =====================================================
   CONFIG
===================================================== */
const USER_TICKETS_API = "/api/tickets/";
const ADMIN_TICKETS_API = "/api/admin-tickets/";

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

      // Normalize different possible API shapes:
      // 1) { open: [], pending: [], closed: [] }
      // 2) { results: [...] } (paginated)
      // 3) [ ... ] (flat list)
      let open = [];
      let pending = [];
      let closed = [];

      if (Array.isArray(data)) {
        data.forEach((t) => {
          if (t.status === "open") open.push(t);
          else if (t.status === "pending") pending.push(t);
          else closed.push(t);
        });
      } else if (data && Array.isArray(data.results)) {
        data.results.forEach((t) => {
          if (t.status === "open") open.push(t);
          else if (t.status === "pending") pending.push(t);
          else closed.push(t);
        });
      } else if (data && (data.open || data.pending || data.closed)) {
        open = data.open || [];
        pending = data.pending || [];
        closed = data.closed || [];
      } else {
        // Fallback: try to extract any array-like value
        const maybe = data && Object.values(data).find((v) => Array.isArray(v));
        if (maybe) {
          maybe.forEach((t) => {
            if (t.status === "open") open.push(t);
            else if (t.status === "pending") pending.push(t);
            else closed.push(t);
          });
        }
      }

      setTickets({ open, pending, closed });
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
     ACTIONS (API CALLS TO UPDATE TICKET STATUS)
  ===================================================== */
  const openTicket = async (id) => {
    try {
      const endpoint = isAdmin ? `${ADMIN_TICKETS_API}${id}/` : `${USER_TICKETS_API}${id}/`;
      
      await apiCall(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });

      // Update frontend state after successful API call
      setTickets((prev) => {
        const ticket = prev.open.find((t) => t.id === id);
        if (!ticket) return prev;
        
        return {
          ...prev,
          open: prev.open.filter((t) => t.id !== id),
          pending: [...prev.pending, { ...ticket, status: "pending" }],
        };
      });
    } catch (err) {
      setError(`Failed to update ticket: ${err.message}`);
    }
  };

  const viewTicket = (id) => {
    // Open inline detail modal for the ticket
    openDetailModal(id);
  };

  const [detailVisible, setDetailVisible] = useState(false);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const openDetailModal = async (id) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailError(null);
    setTicketDetail(null);
    try {
      const res = await apiCall(`${isAdmin ? ADMIN_TICKETS_API : USER_TICKETS_API}${id}/`, { method: 'GET' });
      setTicketDetail(res);
    } catch {
      setDetailError('Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  };


  const closeTicket = async (id) => {
    try {
      const endpoint = isAdmin ? `${ADMIN_TICKETS_API}${id}/` : `${USER_TICKETS_API}${id}/`;
      
      await apiCall(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      // Update frontend state after successful API call
      setTickets((prev) => {
        const ticket = prev.pending.find((t) => t.id === id);
        if (!ticket) return prev;
        
        return {
          ...prev,
          pending: prev.pending.filter((t) => t.id !== id),
          closed: [...prev.closed, { ...ticket, status: "closed" }],
        };
      });
    } catch (err) {
      setError(`Failed to update ticket: ${err.message}`);
    }
  };

  /* =====================================================
     TABLE COLUMNS
  ===================================================== */
  const columns = [
    {
      Header: "Created Date & Time",
      accessor: "created_at",
      Cell: (value, row) => {
        const raw =
          value ?? row?.created_at ?? row?.createdAt ?? row?.created?.created_at ?? row?.created?.createdAt;

        return <span>{formatDateTime(raw)}</span>;
      },
    },
    { Header: "Ticket ID", accessor: "id" },
    { Header: "User ID", accessor: "user_id" },
    { Header: "User Name", accessor: "username" },
    { Header: "Subject", accessor: "subject" },
    { Header: "Description", accessor: "description" },
    { Header: "Status", accessor: "status" },
  ];

  /* =====================================================
     FILTERED DATA BY TAB
  ===================================================== */
  const tableData = useMemo(() => {
    const arr = tickets[tabStatusMap[activeTab]] || [];
    // Sort descending by created_at (newest first)
    return arr.slice().sort((a, b) => {
      const aDate = new Date(a.created_at || a.createdAt || 0).getTime();
      const bDate = new Date(b.created_at || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
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
        

        {error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!error && (
          <TableStructure
            columns={columns}
            data={tableData}
            isLoading={loading}
            serverSide={false}
            initialPageSize={10}
            actionsColumn={(row) => {
              if (activeTab === "Waiting") {
                return (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openTicket(row.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => viewTicket(row.id)}
                      className="bg-yellow-300 hover:bg-gray-600 text-white px-3 py-1 rounded"
                    >
                      View
                    </button>
                  </div>
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
        {detailVisible && (
          <div
            className={`fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm transition-colors
              ${isDarkMode
                ? 'bg-black/70'
                : 'bg-white/60'}
            `}
          >
            <div className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-900 text-yellow-300' : 'bg-white text-black'} border ${isDarkMode ? 'border-yellow-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
                <h3 className={`text-lg text-center font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Ticket Details</h3>
                <button
                  onClick={() => { setDetailVisible(false); setTicketDetail(null); }}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition
                    ${isDarkMode ? 'border-yellow-400 bg-gray-900 hover:bg-yellow-400/20' : 'border-yellow-600 bg-white hover:bg-yellow-400/20'}`}
                  aria-label="Close detail"
                >
                  <AiOutlineClose size={20} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                </button>
              </div>
              <div className="p-4">
                {detailLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : detailError ? (
                  <div className="text-center py-8 text-red-500">{detailError}</div>
                ) : ticketDetail ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>User Name</div>
                      <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>{ticketDetail.username || (ticketDetail.created_by && ticketDetail.created_by.username) || '-'}</div>
                    </div>
                    <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>User ID</div>
                      <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>{ticketDetail.user_id ?? (ticketDetail.created_by && (ticketDetail.created_by.id ?? ticketDetail.created_by.pk)) ?? '-'}</div>
                    </div>
                    <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Subject</div>
                      <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>{ticketDetail.subject || '-'}</div>
                    </div>
                    <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Status</div>
                      <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>{ticketDetail.status || '-'}</div>
                    </div>
                    <div className={`col-span-2 p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Description</div>
                      <div className={`mt-1 whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-black'}`}>{ticketDetail.description || '-'}</div>
                    </div>

                    <div className={`col-span-2 p-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Attachments</div>
                      <div className="mt-2">
                        {Array.isArray(ticketDetail.messages) && ticketDetail.messages.length > 0 ? (
                          (() => {
                            // Find the first message with a file
                            const firstMsgWithFile = ticketDetail.messages.find(m => m.file);
                            if (!firstMsgWithFile) return <div className="text-sm text-gray-500">No attachments</div>;
                            const fileUrl = firstMsgWithFile.file;
                            const filename = fileUrl.split('/').pop();
                            const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename);
                            return (
                              <div className={`mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`} style={{minWidth: 120}}>
                                {fileUrl ? (
                                  <div className="flex flex-col items-center gap-2">
                                    {isImage ? (
                                      <a href={fileUrl} target="_blank" rel="noreferrer">
                                        <img src={fileUrl} alt={filename} style={{ maxHeight: 200, maxWidth: 400, borderRadius: 6, border: '1px solid #FFD700', cursor: 'pointer' }} />
                                      </a>
                                    ) : (
                                      <a href={fileUrl} target="_blank" rel="noreferrer" className="underline text-yellow-400">
                                        {filename}
                                      </a>
                                    )}
                                    <a href={fileUrl} download className="text-xs text-yellow-500 underline mt-1">Download</a>
                                  </div>
                                ) : (
                                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{filename}</span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-sm text-gray-500">No attachments</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No details available.</div>
                )}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
                <button onClick={() => { setDetailVisible(false); setTicketDetail(null); }} className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
