import React, { useState } from "react";
import { Search } from "lucide-react";

const TabsPage = () => {
  const [activeTab, setActiveTab] = useState("Packages");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [toggledStatuses, setToggledStatuses] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [propTradersSearchTerm, setPropTradersSearchTerm] = useState("");
  const [propTradersCurrentPage, setPropTradersCurrentPage] = useState(1);
  const [propTradersItemsPerPage, setPropTradersItemsPerPage] = useState(5);
  const [requestsSearchTerm, setRequestsSearchTerm] = useState("");
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [requestsItemsPerPage, setRequestsItemsPerPage] = useState(5);
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



  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);

  const filteredPropTraders = propTradersData.filter(trader =>
    trader.username.toLowerCase().includes(propTradersSearchTerm.toLowerCase()) ||
    trader.email.toLowerCase().includes(propTradersSearchTerm.toLowerCase())
  );

  const propTradersIndexOfLastItem = propTradersCurrentPage * propTradersItemsPerPage;
  const propTradersIndexOfFirstItem = propTradersIndexOfLastItem - propTradersItemsPerPage;
  const currentPropTradersItems = filteredPropTraders.slice(propTradersIndexOfFirstItem, propTradersIndexOfLastItem);
  const totalPropTradersPages = Math.ceil(filteredPropTraders.length / propTradersItemsPerPage);

  const filteredRequests = requestsData.filter(req =>
    req.user.toLowerCase().includes(requestsSearchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(requestsSearchTerm.toLowerCase())
  );

  const requestsIndexOfLastItem = requestsCurrentPage * requestsItemsPerPage;
  const requestsIndexOfFirstItem = requestsIndexOfLastItem - requestsItemsPerPage;
  const currentRequestsItems = filteredRequests.slice(requestsIndexOfFirstItem, requestsIndexOfLastItem);
  const totalRequestsPages = Math.ceil(filteredRequests.length / requestsItemsPerPage);



  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePropTradersPageChange = (pageNumber) => {
    setPropTradersCurrentPage(pageNumber);
  };

  const handlePropTradersItemsPerPageChange = (e) => {
    setPropTradersItemsPerPage(Number(e.target.value));
    setPropTradersCurrentPage(1);
  };

  const handleRequestsSearchChange = (e) => {
    setRequestsSearchTerm(e.target.value);
    setRequestsCurrentPage(1);
  };

  const handleRequestsPageChange = (pageNumber) => {
    setRequestsCurrentPage(pageNumber);
  };

  const handleRequestsItemsPerPageChange = (e) => {
    setRequestsItemsPerPage(Number(e.target.value));
    setRequestsCurrentPage(1);
  };

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

  const renderTable = () => {
    if (activeTab === "Packages") {
      return (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400" size={20} />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 bg-black border border-yellow-400 text-yellow-400 rounded"
              />
            </div>
            <button
              onClick={handleCreatePackage}
              className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
            >
              + Create Package
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-yellow-400">
                <th className="p-2 text-yellow-400 font-bold">Package Name</th>
                <th className="p-2 text-yellow-400 font-bold">Price</th>
                <th className="p-2 text-yellow-400 font-bold">Bonus Fund</th>
                <th className="p-2 text-yellow-400 font-bold">Tradable Fund</th>
                <th className="p-2 text-yellow-400 font-bold">Leverage</th>
                <th className="p-2 text-yellow-400 font-bold">Status</th>
                <th className="p-2 text-yellow-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((pkg) => (
                <React.Fragment key={pkg.id}>
                  <tr className="border-b border-white/20 hover:shadow-lg hover:bg-yellow-400/5 transition-all">
                    <td className="p-2 text-white">{pkg.name}</td>
                    <td className="p-2 text-white">{pkg.price}</td>
                    <td className="p-2 text-white">{pkg.bonusFund}</td>
                    <td className="p-2 text-white">{pkg.tradableFund}</td>
                    <td className="p-2 text-white">{pkg.leverage}</td>
                    <td className="p-2 text-white">{pkg.status ? 'Active' : 'Inactive'}</td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleExpand(pkg.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        {expandedRows.has(pkg.id) ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(pkg.id) && (
                    <tr className="bg-yellow-400/10 border-b border-white/20">
                      <td colSpan="7" className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm text-white">
                          <div>Maximum Cutoff: {pkg.maxCutoff}</div>
                          <div>Target: {pkg.target}</div>
                          <div>Target Time: {pkg.targetTime}</div>
                          <div>Profit Share: {pkg.profitShare}</div>
                          <div>Created: {pkg.created}</div>
                          <div className="col-span-2">
                            Status Toggle:
                            <button
                              onClick={() => toggleStatus(pkg.id)}
                              className={`ml-2 px-3 py-1 rounded ${toggledStatuses.has(pkg.id) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                            >
                              {toggledStatuses.has(pkg.id) ? 'On' : 'Off'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-yellow-400">Items per page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="bg-black border border-yellow-400 text-yellow-400 rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="text-yellow-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === "Prop Traders") {
      return (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400" size={20} />
              <input
                type="text"
                placeholder="Search prop traders..."
                value={propTradersSearchTerm}
                onChange={(e) => setPropTradersSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-black border border-yellow-400 text-yellow-400 rounded"
              />
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-yellow-400">
                <th className="p-2 text-yellow-400 font-bold">ID</th>
                <th className="p-2 text-yellow-400 font-bold">Username</th>
                <th className="p-2 text-yellow-400 font-bold">Account ID</th>
                <th className="p-2 text-yellow-400 font-bold">Package</th>
                <th className="p-2 text-yellow-400 font-bold">Email</th>
                <th className="p-2 text-yellow-400 font-bold">Approved By</th>
                <th className="p-2 text-yellow-400 font-bold">Approved On</th>
                <th className="p-2 text-yellow-400 font-bold">Balance</th>
                <th className="p-2 text-yellow-400 font-bold">Profit</th>
                <th className="p-2 text-yellow-400 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPropTradersItems.map((trader) => (
                <tr key={trader.id} className="border-b border-white/20 hover:shadow-lg hover:bg-yellow-400/5 transition-all">
                  <td className="p-2 text-white">{trader.id}</td>
                  <td className="p-2 text-white">{trader.username}</td>
                  <td className="p-2 text-white">{trader.accountId}</td>
                  <td className="p-2 text-white">{trader.package}</td>
                  <td className="p-2 text-white">{trader.email}</td>
                  <td className="p-2 text-white">{trader.approvedBy}</td>
                  <td className="p-2 text-white">{trader.approvedOn}</td>
                  <td className="p-2 text-white">{trader.balance}</td>
                  <td className="p-2 text-white">{trader.profit}</td>
                  <td className="p-2 text-white">{trader.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="propTradersItemsPerPage" className="text-yellow-400">Items per page:</label>
              <select
                id="propTradersItemsPerPage"
                value={propTradersItemsPerPage}
                onChange={handlePropTradersItemsPerPageChange}
                className="bg-black border border-yellow-400 text-yellow-400 rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePropTradersPageChange(propTradersCurrentPage - 1)}
                disabled={propTradersCurrentPage === 1}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="text-yellow-400">
                Page {propTradersCurrentPage} of {totalPropTradersPages}
              </span>
              <button
                onClick={() => handlePropTradersPageChange(propTradersCurrentPage + 1)}
                disabled={propTradersCurrentPage === totalPropTradersPages}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === "Requests") {
      return (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400" size={20} />
              <input
                type="text"
                placeholder="Search requests..."
                value={requestsSearchTerm}
                onChange={handleRequestsSearchChange}
                className="pl-10 pr-4 py-2 bg-black border border-yellow-400 text-yellow-400 rounded"
              />
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-yellow-400">
                <th className="p-2 text-yellow-400 font-bold">User</th>
                <th className="p-2 text-yellow-400 font-bold">Email</th>
                <th className="p-2 text-yellow-400 font-bold">Package</th>
                <th className="p-2 text-yellow-400 font-bold">Status</th>
                <th className="p-2 text-yellow-400 font-bold">Created At</th>
                <th className="p-2 text-yellow-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRequestsItems.map((req) => (
                <tr key={req.id} className="border-b border-white/20 hover:shadow-lg hover:bg-yellow-400/5 transition-all">
                  <td className="p-2 text-white">{req.user}</td>
                  <td className="p-2 text-white">{req.email}</td>
                  <td className="p-2 text-white">{req.package}</td>
                  <td className="p-2 text-white">{req.status}</td>
                  <td className="p-2 text-white">{req.createdAt}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleViewRequest(req)}
                      className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <label htmlFor="requestsItemsPerPage" className="text-yellow-400">Items per page:</label>
              <select
                id="requestsItemsPerPage"
                value={requestsItemsPerPage}
                onChange={handleRequestsItemsPerPageChange}
                className="bg-black border border-yellow-400 text-yellow-400 rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleRequestsPageChange(requestsCurrentPage - 1)}
                disabled={requestsCurrentPage === 1}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="text-yellow-400">
                Page {requestsCurrentPage} of {totalRequestsPages}
              </span>
              <button
                onClick={() => handleRequestsPageChange(requestsCurrentPage + 1)}
                disabled={requestsCurrentPage === totalRequestsPages}
                className="px-3 py-1 bg-yellow-500 text-black rounded disabled:bg-gray-600 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
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
