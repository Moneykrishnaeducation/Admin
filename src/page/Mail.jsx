// src/components/Form.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// Helper to get a cookie value
function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
  } catch {}
  return null;
}

// Check if user is superuser
function isSuperuser() {
  try {
    const userCookie = getCookie('user');
    if (userCookie) {
      const user = JSON.parse(userCookie);
      return user?.is_superuser === true || user?.is_superuser === 'true';
    }
  } catch {}
  return false;
}

const MailForm = () => {
  let {isDarkMode} = useTheme();
  const navigate = useNavigate();
  const [superuserCheckDone, setSuperuserCheckDone] = useState(false);
  const [isSuperuserUser, setIsSuperuserUser] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeUsersCount, setActiveUsersCount] = useState(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Check superuser status on component mount
  useEffect(() => {
    const superuser = isSuperuser();
    setIsSuperuserUser(superuser);
    setSuperuserCheckDone(true);
  }, []);

  const handleChange = (_e) => {
    setFormData({ ...formData, [_e.target.name]: _e.target.value });
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
        const headers = { 'Content-Type': 'application/json' };
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
    setBroadcastLoading(true);
    try {
      // First, fetch active user count to provide feedback
      let count = null;
      try {
        count = await getActiveUsersCount();
        setActiveUsersCount(count);
      } catch (e) {
        // ignore
      }

      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let res;
      const payload = { subject: formData.subject, message: formData.message };
      if (client && typeof client.post === 'function') {
        res = await client.post('/send-broadcast-email/', payload);
      } else {
        const headers = { 'Content-Type': 'application/json' };
        const response = await fetch('/api/send-broadcast-email/', { method: 'POST', headers, credentials: 'include', body: JSON.stringify(payload) });
        res = await response.json();
        if (!response.ok) throw new Error(res.error || JSON.stringify(res));
      }

      const msg = res.message || 'Broadcast sent successfully';
      showToast(count ? `${msg} Sent to ${count} active users.` : msg, 'success');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Internal helper: return active users count (throws on error)
  const getActiveUsersCount = async () => {
    const client = window && window.adminApiClient ? window.adminApiClient : null;
    let res;
    if (client && typeof client.get === 'function') {
      res = await client.get('/get-active-users-emails/');
    } else {
      const headers = { 'Content-Type': 'application/json' };
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
    <>
      {/* If superuser check is done but user is not a superuser, show access denied */}
      {superuserCheckDone && !isSuperuserUser && (
        <div className={`font-sans ${isDarkMode ? 'text-gray-200' : 'bg-white text-black'} p-6 max-w-[1200px] mx-auto rounded-lg min-h-screen flex items-center justify-center`}>
          <div className={`text-center p-8 rounded-lg border-2 ${isDarkMode ? 'border-red-500 bg-red-900/20' : 'border-red-400 bg-red-100'}`}>
            <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              Access Denied
            </h1>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Only superusers can access the Mailbox.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Only render the form if superuser check is done and user is a superuser */}
      {superuserCheckDone && isSuperuserUser && (
        <div className=" p-6 sm:p-8 rounded-2xl shadow-[0px_0px_10px_rgba(255,255,255,0.2),0px_0px_15px_rgba(255,255,0,0.15)] max-w-5xl w-full sm:max-w-3xl mx-auto mt-8 hover:shadow-[0px_0px_15px_rgba(255,255,255,0.35),0px_0px_20px_rgba(255,215,0,0.25)] transition-shadow duration-300">
          <h2 className={`text-2xl sm:text-3xl font-bold  mb-6 text-center ${
              isDarkMode && "text-yellow-300"
            }`}>Send Email</h2>

          {error && <div className="mb-3 text-red-400">{error}</div>}

          <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${
              isDarkMode ? " text-yellow-300" : "bg-white text-black"
            }`}>
            <div className="flex flex-col gap-1">
              <label className=" font-medium text-sm sm:text-base">Recipient Email:</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address separated by commas"
                className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 
                 focus:outline-none focus:border-yellow-500 
                 text-sm sm:text-base 
                 placeholder-gray-400"/>
              <small className="text-gray-600">Leave empty and use 'Send to All Users' to broadcast to all active users.</small>
            </div>

            <div className="flex flex-col gap-1">
              <label className=" font-medium text-sm sm:text-base">Subject:</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 
                 focus:outline-none focus:border-yellow-500 
                 text-sm sm:text-base 
                 placeholder-gray-400"
                 required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className=" font-medium text-sm sm:text-base">Message:</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message"
                rows="6"
                className="p-3 sm:p-4 rounded-lg border border-yellow-400/30 
                 focus:outline-none focus:border-yellow-500 
                 text-sm sm:text-base 
                 placeholder-gray-400"
                 required
              />
            </div>

             <div className="flex flex-col sm:flex-row justify-between gap-3">

        {/* Send Email */}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-yellow-500 py-3 rounded-md
                     hover:bg-yellow-300 transition-all
                     text-gray-700 text-sm sm:text-base
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Email"}
        </button>

        {/* Send to All Users */}
        <button
          type="button"
          onClick={sendBroadcast}
          disabled={broadcastLoading}
          className="flex-1 bg-yellow-500 py-3 rounded-md
                     hover:bg-yellow-300 transition-all
                     text-gray-700 text-sm sm:text-base
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {broadcastLoading
            ? "Sending..."
            : `Send to All Users (${activeUsersCount ?? "--"})`}
        </button>

      </div>

        </form>

        {/* Toast notification */}
        {toast && (
          <div className="fixed right-6 top-6 z-50">
            <div className={`px-4 py-2 rounded-lg  shadow-lg ${toast.variant === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
      )}
    </>
  );
};

export default MailForm;
