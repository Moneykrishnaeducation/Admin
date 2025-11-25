import React, { useState, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";

const AdminManagerList = () => {
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Dummy Data
  const data = [
    {
      id: 1,
      name: "Janaki M",
      email: "moneyars001@gmail.com",
      role: "Manager",
      elevated: "1/2/2025, 5:48:59 AM",
    },
    {
      id: 2,
      name: "Ceo VTindex",
      email: "ceo@hi5trader.com",
      role: "Admin",
      elevated: "9/19/2025, 3:55:03 PM",
    },
    {
      id: 3,
      name: "Premkumar Gopalan",
      email: "tlfpremkumarcbe@gmail.com",
      role: "Manager",
      elevated: "11/24/2022, 1:16:59 PM",
    },
  ];

  useEffect(() => {
    setList(data);
  }, []);

  const filtered = list.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Admin/Manager List
      </h1>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="px-4 py-2 bg-yellow-500 text-black rounded-md"
      >
        Create
      </button>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, email, or role"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 mb-5 mt-4 rounded-md bg-[#111] text-white border border-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1b1b1b] text-gray-300">
            <tr>
              <th className="p-3 border-b border-gray-700">#</th>
              <th className="p-3 border-b border-gray-700">Name</th>
              <th className="p-3 border-b border-gray-700">Email</th>
              <th className="p-3 border-b border-gray-700">Role</th>
              <th className="p-3 border-b border-gray-700">Elevated Date</th>
              <th className="p-3 border-b border-gray-700">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-[#222] transition border-b border-gray-800"
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-gray-300">{item.email}</td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-md text-sm ${
                      item.role === "Admin"
                        ? "bg-blue-600"
                        : "bg-green-600"
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

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button className="px-4 py-2 bg-[#111] text-white border border-gray-700 rounded-md hover:bg-[#222]">
          «
        </button>
        <button className="px-4 py-2 bg-yellow-500 text-black rounded-md">
          1
        </button>
        <button className="px-4 py-2 bg-[#111] text-white border border-gray-700 rounded-md hover:bg-[#222]">
          2
        </button>
        <button className="px-4 py-2 bg-[#111] text-white border border-gray-700 rounded-md hover:bg-[#222]">
          »
        </button>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            className="bg-[#111] p-8 rounded-xl w-[60%] border border-yellow-500 shadow-xl relative"
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-white"
              onClick={() => setShowCreateModal(false)}
            >
              <X size={26} />
            </button>

            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
              Add Admin/Manager
            </h2>

            {/* Form */}
            <div className="grid grid-cols-2 gap-4">

              <input className="bg-[#000] p-3 rounded-md border border-gray-700" placeholder="First Name" />
              <input className="bg-[#000] p-3 rounded-md border border-gray-700" placeholder="Last Name" />

              <input className="bg-[#000] p-3 rounded-md border border-gray-700" placeholder="Email" />
              <input className="bg-[#000] p-3 rounded-md border border-gray-700" placeholder="Phone Number" />

              <textarea
                rows="2"
                className="col-span-2 bg-[#000] p-3 rounded-md border border-gray-700"
                placeholder="Address"
              ></textarea>

              <select className="col-span-2 bg-[#000] p-3 rounded-md border border-gray-700">
                <option>Admin</option>
                <option>Manager</option>
              </select>
            </div>

            <button className="mt-6 px-4 py-2 bg-yellow-500 text-black rounded-md">
              Update Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerList;
