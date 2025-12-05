import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Plus, X } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { get, post } from '../utils/api-config';
import TableStructure from '../commonComponent/TableStructure';

const ManagerTickets = () => {
  const { isDarkMode } = useTheme();

  const [activePage, setActivePage] = useState("view");
  const [activeTab, setActiveTab] = useState("Waiting");
  const [userId] = useState(() => {
    const uid =
      localStorage.getItem("user_id") ||
      localStorage.getItem("username") ||
      "";
    return uid;
  });
  const [tickets, setTickets] = useState({
    waiting: [],
    pending: [],
    closed: []
  });
  const fileInputRef = useRef(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const fetchTickets = async () => {
    try {
      const data = await get('tickets/');
      setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subject = formData.get('subject')?.trim();
    const description = formData.get('description')?.trim();
    const files = formData.getAll('documents');

    if (!subject) {
      alert("Subject is required.");
      return;
    }
    if (!description) {
      alert("Description is required.");
      return;
    }

    try {
      const ticketData = {
        subject,
        description,
        created_by: userId,
      };

      // If there are files, include them in FormData
      if (files.length > 0) {
        const formDataWithFiles = new FormData();
        formDataWithFiles.append('subject', subject);
        formDataWithFiles.append('description', description);
        formDataWithFiles.append('created_by', userId);
        files.forEach(file => {
          formDataWithFiles.append('documents', file);
        });

        await post('tickets/', formDataWithFiles);
      } else {
        await post('tickets/', ticketData);
      }

      alert("Ticket submitted successfully!");
      setActivePage("view");
      fetchTickets(); // Refresh tickets list
    } catch (err) {
      alert("Failed to create ticket. Please try again.");
      console.error("Error creating ticket:", err);
    }
  };

  // Action: Waiting → Open → Pending
  const openTicket = (id) => {
    setSelectedTicketId(id);
    setShowOpenModal(true);
  };

  const handleOpenSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const comment = formData.get('comment');

    try {
      // Update ticket status via API
      await post(`tickets/${selectedTicketId}/`, { status: 'pending', comment });

      // Update local state: move from waiting to pending
      setTickets(prev => {
        const updated = { ...prev };
        const ticketIndex = updated.waiting.findIndex(t => t.id === selectedTicketId);
        if (ticketIndex !== -1) {
          const ticket = updated.waiting[ticketIndex];
          updated.waiting.splice(ticketIndex, 1);
          updated.pending.push({ ...ticket, status: "Pending" });
        }
        return updated;
      });

      setShowOpenModal(false);
      setSelectedTicketId(null);
      alert("Ticket opened successfully!");
    } catch (err) {
      alert("Failed to open ticket. Please try again.");
      console.error("Error opening ticket:", err);
    }
  };

  // Action: Pending → Close → Closed
  const closeTicket = (id) => {
    setTickets(prev => {
      const updated = { ...prev };
      // Find the ticket in pending and move it to closed
      const ticketIndex = updated.pending.findIndex(t => t.id === id);
      if (ticketIndex !== -1) {
        const ticket = updated.pending[ticketIndex];
        updated.pending.splice(ticketIndex, 1);
        updated.closed.push({ ...ticket, status: "Closed" });
      }
      return updated;
    });
  };

  // Columns definition for TableStructure
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
    { Header: "Status", accessor: "status" }
  ];

  // Filter ticket by activeTab for TableStructure data
  const dataForTable = useMemo(() => {
    if (!tickets || typeof tickets !== 'object') return [];
    return tickets[activeTab.toLowerCase()] || [];
  }, [tickets, activeTab]);

  return (
    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} h-full px-4 py-6 md:px-8`}>
      {/* ===================== VIEW TICKETS PAGE ===================== */}
      {activePage === "view" && (
        <>
          <header className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">Support Tickets</h2>
            <div className="flex justify-center gap-4 mt-4">
              
              <button
                onClick={() => setActivePage("create")}
                className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-md transition"
              >
                <Plus size={18} />
                Create Ticket
              </button>
            </div>
          </header>

          {/* TABS */}
          <div className="flex justify-center gap-4 mb-6">
            {["Waiting", "Pending", "Closed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-5 py-2 rounded-md font-semibold transition
                  ${activeTab === tab ? "bg-yellow-400 text-black" : "bg-gray-700 text-yellow-300"}
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className={`rounded-lg border ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'} shadow-md p-4`}>
            <TableStructure
              columns={columns}
              data={dataForTable}
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
          </div>
        </>
      )}

      {/* ===================== CREATE TICKET PAGE ===================== */}
      {activePage === "create" && (
        <div className="flex justify-center items-center">
          <div className={`w-full max-w-2xl rounded-lg border ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'} shadow-md p-5`}>
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-yellow-400">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  name="subject"
                  type="text"
                  placeholder="Enter ticket subject"
                  required
                  className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-black placeholder-gray-600'}`}
                />
              </div>

              <div>
                <label className="block font-semibold text-yellow-400">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the issue in detail"
                  required
                  className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-black placeholder-gray-600'} h-28`}
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-yellow-400">
                  Supporting Documents (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg text-center py-6 cursor-pointer transition-all duration-200 ${isDarkMode ? 'border-gray-700 hover:border-yellow-400 hover:bg-gray-900' : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-100'}`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    📎 Click to attach file
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Accepted: JPG, JPEG, PDF (Max: 1MB)
                  </p>
                  <input type="file" name="documents" ref={fileInputRef} hidden multiple />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2 rounded-md shadow-md transition duration-200"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== OPEN TICKET MODAL ===================== */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`w-full max-w-md rounded-lg border ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'} shadow-md p-5`}>
            {/* Header */}
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

            {/* Form */}
            <form onSubmit={handleOpenSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-yellow-400">
                  Comment (Optional)
                </label>
                <textarea
                  name="comment"
                  placeholder="Add a comment when opening this ticket"
                  className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-black placeholder-gray-600'} h-24`}
                ></textarea>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOpenModal(false);
                    setSelectedTicketId(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-md shadow-md transition duration-200"
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

export default ManagerTickets;
