import React, { useState, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import ChangeStatusModal from "../Modals/ChangeStatusModal";
import ConfirmModal from "../Modals/ConfirmModal";
import MessageModal from "../Modals/MessageModal";

// Helper to get a cookie value
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
  } catch {
    //console.error('Error parsing cookie:', e);
  }
  return '';
}

// Helper to check if user is superuser
function isSuperuser() {
  try {
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        const userFromCookie = JSON.parse(userCookie);
        return userFromCookie?.is_superuser === true || userFromCookie?.is_superuser === 'true';
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
  return false;
}

const AdminManagerList = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [isSuperuserUser, setIsSuperuserUser] = useState(false);
  const [superuserCheckDone, setSuperuserCheckDone] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');

  const showMessage = (title, text) => {
    setMessageTitle(title || 'Message');
    setMessageText(text || '');
    setMessageOpen(true);
  };

  // Check superuser status on component mount
  useEffect(() => {
    const superuser = isSuperuser();
    setIsSuperuserUser(superuser);
    setSuperuserCheckDone(true);
    
    // Always fetch admins for all admins
    fetchAdmins();
  }, []);

  const rowsPerPage = 10; // 10 rows per page

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "Admin",
  });

  // Fetch Admins
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = "/api/admins-managers/";

      const client =
        typeof window !== "undefined" && window.adminApiClient
          ? window.adminApiClient
          : null;

      let resJson;

      if (client && typeof client.get === "function") {
        resJson = await client.get(endpoint);
      } else {
        // Tokens are now in HttpOnly cookies - no need to manually add Authorization header
        const headers = {
          "Content-Type": "application/json",
        };

        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Please log in again.");
            return;
          }
          setError(`Failed to fetch admins: ${res.status}`);
          return;
        }

        resJson = await res.json();
      }

      const items = Array.isArray(resJson.admins)
        ? resJson.admins
        : Array.isArray(resJson.data)
        ? resJson.data
        : resJson.results || [];

      const mapped = items.map((user) => ({
        id: user.id,
        userId: user.userId ?? user.id ?? user.pk,
        raw: user,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        email: user.email || "-",
        role: user.role || "-",
        elevated: user.elevated_date || "-",
      }));

      setList(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered list based on search input
  const filtered = list.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  // Slice current rows
  const currentRows = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  // TEMPORARY Create New (Until POST API is connected)
  const handleAdd = async () => {
    // Basic validation
    if (!form.email || !form.firstName || !form.lastName) {
      showMessage('Validation', 'Please provide first name, last name and email');
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: (form.role || 'Admin').toLowerCase(),
        manager_admin_status: (form.role || 'Admin'),
        phone_number: form.phone || '',
        address: form.address || '',
      };

      const res = await fetch('/api/create-admin-manager/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || body?.error || `Failed with status ${res.status}`);
      }

      // Backend returns user_id and temp_password
      const newId = body?.user_id || body?.id || Date.now();
      const newEntry = {
        id: newId,
        userId: newId,
        raw: null,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        role: form.role,
        manager_admin_status: form.role,
        elevated: new Date().toLocaleString(),
      };

      setList((prev) => [...prev, newEntry]);
      setShowCreateModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', address: '', role: 'Admin', manager_admin_status: 'admin' });

      if (body?.temp_password) {
        showMessage('Created', `Created user. Temporary password: ${body.temp_password}`);
      } else {
        showMessage('Created', body?.message || 'Admin/manager created');
      }
    } catch (err) {
      showMessage('Error creating admin', err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenStatusModal = (user) => {
    setSelectedUserRow(user);
    setStatusModalOpen(true);
  };

  const handleDeleteUser = (item) => {
    setPendingDeleteItem(item);
    setConfirmDeleteOpen(true);
  };

  const performDeleteConfirmed = async () => {
    const item = pendingDeleteItem;
    setConfirmDeleteOpen(false);
    setPendingDeleteItem(null);
    if (!item) return;

    const userId = item.userId ?? item.id ?? item.raw?.id ?? item.raw?.pk;
    if (!userId) {
      showMessage('Error', 'User ID missing');
      return;
    }

    try {
      const res = await fetch(`/api/user/${userId}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Failed with status ${res.status}`);
      }

      // Remove from list
      setList((prev) => prev.filter((u) => u.id !== item.id));
    } catch (err) {
      showMessage('Error deleting user', err.message);
    }
  };

  const handleStatusUpdate = (updated) => {
    const id = updated?.id ?? updated?.userId ?? selectedUserRow?.id;
    const newRole = updated?.new_role || updated?.role;
    if (!id) return;
    setList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole || u.role } : u))
    );
  };

  return (
    <div className={`font-sans ${isDarkMode ? 'text-gray-200' : 'bg-white text-black'} p-6 max-w-[1200px] mx-auto rounded-lg`}>
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Admin Management Panel
      </h1>

      <marquee className={`px-6 py-2 font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-black-300'}`} direction="left">
        Click the "Create" button to add an Admin or Manager
      </marquee>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-6 mb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
        >
          Create
        </button>

        <button
          onClick={() => navigate("/trading-group")}
          className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
        >
          Trading Group
        </button>
      </div>


      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Admin/Manager List
      </h1>

      {/* Loading/Error */}
      {error && <p className={`text-center text-lg mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</p>}

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or role"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // Reset to first page on search
        }}
        className={`w-full p-3 mb-5 mt-4 rounded-md ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-black border-gray-300'} border focus:ring-2 focus:ring-yellow-400 outline-none`}
      />

      {/* Table */}
      <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
        <table className="w-full text-left border-collapse">
          <thead className={`${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
            <tr>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>#</th>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>Name</th>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>Email</th>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>Role</th>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>Elevated Date</th>
              <th className={`p-3 border-b ${isDarkMode ? 'border-gray-700 text-yellow-400' : 'border-gray-300 text-yellow-600'}`}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: Math.min(3, rowsPerPage) }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} skeleton-gold h-4 rounded w-6`} />
                  </td>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} skeleton-gold h-4 rounded w-48`} />
                  </td>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} skeleton-gold h-4 rounded w-56`} />
                  </td>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} skeleton-gold h-4 rounded w-28`} />
                  </td>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} skeleton-gold h-4 rounded w-36`} />
                  </td>
                  <td className="p-3">
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} skeleton-gold h-8 rounded w-20 ml-auto`} />
                  </td>
                </tr>
              ))
            ) : (
              currentRows.map((item, index) => (
                <tr
                  key={item.id}
                  className={`transition border-b ${isDarkMode ? 'hover:bg-gray-700 border-gray-800' : 'hover:bg-gray-100 border-gray-300'}`}
                >
                  <td className="p-3">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="p-3">{item.name}</td>
                  <td className={`p-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 text-sm font-bold ${
                        item.role === "Admin"
                          ? isDarkMode
                            ? "text-blue-400"
                            : "text-blue-600"
                          : isDarkMode
                          ? "text-green-400"
                          : "text-green-600"
                      }`}
                    >
                      {item.role}
                    </span>
                  </td>
                  <td className="p-3">{item.elevated}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => handleOpenStatusModal(item)} className="p-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-black">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(item)} className={`p-2 rounded-md bg-red-600 hover:bg-red-700 ${isDarkMode ? 'text-white' : 'text-white'}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          className={`px-4 py-2 rounded-md border ${isDarkMode ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-700' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
          onClick={() => goToPage(currentPage - 1)}
        >
          «
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`px-4 py-2 rounded-md ${
              currentPage === i + 1
                ? "bg-yellow-500 text-black"
                : `${isDarkMode ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-700' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`
            }`}
            onClick={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          className={`px-4 py-2 rounded-md border ${isDarkMode ? 'bg-gray-900 text-white border-gray-700 hover:bg-gray-700' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
          onClick={() => goToPage(currentPage + 1)}
        >
          »
        </button>
      </div>

      {/* CREATE MODAL */}
{showCreateModal && (
  <div className="fixed inset-0 flex items-center justify-center px-3 z-50">
    <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-lg transition-all duration-300 z-40" onClick={() => setShowCreateModal(false)} />
    <div
      className={`relative w-[90%] sm:w-full max-w-md rounded-xl
      shadow-[0_0_25px_rgba(234,179,8,0.25)]
      hover:shadow-[0_0_40px_rgba(234,179,8,0.45)]
      transition-shadow duration-300
      ${isDarkMode ? "bg-gray-900" : "bg-white"}
      px-4 py-6 sm:p-8 z-50`}
    >


      {/* Close Button */}
      <button
        className={`absolute top-3 right-3 ${
          isDarkMode ? "text-white" : "text-black"
        }`}
        onClick={() => setShowCreateModal(false)}
      >
        <X size={24} />
      </button>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6 text-center">
        Add Admin/Manager
      </h2>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <input
          className={`w-full p-3 rounded-md border outline-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />

        <input
          className={`w-full p-3 rounded-md border outline-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />

        <input
          className={`w-full p-3 rounded-md border outline-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          className={`w-full p-3 rounded-md border outline-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <textarea
          rows={3}
          className={`w-full p-3 rounded-md border outline-none resize-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <select
          className={`w-full p-3 rounded-md border outline-none
          ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"}`}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
        </select>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={handleAdd}
          disabled={createLoading}
          className={`w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-md transition disabled:opacity-60`}
        >
          {createLoading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  </div>
)}

      {statusModalOpen && (
        <ChangeStatusModal
          isOpen={statusModalOpen}
          userRow={selectedUserRow}
          currentStatus={selectedUserRow?.role}
          onClose={() => { setStatusModalOpen(false); setSelectedUserRow(null); }}
          onUpdate={handleStatusUpdate}
        />
      )}

      <ConfirmModal
        visible={confirmDeleteOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${pendingDeleteItem?.name || pendingDeleteItem?.email || ''}? This action cannot be undone.`}
        onCancel={() => { setConfirmDeleteOpen(false); setPendingDeleteItem(null); }}
        onConfirm={performDeleteConfirmed}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <MessageModal
        visible={messageOpen}
        title={messageTitle}
        message={messageText}
        onClose={() => setMessageOpen(false)}
        okLabel="OK"
      />

    </div>
  );
};

export default AdminManagerList;
