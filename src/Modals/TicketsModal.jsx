import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const TicketsModal = ({ visible, onClose, userName, isDarkMode = false }) => {
  const [activeTab, setActiveTab] = useState('open');

  // Sample ticket data
  const ticketsData = [
    {
      id: 'TKT-001',
      subject: 'Account Verification Issue',
      status: 'open',
      created: '2023-11-20',
    },
    {
      id: 'TKT-002',
      subject: 'Withdrawal Request',
      status: 'pending',
      created: '2023-11-18',
    },
    {
      id: 'TKT-003',
      subject: 'Demo Account Access',
      status: 'open',
      created: '2023-11-15',
    },
    {
      id: 'TKT-004',
      subject: 'Trading Platform Error',
      status: 'closed',
      created: '2023-11-10',
    },
    {
      id: 'TKT-005',
      subject: 'Password Reset',
      status: 'closed',
      created: '2023-11-05',
    },
  ];

  // Filter tickets by status
  const filteredTickets = useMemo(() => {
    return ticketsData.filter(ticket => ticket.status === activeTab);
  }, [activeTab]);

  if (!visible) return null;

  const tabs = ['open', 'pending', 'closed'];
  const bgColor = isDarkMode ? 'bg-gray-900 text-yellow-300' : 'bg-white text-black';
  const borderColor = isDarkMode ? 'border-yellow-700' : 'border-gray-200';
  const tabActiveColor = 'bg-yellow-500 text-black';
  const tabInactiveColor = isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  const tableBg = isDarkMode ? 'bg-gray-800 text-yellow-200' : 'bg-gray-50 text-black';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-black';
  const statusBadgeColors = {
    open: 'bg-blue-500 text-white',
    pending: 'bg-yellow-500 text-black',
    closed: 'bg-green-500 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-3xl mx-4 rounded-lg shadow-xl ${bgColor} border ${borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Tickets for {userName}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-opacity-80 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium transition capitalize ${
                activeTab === tab ? tabActiveColor : tabInactiveColor
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-4 overflow-x-auto">
          {filteredTickets.length > 0 ? (
            <table className={`w-full text-sm rounded overflow-hidden ${tableBg}`}>
              <thead className={tableHeaderBg}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, idx) => (
                  <tr 
                    key={ticket.id}
                    className={`border-b transition hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${
                      idx % 2 === 0 ? (isDarkMode ? 'bg-gray-850' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')
                    }`}
                    style={{ borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }}
                  >
                    <td className="px-4 py-3 font-semibold">{ticket.id}</td>
                    <td className="px-4 py-3">{ticket.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColors[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{ticket.created}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No tickets available in {activeTab} status.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded font-medium transition ${
              isDarkMode 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketsModal;
