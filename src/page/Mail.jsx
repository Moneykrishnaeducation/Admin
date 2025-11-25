// src/components/Form.jsx
import React, { useState, useEffect } from "react";

const MailForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeUsersCount, setActiveUsersCount] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendSingleEmail = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let res;
      if (client && typeof client.post === 'function') {
        res = await client.post('/send-single-email/', payload);
      } else {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const response = await fetch('/api/send-single-email/', { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
        res = await response.json();
        if (!response.ok) throw new Error(res.error || JSON.stringify(res));
      }

      const message = res.message || 'Email sent successfully';
      showToast(message, 'success');
      setFormData({ email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.subject || !formData.message || !formData.email) {
      setError('Recipient, subject and message are required for single send');
      return;
    }
    // support comma separated emails
    const recipients = formData.email.split(',').map(s => s.trim()).filter(Boolean);
    await sendSingleEmail({ to: recipients, subject: formData.subject, message: formData.message, is_html: false });
  };

  const sendBroadcast = async () => {
    setError(null);
    if (!formData.subject || !formData.message) {
      setError('Subject and message are required for broadcast');
      return;
    }
    setLoading(true);
    try {
      // First, fetch active user count to provide feedback
      let count = null;
      try {
        count = await getActiveUsersCount();
        setActiveUsersCount(count);
      } catch (e) {
        console.warn('Could not get active users count before broadcast', e);
      }

      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let res;
      const payload = { subject: formData.subject, message: formData.message };
      if (client && typeof client.post === 'function') {
        res = await client.post('/send-broadcast-email/', payload);
      } else {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const response = await fetch('/api/send-broadcast-email/', { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
        res = await response.json();
        if (!response.ok) throw new Error(res.error || JSON.stringify(res));
      }

      const msg = res.message || 'Broadcast sent successfully';
      showToast(count ? `${msg} Sent to ${count} active users.` : msg, 'success');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Internal helper: return active users count (throws on error)
  const getActiveUsersCount = async () => {
    const client = window && window.adminApiClient ? window.adminApiClient : null;
    let res;
    if (client && typeof client.get === 'function') {
      res = await client.get('/get-active-users-emails/');
    } else {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const response = await fetch('/api/get-active-users-emails/', { method: 'GET', headers, credentials: 'include' });
      res = await response.json();
      if (!response.ok) throw new Error(res.error || JSON.stringify(res));
    }
    return res.total_count ?? (res.emails ? res.emails.length : null);
  };

  // Simple toast helper (auto-dismisses)
  function showToast(message, variant = 'success', duration = 4000) {
    setToast({ message, variant });
    try {
      setTimeout(() => setToast(null), duration);
    } catch (e) {
      // ignore
    }
  }

  // Load active user count on mount so the button can display it
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const count = await getActiveUsersCount();
        if (mounted) setActiveUsersCount(count);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-black p-6 sm:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,255,0,0.15)] max-w-full sm:max-w-3xl mx-auto mt-8 hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-6 text-center">Send Email</h2>

      {error && <div className="mb-3 text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Recipient Email:</label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address separated by commas"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
          />
          <small className="text-yellow-400">Leave empty and use 'Send to All Users' to broadcast to all active users.</small>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Subject:</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter subject"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-yellow-400 font-medium text-sm sm:text-base">Message:</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message"
            rows="6"
            className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 bg-black text-yellow-400 focus:outline-none focus:border-yellow-500 text-sm sm:text-base"
            required
          />
        </div>

        {/* Active users count will be retrieved automatically when broadcasting */}

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-yellow-500 text-black py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base">
            {loading ? 'Sending...' : 'Send Email'}
          </button>

          <button type="button" onClick={sendBroadcast} disabled={loading} className="flex-1 bg-yellow-500 text-black py-3 rounded-full hover:bg-yellow-600 transition-all text-sm sm:text-base">
            {loading ? 'Sending...' : `Send to All Users (${activeUsersCount ?? '--'})`}
          </button>
        </div>
      </form>

      {/* Toast notification */}
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <div className={`px-4 py-2 rounded-lg text-white shadow-lg ${toast.variant === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default MailForm;
