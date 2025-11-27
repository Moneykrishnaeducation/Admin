import React, { useState, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminManagerList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

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
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("jwt_token") ||
              localStorage.getItem("access_token")
            : null;

        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        email: user.email || "-",
        role: user.role || "-",
        elevated: user.elevated_date || "-",
      }));

      setList(mapped);
    } catch (err) {
      console.error("Failed to load admins:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

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
  const handleAdd = () => {
    const newEntry = {
      id: list.length + 1,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      role: form.role,
      elevated: new Date().toLocaleString(),
    };
    setList([...list, newEntry]);
    setShowCreateModal(false);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      role: "Admin",
    });
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
        Admin Management Panel
      </h1>

      <marquee className="px-6 py-2 text-yellow-400" direction="left">
        Click the "Create" button to add an Admin or Manager
      </marquee>

      {/* Buttons */}
      <div className="flex justify-end mb-4 gap-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-yellow-500 text-black rounded-md"
        >
          Create
        </button>

        <button
          onClick={() => navigate("/trading-group")}
          className="px-6 py-2 bg-yellow-500 text-black rounded-md"
        >
          Trading Group
        </button>
      </div>

      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Admin/Manager List
      </h1>

      {/* Loading/Error */}
      {loading && <p className="text-center text-yellow-400 text-lg mb-4">Loading...</p>}
      {error && <p className="text-center text-red-500 text-lg mb-4">{error}</p>}

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or role"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // Reset to first page on search
        }}
        className="w-full p-3 mb-5 mt-4 rounded-md bg-[#111] text-white border border-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1b1b1b] text-gray-300">
            <tr>
              <th className="p-3 border-b border-gray-700 text-yellow-400">#</th>
              <th className="p-3 border-b border-gray-700 text-yellow-400">Name</th>
              <th className="p-3 border-b border-gray-700 text-yellow-400">Email</th>
              <th className="p-3 border-b border-gray-700 text-yellow-400">Role</th>
              <th className="p-3 border-b border-gray-700 text-yellow-400">Elevated Date</th>
              <th className="p-3 border-b border-gray-700 text-yellow-400">Action</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-[#222] transition border-b border-gray-800"
              >
                <td className="p-3">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-gray-300">{item.email}</td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-md text-sm ${
                      item.role === "Admin" ? "bg-blue-600" : "bg-green-600"
                    }`}
                  >
                    {item.role}
                  </span>
                </td>
                <td className="p-3">{item.elevated}</td>
                <td className="p-3 flex gap-2">
                  <button className="p-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 rounded-md bg-red-600 hover:bg-red-700 text-white">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center mt-4 gap-2">
        <button
          className="px-4 py-2 bg-[#111] text-white border border-gray-700 rounded-md hover:bg-[#222]"
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
                : "bg-[#111] text-white border border-gray-700 hover:bg-[#222]"
            }`}
            onClick={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="px-4 py-2 bg-[#111] text-white border border-gray-700 rounded-md hover:bg-[#222]"
          onClick={() => goToPage(currentPage + 1)}
        >
          »
        </button>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] p-8 rounded-xl w-[30%] border border-yellow-500 shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-white"
              onClick={() => setShowCreateModal(false)}
            >
              <X size={26} />
            </button>

            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
              Add Admin/Manager
            </h2>

            <div className="flex flex-col gap-4">
              <input
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />

              <input
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />

              <input
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <input
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <textarea
                rows="2"
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <select
                className="bg-[#000] p-3 rounded-md border border-gray-700 outline-none"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option>Admin</option>
                <option>Manager</option>
              </select>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-yellow-500 text-black rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerList;
