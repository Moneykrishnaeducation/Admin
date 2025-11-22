import React, { useState } from "react";
import { Search } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import TableStructure from '../commonComponent/TableStructure';

const Tickets = () => {
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("Waiting");
  const [searchText, setSearchText] = useState("");

  const [tickets, setTickets] = useState([
    { id: 1, user_id: "1054", username: "JohnDoe", subject: "Login Issue", created_at: new Date(), status: "Pending" },
    { id: 2, user_id: "1055", username: "JaneDoe", subject: "Payment Issue", created_at: new Date(), status: "Waiting" },
    { id: 3, user_id: "1056", username: "Alice", subject: "Bug Report", created_at: new Date(), status: "Closed" }
  ]);

  // 🔎 SEARCH + TAB FILTERING
  const filteredTickets = tickets.filter((t) => {
    const matchesTab = t.status === activeTab;

    const search = searchText.toLowerCase();
    const matchesSearch =
      t.id.toString().includes(search) ||
      t.user_id.toLowerCase().includes(search) ||
      t.username.toLowerCase().includes(search) ||
      t.subject.toLowerCase().includes(search);

    return matchesTab && matchesSearch;
  });

  // Action: Waiting → Open → Pending
  const openTicket = (id) => {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, status: "Pending" } : t)
    );
  };

  // Action: Pending → Close → Closed
  const closeTicket = (id) => {
    setTickets(prev =>
      prev.map(t => t.id === id ? { ...t, status: "Closed" } : t)
    );
  };

  // Columns definition for TableStructure
  const columns = [
    {
      Header: "Created Date",
      accessor: "created_at",
      Cell: (value) => value.toLocaleDateString(),
    },
    { Header: "Ticket ID", accessor: "id" },
    { Header: "User ID", accessor: "user_id" },
    { Header: "Username", accessor: "username" },
    { Header: "Subject", accessor: "subject" },
  ];

  return (
    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} h-full px-4 py-6 md:px-8`}>

      <header className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">Support Tickets</h2>
      </header>

      {/* TABS */}
      <div className="flex justify-center gap-4 mb-6">
        {["Waiting", "Pending", "Closed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-5 py-2 rounded-full font-semibold transition
              ${activeTab === tab ? "bg-yellow-400 text-black" : "bg-gray-700 text-yellow-300"}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="flex justify-end mb-4">
        <div className={`flex items-center gap-2 border border-yellow-500 rounded-md px-3 py-2 w-full sm:w-72 
          ${isDarkMode ? "bg-black" : "bg-white"} hover:bg-gray-900 transition`}>
          <Search size={18} className="text-yellow-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`bg-transparent w-full focus:outline-none
              ${isDarkMode ? "text-yellow-300 placeholder-yellow-400" : "text-black placeholder-gray-500"}`}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className={`rounded-lg border ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'} shadow-md p-4`}>
        <TableStructure
          columns={columns}
          data={filteredTickets}
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
    </div>
  );
};

export default Tickets;
