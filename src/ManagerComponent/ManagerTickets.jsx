import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import TableStructure from '../commonComponent/TableStructure';

const ManagerTickets = () => {
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("Waiting");

  const [tickets, setTickets] = useState([
    { id: 1, user_id: "1054", username: "JohnDoe", subject: "Login Issue", created_at: new Date(), status: "Pending" },
    { id: 2, user_id: "1055", username: "JaneDoe", subject: "Payment Issue", created_at: new Date(), status: "Waiting" },
    { id: 3, user_id: "1056", username: "Alice", subject: "Bug Report", created_at: new Date(), status: "Closed" }
  ]);

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
    { Header: "Status", accessor: "status" }
  ];

  // Filter ticket by activeTab for TableStructure data
  const dataForTable = useMemo(() => {
    return tickets.filter(ticket => ticket.status === activeTab);
  }, [tickets, activeTab]);

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
    </div>
  );
};

export default ManagerTickets;
