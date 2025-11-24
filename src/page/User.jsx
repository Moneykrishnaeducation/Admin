import React, { useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { Search } from "lucide-react";

const User = () => {
  // Define columns for the table
  const columns = useMemo(
    () => [
      { Header: "Id", accessor: "id" },
      { Header: "name", accessor: "name" },
      { Header: "email", accessor: "email" },
      { Header: "phone", accessor: "phone" },
      { Header: "Registered date", accessor: "registeredDate" },
      { Header: "country", accessor: "country" },
    ],
    []
  );

  // Sample data, can be updated later or fetched via API
  const initialData = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      registeredDate: "2023-01-01",
      country: "USA",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "098-765-4321",
      registeredDate: "2023-02-15",
      country: "Canada",
    },
  ];

  const [search, setSearch] = useState("");
  const [data] = useState(initialData);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    country: "Afghanistan",
    address: "",
    password: "",
    confirmPassword: "",
  });

  // Filter data based on search input (search in name, email, phone, country)
  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.email.toLowerCase().includes(lowerSearch) ||
        item.phone.toLowerCase().includes(lowerSearch) ||
        item.country.toLowerCase().includes(lowerSearch) ||
        item.id.toString().includes(lowerSearch) ||
        item.registeredDate.toLowerCase().includes(lowerSearch)
    );
  }, [search, data]);

  // Handlers for modal form
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form data
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      country: "Afghanistan",
      address: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Optionally add validation here
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    // For now, just close modal on submit
    closeModal();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        {/* Search input - left side */}
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full rounded border border-yellow-400 bg-black text-yellow-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Add user button - right side */}
        <button
          onClick={openModal}
          className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-300 transition"
        >
          Add user
        </button>
      </div>

      {/* Render the table */}
      <TableStructure columns={columns} data={filteredData} />

      {/* Modal for adding new user */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">

          <div className="bg-black rounded-lg p-6 w-full max-w-md shadow-2xl shadow-yellow-400/20 text-yellow-400">

            <h3 className="text-xl font-bold mb-4">Add New User</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label htmlFor="fullName" className="block mb-1">Full Name:</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-1">Email Address:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block mb-1">Phone Number:</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+1234567890"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block mb-1">Date Of Birth:</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  placeholder="dd-mm-yyyy"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="country" className="block mb-1">Country:</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                    required
                  >
                    <option>Afghanistan</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
                <div className="w-1/2">
                  <label htmlFor="address" className="block mb-1">Address:</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Street address (optional)"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="password" className="block mb-1">Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="confirmPassword" className="block mb-1">Confirm Password:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-yellow-400 bg-black text-yellow-400"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
