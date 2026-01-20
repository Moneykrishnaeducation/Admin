import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { get, post, patch } from "../utils/api-config";
import TableStructure from "../commonComponent/TableStructure";

// Helper to get cookie value
function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        let value = cookie.substring(nameEQ.length);
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing cookie:', e);
  }
  return '';
}

const ManagerTickets = () => {
  const { isDarkMode } = useTheme();

  const [activePage, setActivePage] = useState("create");
  const [activeTab, setActiveTab] = useState("Open");

  const [userId] = useState(() => {
    // User data is now stored in cookies set by backend
    // Get from user cookie if available, otherwise empty string
    return getCookie('user_id') || getCookie('username') || '';
  });

  const [tickets, setTickets] = useState({
    open: [],
    pending: [],
    closed: [],
  });

  const fileInputRef = useRef(null);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // FETCH ALL TICKETS
  const fetchTickets = useCallback(async () => {
    try {
      const data = await get("tickets/");
      setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  }, []);

  useEffect(() => {
    fetchTickets(); // eslint-disable-line
  }, []);

  // ---------------------------------------------------
  // CREATE TICKET (FULLY FIXED)
  // ---------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const subject = formData.get("subject");
    const description = formData.get("description");

    try {
      await post("tickets/", {
        subject: subject,
        description: description,
      });

      alert("Ticket created successfully!");
      setActivePage("view");
      fetchTickets();
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Failed to create ticket: " + (err.message || "Unknown error"));
    }
  };

  // ---------------------------------------------------
  // OPEN TICKET (WAITING → PENDING)
  // ---------------------------------------------------
  const openTicket = (id) => {
    setSelectedTicketId(id);
    setShowOpenModal(true);
  };

  const handleOpenSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    try {
      await patch(`tickets/${selectedTicketId}/`, {
        status: "pending",
        comment: fd.get("comment") || "",
      });

      // Move in UI
      setTickets((prev) => {
        const updated = { ...prev };
        const idx = updated.open.findIndex((t) => t.id === selectedTicketId);
        if (idx !== -1) {
          const ticket = updated.open[idx];
          updated.open.splice(idx, 1);
          updated.pending.push({ ...ticket, status: "Pending" });
        }
        return updated;
      });

      setShowOpenModal(false);
      setSelectedTicketId(null);
      alert("Ticket opened successfully!")
    } catch (err) {
      console.error("Error opening ticket:", err);
      alert("Failed to open ticket.");
    }
  };

  // ---------------------------------------------------
  // CLOSE TICKET (PENDING → CLOSED)
  // ---------------------------------------------------
  const closeTicket = async (id) => {
    try {
      await patch(`tickets/${id}/`, { status: "closed" });

      setTickets((prev) => {
        const updated = { ...prev };
        const idx = updated.pending.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const ticket = updated.pending[idx];
          updated.pending.splice(idx, 1);
          updated.closed.push({ ...ticket, status: "Closed" });
        }
        return updated;
      });
    } catch (err) {
      console.error("Error closing ticket:", err);
      alert("Error closing ticket");
    }
  };

  // ---------------------------------------------------
  // TABLE COLUMNS
  // ---------------------------------------------------
  const columns = [
    {
      Header: "Created Date",
      accessor: "created_at",
      Cell: (value) => new Date(value).toLocaleDateString(),
    },
    { Header: "Ticket ID", accessor: "id" },
    { Header: "User ID", accessor: "user_id" },
    { Header: "Username", accessor: "username" },
    { Header: "Subject", accessor: "subject" },
    { Header: "Description", accessor: "description" },
    { Header: "Status", accessor: "status" },
  ];

  const dataForTable = useMemo(() => {
    if (!tickets || typeof tickets !== "object") return [];
    const key = activeTab.toLowerCase() === "open" ? "open" : activeTab.toLowerCase();
    return tickets[key] || [];
  }, [tickets, activeTab]);

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div
      className={`${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      } h-full px-4 py-6 md:px-8`}
    >
      {/* TOP BUTTONS */}
      <header className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">
          Support Tickets
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 w-full">
          <button
            onClick={() => setActivePage("create")}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-md transition ${
              activePage === "create"
                ? "bg-yellow-400 text-black"
                : "bg-gray-700 text-yellow-300 hover:bg-gray-600"
            }`}
          >
            <Plus size={18} />
            Create
          </button>
          <button
            onClick={() => setActivePage("view")}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-md transition ${
              activePage === "view"
                ? "bg-yellow-400 text-black"
                : "bg-gray-700 text-yellow-300 hover:bg-gray-600"
            }`}
          >
            View Tickets
          </button>
        </div>
      </header>

      {/* VIEW PAGE */}
      {activePage === "view" && (
        <>

          {/* TABS */}
          <div className="flex flex-col sm:flex-row justify-center mt-6 gap-4 sm:gap-10 mb-6 w-full">
            {["Open", "Pending", "Closed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full sm:w-auto justify-center px-6 py-3 rounded-md font-semibold transition ${
                  activeTab === tab
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-700 text-yellow-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div
            className={`rounded-lg border ${
              isDarkMode
                ? "border-gray-800 bg-black"
                : "border-gray-300 bg-white"
            } shadow-md p-4`}
          >
            <TableStructure
              columns={columns}
              data={dataForTable}
              actionsColumn={
                activeTab !== "closed"
                  ? (row) => {
                      if (activeTab === "open") {
                        return (
                          <button
                            onClick={() => openTicket(row.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                          >
                            Open
                          </button>
                          
                        );
                      }
                      if (activeTab === "pending") {
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
                    }
                  : undefined
              }
            />
          </div>
        </>
      )}

      {/* CREATE TICKET PAGE */}
      {activePage === "create" && (
        <div className="flex justify-center items-center">
          <div
            className={`w-full max-w-2xl rounded-lg border ${
              isDarkMode
                ? "border-gray-800 bg-black"
                : "border-gray-300 bg-white"
            } shadow-md p-5`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-400">
                Raise a New Ticket
              </h2>
              <button
                onClick={() => setActivePage("view")}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-yellow-400">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder="Enter ticket subject"
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-100 border-gray-300 text-black"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-yellow-400">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  placeholder="Describe the issue"
                  className={`w-full p-2 rounded-md h-28 ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-100 border-gray-300 text-black"
                  }`}
                />
              </div>

              {/* FILE UPLOAD */}
              <div>
                <label className="block font-semibold text-yellow-400">
                  Supporting Documents (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg text-center py-6 cursor-pointer ${
                    isDarkMode
                      ? "border-gray-700 hover:border-yellow-400"
                      : "border-gray-300 hover:border-yellow-400"
                  }`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <p className="text-lg font-medium">📎 Click to attach file</p>
                  <p className="text-sm text-gray-400">
                    Accepted: JPG, JPEG, PNG, PDF (Max 1 MB)
                  </p>
                  <input
                    type="file"
                    name="documents"
                    ref={fileInputRef}
                    hidden
                    multiple
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2 rounded-md shadow-md"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPEN MODAL */}
      {showOpenModal && (
        <div 
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.1)", backdropFilter: "blur(5px)" }}
        >
          <div
            className={`w-full max-w-md rounded-lg border ${
              isDarkMode
                ? "border-gray-800 bg-black"
                : "border-gray-300 bg-white"
            } shadow-md p-5`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-400">
                Open Ticket
              </h2>
              <button
                onClick={() => {
                  setShowOpenModal(false);
                  setSelectedTicketId(null);
                }}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-yellow-400">
                  Comment (Optional)
                </label>
                <textarea
                  name="comment"
                  placeholder="Add a comment"
                  className={`w-full p-2 rounded-md h-24 ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-gray-100 border-gray-300 text-black"
                  }`}
                />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpenModal(false);
                    setSelectedTicketId(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-md"
                >
                  Open Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTickets