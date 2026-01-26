import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { get, post, patch } from "../utils/api-config";
import TableStructure from "../commonComponent/TableStructure";

// ...existing code...

const ManagerTickets = () => {
  const { isDarkMode } = useTheme();

  const [activePage, setActivePage] = useState("view");
  const [activeTab, setActiveTab] = useState("Open");

  // Removed unused userId to fix ESLint no-unused-vars

  const [tickets, setTickets] = useState({
    open: [],
    pending: [],
    closed: [],
  });

  const fileInputRef = useRef(null);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

  // FETCH ALL TICKETS
  const fetchTickets = useCallback(async () => {
    try {
      const data = await get("tickets/");
      setTickets(data);
    } catch  {
      // console.error("Error fetching tickets:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchTickets();
  }, []);

  // ---------------------------------------------------
  // FILE HANDLING
  // ---------------------------------------------------
    const handleFileChange = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    };

  // ---------------------------------------------------
  // CREATE TICKET (FULLY FIXED)
  // ---------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    // Append selected files to formData
    selectedFiles.forEach((file, idx) => {
      formData.append("documents", file);
    });

    try {
      await post("tickets/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Ticket created successfully!");
      setActivePage("view");
      setSelectedFiles([]);
      fetchTickets();
    } catch (err) {
      // console.error("Error creating ticket:", err);
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
    } catch  {
      // console.error("Error opening ticket:", err);
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
    } catch  {
      // console.error("Error closing ticket:", err);
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
    {
      Header: "Documents",
      accessor: "messages",
      Cell: (messages) => {
        const files = Array.isArray(messages) ? messages.filter(m => m.file) : [];
        if (files.length > 0) {
          const url = files[0].file;
          return (
            <button
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold w-fit"
            >
              View
            </button>
          );
        }
        return null;
      },
    },
    {
      Header: "Status",
      accessor: "status",
      Cell: (status) => {
        const s = (status || "").toLowerCase();
        let statusColor = "bg-gray-500 text-white";
        let statusLabel = "Unknown";
        if (s === "open") {
          statusColor = "bg-green-400 text-black";
          statusLabel = "Open";
        } else if (s === "pending") {
          statusColor = "bg-yellow-500 text-black";
          statusLabel = "Pending";
        } else if (s === "closed") {
          statusColor = "bg-gray-700 text-yellow-300";
          statusLabel = "Closed";
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
        );
      }
    }
  ];

  const dataForTable = useMemo(() => {
    if (!tickets || typeof tickets !== "object") return [];
    const key = activeTab.toLowerCase() === "open" ? "open" : activeTab.toLowerCase();
    const arr = tickets[key] || [];
    // Sort by created_at descending
    return arr.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
          Manager Tickets
        </h2>
        <div className="flex justify-end mt-4 w-full">
          <button
            onClick={() => setActivePage("create")}
            className={`flex items-center gap-2 font-semibold px-6 py-2 rounded-md transition ${
              activePage === "create"
                ? "bg-yellow-400 text-black"
                : "bg-gray-700 text-yellow-300 hover:bg-gray-600"
            }`}
          >
            <Plus size={18} />
            Create
          </button>
        </div>
      </header>

      {/* SHOW TABLE ONLY IF NOT IN CREATE MODE */}
      {activePage !== "create" && (
        <>
          {/* TABLE */}
          <div
            className={`rounded-lg border ${
              isDarkMode
                ? "border-gray-800 bg-black"
                : "border-gray-300 bg-white"
            } shadow-md p-4`}
          >
            {/* TABS */}
            <div className="flex flex-col sm:flex-row justify-center mt-6 gap-4 sm:gap-10 mb-6 w-full">
              {["Open", "Pending", "Closed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full sm:w-auto min-w-[220px] justify-center px-10 py-2 rounded-md font-semibold transition ${
                    activeTab === tab
                      ? "bg-yellow-400 text-black"
                      : "bg-gray-700 text-yellow-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <TableStructure
              columns={columns}
              data={dataForTable}
              
            />
          </div>
        </>
      )}

      {/* CREATE TICKET PAGE */}
      {activePage === "create" && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-neutral-900/60 backdrop-blur-lg">
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
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-center">
                      <span className="block text-sm font-semibold text-yellow-400 mb-1">Selected Files:</span>
                      <ul className="text-xs text-gray-300 inline-block">
                        {selectedFiles.map((file, idx) => (
                          <li key={idx}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <input
                    type="file"
                    name="documents"
                    ref={fileInputRef}
                    onChange={handleFileChange}
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