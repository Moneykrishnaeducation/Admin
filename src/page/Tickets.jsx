import React, { useState } from "react";
import { Search } from "lucide-react";
import { useTheme } from '../context/ThemeContext';

const Tickets = () => {
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState("Waiting");

  const [tickets, setTickets] = useState([
    { id: 1, user_id: "1054", username: "JohnDoe", subject: "Login Issue", created_at: new Date(), status: "Pending" },
    { id: 2, user_id: "1055", username: "JaneDoe", subject: "Payment Issue", created_at: new Date(), status: "Waiting" },
    { id: 3, user_id: "1056", username: "Alice", subject: "Bug Report", created_at: new Date(), status: "Closed" }
  ]);

  // Filter tickets by selected tab
  const filteredTickets = tickets.filter((t) => t.status === activeTab);

  // Action: Open -> moves from Waiting → Pending
  const openTicket = (id) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: "Pending" } : t
      )
    );
  };

  // Action: Close -> moves from Pending → Closed
  const closeTicket = (id) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: "Closed" } : t
      )
    );
  };

  return (
    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} h-full px-4 py-6 md:px-8`}>

      {/* Header */}
      <header className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">Support Tickets</h2>
      </header>

      {/* Tabs */}
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

      {/* Table Section */}
      <div className={`rounded-lg border ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-300 bg-white'} shadow-md p-4`}>

        {/* Search */}
        <div className="flex justify-end mb-4">
          <div className={`flex items-center gap-2 border border-yellow-500 rounded-md px-3 py-2 w-full sm:w-72 
            ${isDarkMode ? "bg-black" : "bg-white"} hover:bg-gray-900 transition`}>
            <Search size={18} className="text-yellow-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              className={`bg-transparent w-full focus:outline-none
                ${isDarkMode ? "text-yellow-300 placeholder-yellow-400" : "text-black placeholder-gray-500"}`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-yellow-600">
          <table className="min-w-full text-left text-sm md:text-base border-collapse">
            <thead className={`${isDarkMode ? "bg-black text-yellow-200" : "bg-white text-black"}`}>
              <tr>
                <th className="p-2 border border-yellow-600">Created Date</th>
                <th className="p-2 border border-yellow-600">Ticket ID</th>
                <th className="p-2 border border-yellow-600">User ID</th>
                <th className="p-2 border border-yellow-600">Username</th>
                <th className="p-2 border border-yellow-600">Subject</th>

                {/* Action column only for Waiting & Pending */}
                {activeTab !== "Closed" && (
                  <th className="p-2 border border-yellow-600">Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b border-yellow-600`}>
                    <td className="p-2 border border-yellow-600">{ticket.created_at.toLocaleDateString()}</td>
                    <td className="p-2 border border-yellow-600">{ticket.id}</td>
                    <td className="p-2 border border-yellow-600">{ticket.user_id}</td>
                    <td className="p-2 border border-yellow-600">{ticket.username}</td>
                    <td className="p-2 border border-yellow-600">{ticket.subject}</td>

                    {/* Action Buttons */}
                    {activeTab === "Waiting" && (
                      <td className="p-2 border border-yellow-600">
                        <button
                          onClick={() => openTicket(ticket.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Open
                        </button>
                      </td>
                    )}

                    {activeTab === "Pending" && (
                      <td className="p-2 border border-yellow-600">
                        <button
                          onClick={() => closeTicket(ticket.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Close
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-center text-yellow-400" colSpan={activeTab === "Closed" ? 5 : 6}>
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
};

export default Tickets;
