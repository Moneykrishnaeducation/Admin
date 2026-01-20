import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminAuthenticatedFetch } from '../utils/fetch-utils';

const TicketsModal = ({ visible, onClose, userId: userIdProp, userName, isDarkMode = false }) => {
  const [activeTab, setActiveTab] = useState('open');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const apiClient = new AdminAuthenticatedFetch({ baseURL: '' });
  const fetchedCacheRef = React.useRef({});
  const [userId, setUserId] = useState(userIdProp || null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  
  const handleChangeStatus = async (newStatus) => {
    if (!selectedTicket) return;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await apiClient.patch(`/api/tickets/${selectedTicket}/`, { status: newStatus });
      if (typeof res === 'string') throw new Error('Non-JSON response');
      setTicketDetail(res);

      // Update cached tab lists so the ticket appears under its new status
      const idVal = res.id ?? res.pk ?? selectedTicket;

      // Helper to build user-aware cache keys
      const getCacheKey = (status) => {
        if (userId) return `user:${userId}:${status}`;
        return `all:${status}`;
      };

      // Ensure cache entries exist for all tabs
      ['open', 'pending', 'closed'].forEach((k) => {
        const key = getCacheKey(k);
        if (!Array.isArray(fetchedCacheRef.current[key])) fetchedCacheRef.current[key] = [];
      });

      // Remove ticket from all cached arrays
      Object.keys(fetchedCacheRef.current).forEach((k) => {
        fetchedCacheRef.current[k] = fetchedCacheRef.current[k].filter((t) => {
          const tId = t.id ?? t.pk ?? t.ticket_id;
          return tId !== idVal;
        });
      });

      // Add ticket to the target status cache (prepend so it appears on first page)
      const targetKey = getCacheKey(res.status);
      fetchedCacheRef.current[targetKey] = [res, ...(fetchedCacheRef.current[targetKey] || [])];

      // Update visible tickets for the current activeTab
      if (activeTab === res.status) {
        setTickets(fetchedCacheRef.current[getCacheKey(activeTab)]);
      } else {
        // If moved away from current tab, remove it from visible list
        setTickets((prev) => prev.filter((t) => (t.id ?? t.pk ?? t.ticket_id) !== idVal));
      }

    } catch (err) {
      console.warn('Failed to change ticket status', err);
      setDetailError('Failed to update ticket status');
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter tickets by status (defensive in case API returns mixed statuses)
  const filteredTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    // If returned ticket objects include a `status` field, filter by it.
    // If they don't (server already returned per-status lists), return as-is.
    const hasStatusField = tickets.some((t) => t && (t.status !== undefined));
    return hasStatusField ? tickets.filter((ticket) => ticket.status === activeTab) : tickets;
  }, [tickets, activeTab]);

  // Reset page when activeTab changes or modal opens
  useEffect(() => {
    setPage(1);
  }, [activeTab, visible]);

  // If we have a userId prop, use it directly
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp);
    }
  }, [userIdProp, visible]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const pageItems = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    const controller = new AbortController();

    // Build user-aware cache key
    const getCacheKey = (status) => {
      if (userId) return `user:${userId}:${status}`;
      return `all:${status}`;
    };

    const cacheKey = getCacheKey(activeTab);

    // If we already fetched this scope+tab, use cache and skip network call
    if (fetchedCacheRef.current[cacheKey]) {
      setTickets(fetchedCacheRef.current[cacheKey]);
      return () => controller.abort();
    }

   

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      let endpoint = `/api/tickets/?status=${encodeURIComponent(activeTab)}`;
      // Only send the userId parameter if it exists (backend accepts 'userId' or 'userid')
      if (userId) endpoint += `&userId=${encodeURIComponent(userId)}`;
      let got = null;
      try {
        const res = await apiClient.get(endpoint, { Accept: 'application/json', signal: controller.signal });

        if (typeof res === 'string') {
          // Received HTML or text instead of JSON
          throw new Error('Non-JSON response received');
        }

        // Robust extraction: API may return grouped object { open:[], pending:[], closed:[] },
        // or paginated { results: [...] }, or wrapped { data: [...] }, or direct array.
        const extractTickets = (obj, statusKey) => {
          if (!obj) return null;
          // direct grouped
          if (obj[statusKey] && Array.isArray(obj[statusKey])) return obj[statusKey];
          // check common wrappers
          if (obj.data && obj.data[statusKey] && Array.isArray(obj.data[statusKey])) return obj.data[statusKey];
          if (obj.results && obj.results[statusKey] && Array.isArray(obj.results[statusKey])) return obj.results[statusKey];
          // direct arrays
          if (Array.isArray(obj)) return obj;
          if (obj.results && Array.isArray(obj.results)) return obj.results;
          if (obj.data && Array.isArray(obj.data)) return obj.data;
          // fallback: if any of the known status keys exist as arrays, return that
          const known = ['open','pending','closed'];
          for (const k of known) {
            if (obj[k] && Array.isArray(obj[k])) return obj[k];
          }
          // lastly, scan top-level values for the first array found
          for (const v of Object.values(obj)) {
            if (Array.isArray(v)) return v;
          }
          return null;
        };

        got = extractTickets(res, activeTab) || [];
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('Tickets fetch failed:', err.message || err);
        const errMsg = err.message || 'Failed to load tickets';
        if (mounted) {
          setError(errMsg);
        }
      }

      if (!mounted) return;
      setTickets(got || []);
      if (got && got.length) {
        fetchedCacheRef.current[cacheKey] = got;
      }
      if (!got || (Array.isArray(got) && got.length === 0)) setError('No tickets or failed to load tickets from API.');
      setLoading(false);
    };

    fetchTickets();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [activeTab, visible, userId, userName]);

  if (!visible) return null;

  const tabs = ['open', 'pending', 'closed'];
  const bgColor = isDarkMode ? 'bg-gray-900 text-yellow-300' : 'bg-white text-black';
  const borderColor = isDarkMode ? 'border-yellow-700' : 'border-gray-200';
  const cellBg = isDarkMode ? 'bg-gray-800 border-yellow-700 text-yellow-200' : 'bg-white border-gray-200 text-black';
  const tabActiveColor = 'bg-yellow-500 text-black';
  const tabInactiveColor = isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  const tableBg = isDarkMode ? 'bg-gray-800 text-yellow-200' : 'bg-gray-50 text-black';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-black';
  const statusBadgeColors = {
    open: 'bg-blue-500 text-white',
    pending: 'bg-yellow-500 text-black',
    closed: 'bg-green-500 text-white',
  };

  const currentDetailStatusClass = ticketDetail ? (statusBadgeColors[ticketDetail.status] || 'bg-gray-200') : 'bg-gray-200';

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md p-2 sm:p-4">
      <div className={`relative w-full max-w-3xl rounded-lg shadow-xl ${bgColor} border ${borderColor}`}>
        {/* Header */}
        <div className="relative flex justify-between items-start p-3 sm:p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <h3 className={`text-sm sm:text-lg font-bold pr-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Tickets for {userName}
          </h3>
          <button 
            onClick={onClose} 
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1 hover:bg-opacity-80 transition flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 p-2 sm:p-4 border-b overflow-x-auto" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 sm:px-4 py-2 rounded font-medium transition capitalize text-xs sm:text-sm flex-shrink-0 ${
                activeTab === tab ? tabActiveColor : tabInactiveColor
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-2 sm:p-4">
          <div className="w-full rounded overflow-hidden" style={{ background: tableBg }}>
            {/* Scrollable table area with reduced max height */}
            <div className="overflow-x-auto" style={{ maxHeight: '50vh' }}>
              {filteredTickets.length > 0 ? (
                <table className={`w-full text-xs sm:text-sm rounded`}>
              <thead className={tableHeaderBg}>
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Ticket ID</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">User ID</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">User Name</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Subject</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Description</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Status</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm">Created</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((ticket, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx;
                  const rowKey = ticket.id ?? ticket.pk ?? ticket.ticket_id ?? `${page}-${idx}`;
                  return (
                    <tr 
                      key={rowKey}
                      className={`border-b transition hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${
                        globalIdx % 2 === 0 ? (isDarkMode ? 'bg-gray-850' : 'bg-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-50')
                      }`}
                      style={{ borderColor: isDarkMode ? '#4b5563' : '#e5e7eb' }}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm">{ticket.id ?? ticket.pk ?? ticket.ticket_id}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ticket.user_id || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ticket.username || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ticket.subject || ticket.title || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs truncate">{ticket.description || '-'}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColors[ticket.status]}`}>
                          {ticket.status || ticket.state || '-'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : (ticket.created || '-')}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <button
                          onClick={async () => {
                            const id = ticket.id ?? ticket.pk ?? ticket.ticket_id;
                            setSelectedTicket(id);
                            setDetailVisible(true);
                            setDetailLoading(true);
                            setDetailError(null);
                            setTicketDetail(null);
                            try {
                              const res = await apiClient.get(`/api/tickets/${id}/`, { Accept: 'application/json' });
                              if (typeof res === 'string') throw new Error('Non-JSON response');
                              setTicketDetail(res);
                            } catch (err) {
                              console.warn('Failed to load ticket detail', err);
                              setDetailError('Failed to load ticket details');
                            } finally {
                              setDetailLoading(false);
                            }
                          }}
                          className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
              ) : (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No tickets available in {activeTab} status.
                </div>
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 gap-2 sm:gap-0 border-t" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
              <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">Showing {Math.min(filteredTickets.length, (page - 1) * pageSize + 1)} - {Math.min(filteredTickets.length, page * pageSize)} of {filteredTickets.length}</div>
              <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                >Prev</button>
                <div className="text-xs sm:text-sm">{page} / {totalPages}</div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`}
                >Next</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-2 sm:px-4 py-2 sm:py-4 border-t" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <button
            onClick={onClose}
            className={`px-3 sm:px-4 py-1 sm:py-2 rounded font-medium transition text-xs sm:text-sm ${
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
    {detailVisible && (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
        <div className={`relative w-full max-w-2xl mx-2 sm:mx-4 rounded-lg shadow-xl ${bgColor} border ${borderColor}`}>
          <div className="relative flex justify-between items-start p-2 sm:p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
            <h3 className={`text-sm sm:text-lg font-bold pr-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Ticket Details</h3>
            <button onClick={() => { setDetailVisible(false); setTicketDetail(null); setSelectedTicket(null); }} className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1 flex-shrink-0" aria-label="Close detail"><X size={20} /></button>
          </div>
          <div className="p-2 sm:p-4">
            {detailLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : detailError ? (
              <div className="text-center py-8 text-red-500">{detailError}</div>
            ) : ticketDetail ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className={`p-2 sm:p-3 rounded ${cellBg}`}><div className="font-semibold">ID</div><div className="mt-1">{ticketDetail.id ?? ticketDetail.pk}</div></div>
                <div className={`p-2 sm:p-3 rounded ${cellBg}`}><div className="font-semibold">Subject</div><div className="mt-1">{ticketDetail.subject || '-'}</div></div>
                <div className={`p-2 sm:p-3 rounded ${cellBg}`}><div className="font-semibold">Status</div><div className="mt-1"><span className={`px-2 py-1 rounded text-xs ${currentDetailStatusClass}`}>{ticketDetail.status || '-'}</span></div></div>
                <div className={`p-2 sm:p-3 rounded ${cellBg}`}><div className="font-semibold">Created</div><div className="mt-1">{ticketDetail.created_at ? new Date(ticketDetail.created_at).toLocaleString() : (ticketDetail.created || '-')}</div></div>
                <div className={`col-span-1 sm:col-span-2 p-2 sm:p-3 rounded ${cellBg}`}><div className="font-semibold">Description</div><div className="mt-1 whitespace-pre-wrap text-xs">{ticketDetail.description || '-'}</div></div>
              </div>
            ) : (
              <div className="text-center py-8">No details available.</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-2 sm:p-4 border-t" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto order-2 sm:order-1">
              {ticketDetail && activeTab === 'open' && (
                <button
                  onClick={() => handleChangeStatus('pending')}
                  disabled={detailLoading}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-black text-xs sm:text-sm font-medium"
                >
                  Pending
                </button>
              )}

              {ticketDetail && activeTab === 'pending' && (
                <button
                  onClick={() => handleChangeStatus('closed')}
                  disabled={detailLoading}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium"
                >
                  Close
                </button>
              )}

              {/* No status-change buttons for closed tab */}
            </div>

            <div className="w-full sm:w-auto order-1 sm:order-2">
              <button onClick={() => { setDetailVisible(false); setTicketDetail(null); setSelectedTicket(null); }} className={`w-full sm:w-auto px-3 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'}`}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TicketsModal;