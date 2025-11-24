import React, { useState } from "react";
import TableStructure from "../commonComponent/TableStructure";

const TabsPage = () => {
  const [activeTab, setActiveTab] = useState("Packages");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [toggledStatuses, setToggledStatuses] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    bonusFund: "",
    tradableFund: "",
    leverage: "",
    target: "",
    profitShare: "",
    maxCutoff: "",
    targetTime: "",
    status: true
  });

  // Dummy data for packages
  const packagesData = [
    {
      id: 1,
      name: "Platinum",
      price: "$10,000",
      bonusFund: "$90,000",
      tradableFund: "$100,000",
      leverage: "100:1",
      status: true,
      maxCutoff: "$20,000",
      target: "$20,000",
      targetTime: "30 days",
      profitShare: "70%",
      created: "Jan 1, 2025, 05:30 AM"
    },
    {
      id: 2,
      name: "Gold Plus",
      price: "$1,000",
      bonusFund: "$9,000",
      tradableFund: "$10,000",
      leverage: "100:1",
      status: true,
      maxCutoff: "$10,000",
      target: "$10,000",
      targetTime: "20 days",
      profitShare: "60%",
      created: "Jan 2, 2025, 06:00 AM"
    },
    {
      id: 3,
      name: "Gold Challenge",
      price: "$500",
      bonusFund: "$4,500",
      tradableFund: "$5,000",
      leverage: "100:1",
      status: true,
      maxCutoff: "$5,000",
      target: "$5,000",
      targetTime: "15 days",
      profitShare: "50%",
      created: "Jan 3, 2025, 07:00 AM"
    }
  ];

  const [packages, setPackages] = useState(packagesData);

  const propTradersData = [
    { id: 1, username: "John Doe", accountId: "JD123", package: "Platinum", email: "john@example.com", approvedBy: "Admin", approvedOn: "Jan 1, 2025", balance: "$5,000", profit: "$1,000", status: "Active" },
    { id: 2, username: "Jane Smith", accountId: "JS456", package: "Gold Plus", email: "jane@example.com", approvedBy: "Admin", approvedOn: "Jan 2, 2025", balance: "$2,000", profit: "$500", status: "Pending" },
    { id: 3, username: "Bob Johnson", accountId: "BJ789", package: "Gold Challenge", email: "bob@example.com", approvedBy: "Admin", approvedOn: "Jan 3, 2025", balance: "$1,000", profit: "$200", status: "Active" },
  ];

  const requestsData = [
    { id: 1, user: "Alice", email: "alice@example.com", package: "Platinum", status: "Approved", createdAt: "Jan 1, 2025, 05:30 AM" },
    { id: 2, user: "Bob", email: "bob@example.com", package: "Gold Plus", status: "Pending", createdAt: "Jan 2, 2025, 06:00 AM" },
    { id: 3, user: "Charlie", email: "charlie@example.com", package: "Gold Challenge", status: "Pending", createdAt: "Jan 3, 2025, 07:00 AM" },
  ];

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleStatus = (id) => {
    setToggledStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };



  // Removed all local filtering, pagination, and search input handlers since TableStructure does that internally now

  const handleViewRequest = (req) => {
    setSelectedRequest(req);
    setIsRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedRequest(null);
  };

  const handleCreatePackage = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      price: "",
      bonusFund: "",
      tradableFund: "",
      leverage: "",
      target: "",
      profitShare: "",
      maxCutoff: "",
      targetTime: "",
      status: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value === "true"
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPackage = {
      id: packages.length + 1,
      ...formData,
      created: new Date().toLocaleString()
    };
    setPackages(prev => [...prev, newPackage]);
    handleCloseModal();
  };

    // Define columns for each tab to pass to TableStructure
    const columnsPackages = [
      { Header: "Package Name", accessor: "name" },
      { Header: "Price", accessor: "price" },
      { Header: "Bonus Fund", accessor: "bonusFund" },
      { Header: "Tradable Fund", accessor: "tradableFund" },
      { Header: "Leverage", accessor: "leverage" },
      {
        Header: "Status",
        accessor: "status",
        Cell: (cellValue) => cellValue ? "Active" : "Inactive",
      },
      {
        Header: "Actions",
        accessor: "actions",
        Cell: (cellValue, row) => (
          <button
            onClick={() => toggleExpand(row.id)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            {expandedRows.has(row.id) ? "▼" : "▶"}
          </button>
        )
      }
    ];

  const columnsPropTraders = [
    { Header: "ID", accessor: "id" },
    { Header: "Username", accessor: "username" },
    { Header: "Account ID", accessor: "accountId" },
    { Header: "Package", accessor: "package" },
    { Header: "Email", accessor: "email" },
    { Header: "Approved By", accessor: "approvedBy" },
    { Header: "Approved On", accessor: "approvedOn" },
    { Header: "Balance", accessor: "balance" },
    { Header: "Profit", accessor: "profit" },
    { Header: "Status", accessor: "status" },
  ];

  const columnsRequests = [
    { Header: "User", accessor: "user" },
    { Header: "Email", accessor: "email" },
    { Header: "Package", accessor: "package" },
    { Header: "Status", accessor: "status" },
    { Header: "Created At", accessor: "createdAt" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (row) => (
        <button
          onClick={() => handleViewRequest(row)}
          className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
        >
          View
        </button>
      )
    }
  ];

  // Render TableStructure instead of manual tables and search inputs
  const renderTable = () => {
    switch(activeTab) {
      case "Packages":
        return (
          <>
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={handleCreatePackage}
                className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
              >
                + Create Package
              </button>
            </div>
            <TableStructure
              columns={columnsPackages}
              data={packages}
              actionsColumn={null}
              onRowClick={(row) => toggleExpand(row.id)}
              renderRowSubComponent={(row) => (
                expandedRows.has(row.id) ? (
                  <tr className="bg-yellow-400/10 border-b border-white/20">
                    <td colSpan={columnsPackages.length} className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-white">
                        <div>Maximum Cutoff: {row.maxCutoff}</div>
                        <div>Target: {row.target}</div>
                        <div>Target Time: {row.targetTime}</div>
                        <div>Profit Share: {row.profitShare}</div>
                        <div>Created: {row.created}</div>
                        <div className="col-span-2">
                          Status Toggle:
                          <button
                            onClick={() => toggleStatus(row.id)}
                            className={`ml-2 px-3 py-1 rounded ${
                              toggledStatuses.has(row.id)
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {toggledStatuses.has(row.id) ? "On" : "Off"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null
              )}
            />
          </>
        );
      case "Prop Traders":
        return (
          <TableStructure
            columns={columnsPropTraders}
            data={propTradersData}
          />
        );
      case "Requests":
        return (
          <>
          <TableStructure
            columns={columnsRequests}
            data={requestsData}
          />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4 sm:p-8">
      <div className={(isModalOpen || isRequestModalOpen) ? 'filter blur-sm' : ''}>

        {/* Buttons / Tabs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          {["Packages", "Prop Traders", "Requests"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full transition-all ${
                activeTab === tab
                  ? "bg-yellow-500 text-black shadow-lg"
                  : "bg-black border border-yellow-400 hover:bg-yellow-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">{renderTable()}</div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg p-6 w-full max-w-md shadow-[0_25px_50px_-12px_rgba(255,255,255,0.25)]">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Create New Package</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Package Name"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="bonusFund"
                value={formData.bonusFund}
                onChange={handleInputChange}
                placeholder="Bonus Fund"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="tradableFund"
                value={formData.tradableFund}
                onChange={handleInputChange}
                placeholder="Tradable Fund"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="leverage"
                value={formData.leverage}
                onChange={handleInputChange}
                placeholder="Leverage"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="target"
                value={formData.target}
                onChange={handleInputChange}
                placeholder="Target"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="profitShare"
                value={formData.profitShare}
                onChange={handleInputChange}
                placeholder="Profit Share"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="maxCutoff"
                value={formData.maxCutoff}
                onChange={handleInputChange}
                placeholder="Maximum Cutoff"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <input
                type="text"
                name="targetTime"
                value={formData.targetTime}
                onChange={handleInputChange}
                placeholder="Target Time"
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
                required
              />
              <select
                name="status"
                value={formData.status ? "true" : "false"}
                onChange={handleStatusChange}
                className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded hover:border-yellow-300 focus:border-yellow-300 placeholder-white"
              >
                <option value="" disabled>Select Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="col-span-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black rounded-lg p-6 w-full max-w-md shadow-[0_25px_50px_-12px_rgba(255,255,255,0.25)] relative">
            <button
              onClick={handleCloseRequestModal}
              className="absolute top-2 right-2 text-yellow-400 hover:text-yellow-300 text-xl"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Request Details</h3>
            <div className="text-white space-y-2">
              <p><strong>User:</strong> {selectedRequest.user}</p>
              <p><strong>Email:</strong> {selectedRequest.email}</p>
              <p><strong>Package:</strong> {selectedRequest.package}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <p><strong>Created At:</strong> {selectedRequest.createdAt}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  // Handle Approved
                  handleCloseRequestModal();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approved
              </button>
              <button
                onClick={() => {
                  // Handle Rejected
                  handleCloseRequestModal();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Rejected
              </button>
              <button
                onClick={handleCloseRequestModal}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabsPage;
