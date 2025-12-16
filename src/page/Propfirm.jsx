import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { useLocation, useNavigate } from "react-router-dom";

const PropFirm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize activeTab based on URL parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["packages", "prop traders", "requests"].includes(tab.toLowerCase())) {
      return tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
    }
    return "Packages";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [toggledStatuses, setToggledStatuses] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    bonus: "",
    tradable: "",
    leverage: "",
    target: "",
    share: "",
    cutoff: "",
    time: "",
    status: true
  });



  const [packages, setPackages] = useState([]);
  const [propTraders, setPropTraders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data based on activeTab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;

        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        let type = '';
        if (activeTab === 'Packages') type = 'packages';
        else if (activeTab === 'Prop Traders') type = 'traders';
        else if (activeTab === 'Requests') type = 'requests';

        const response = await fetch(`/api/admin/prop-packages/?type=${type}`, {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
            return;
          }
          throw new Error(`Failed to fetch ${activeTab.toLowerCase()}`);
        }
        const data = await response.json();
        const items = Array.isArray(data.packages)
          ? data.packages
          : Array.isArray(data.data)
          ? data.data
          : data.results || [];

        if (activeTab === 'Packages') setPackages(items);
        else if (activeTab === 'Prop Traders') setPropTraders(items);
        else if (activeTab === 'Requests') setRequests(items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["packages", "prop traders", "requests"].includes(tab.toLowerCase())) {
      const formattedTab = tab.charAt(0).toUpperCase() + tab.slice(1).toLowerCase();
      setActiveTab(formattedTab);
    }
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabParam = tab.toLowerCase().replace(" ", "");
    navigate(`/propfirm?tab=${tabParam}`, { replace: true });
  };

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
      share: "",
      cutoff: "",
      time: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch('/api/admin/prop-packages/create/', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          return;
        }
        throw new Error('Failed to create package');
      }

      // Refresh packages data
      const fetchResponse = await fetch('/api/admin/prop-packages/?type=packages', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        const items = Array.isArray(data.packages)
          ? data.packages
          : Array.isArray(data.data)
          ? data.data
          : data.results || [];
        setPackages(items);
      }

      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Define columns for each tab to pass to TableStructure
  const columnsPackages = [
    { Header: "Package Name", accessor: "name" },
    { Header: "Price", accessor: "price" },
    { Header: "Bonus Fund", accessor: "bonus" },
    { Header: "Tradable Fund", accessor: "tradable" },
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
      Cell: (cellValue, row) => (
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
        if (loading) {
          return <div className="text-center py-8 text-yellow-400">Loading packages...</div>;
        }
        if (error) {
          return <div className="text-center py-8 text-red-400">Error: {error}</div>;
        }
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
                      <div className="grid grid-cols-2 gap-4 text-sm ">
                        <div>Maximum Cutoff: {row.cutoff}</div>
                        <div>Target: {row.target}</div>
                        <div>Target Time: {row.time}</div>
                        <div>Profit Share: {row.share}</div>
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
        if (loading) {
          return <div className="text-center py-8 text-yellow-400">Loading prop traders...</div>;
        }
        if (error) {
          return <div className="text-center py-8 text-red-400">Error: {error}</div>;
        }
        return (
          <TableStructure
            columns={columnsPropTraders}
            data={propTraders}
          />
        );
      case "Requests":
        if (loading) {
          return <div className="text-center py-8 text-yellow-400">Loading requests...</div>;
        }
        if (error) {
          return <div className="text-center py-8 text-red-400">Error: {error}</div>;
        }
        return (
          <>
          <TableStructure
            columns={columnsRequests}
            data={requests}
          />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen   p-4 sm:p-8">
      <div className={(isModalOpen || isRequestModalOpen) ? 'filter blur-sm' : ''}>

        {/* Buttons / Tabs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
          {["Packages", "Prop Traders", "Requests"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`
                w-full sm:w-auto
                px-6 py-3
                rounded-md
                transition-all
                text-center
                ${
                  activeTab === tab
                    ? "bg-yellow-500 text-black shadow-lg"
                    : "bg-black border text-white border-yellow-400 hover:bg-yellow-500 hover:text-black"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>


        {/* Table */}
        <div className="overflow-x-auto">{renderTable()}</div>
      </div>

      {/* Modal */}
{/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
    <div
  className="
    bg-black
    rounded-xl
    p-6
    w-[90vw]
    md:w-full
    max-w-md
    border border-yellow-500
    shadow-[0_0_35px_rgba(234,179,8,0.45)]
    transition-all
    duration-300
    hover:shadow-[0_0_55px_rgba(234,179,8,0.8)]
    hover:border-yellow-400
  "
>

      {/* Title with border */}
      <h3
        className="
          text-xl
          font-bold
          text-center
          text-yellow-400
          mb-5
          pb-2
          drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]
        "
      >
        Create New Package
      </h3>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Package Name"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          placeholder="Price"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="bonusFund"
          value={formData.bonus}
          onChange={handleInputChange}
          placeholder="Bonus Fund"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="tradableFund"
          value={formData.tradable}
          onChange={handleInputChange}
          placeholder="Tradable Fund"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="leverage"
          value={formData.leverage}
          onChange={handleInputChange}
          placeholder="Leverage"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="target"
          value={formData.target}
          onChange={handleInputChange}
          placeholder="Target"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="profitShare"
          value={formData.share}
          onChange={handleInputChange}
          placeholder="Profit Share"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="maxCutoff"
          value={formData.cutoff}
          onChange={handleInputChange}
          placeholder="Maximum Cutoff"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <input
          type="text"
          name="targetTime"
          value={formData.time}
          onChange={handleInputChange}
          placeholder="Target Time"
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 placeholder-gray-600 focus:placeholder-transparent
"
          required
        />

        <select
          name="status"
          placeholder="Select Status"
          value={formData.status ? "true" : "false"}
          onChange={handleStatusChange}
          className="w-full p-2 bg-black border border-yellow-400 text-yellow-400 rounded
                     hover:border-yellow-300 focus:border-yellow-300 "
        >
          <option value="" disabled>
            Select Status
          </option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-yellow-500 text-black rounded
                       hover:bg-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
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
                onClick={async () => {
                  try {
                    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;

                    const headers = {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    };

                    const response = await fetch(`/api/admin/prop-requests/${selectedRequest.id}/approve/`, {
                      method: 'POST',
                      credentials: 'include',
                      headers,
                    });

                    if (!response.ok) {
                      if (response.status === 401) {
                        setError('Session expired. Please log in again.');
                        return;
                      }
                      throw new Error('Failed to approve request');
                    }

                    // Refresh requests data
                    const fetchResponse = await fetch('/api/admin/prop-packages/?type=requests', {
                      method: 'GET',
                      credentials: 'include',
                      headers,
                    });

                    if (fetchResponse.ok) {
                      const data = await fetchResponse.json();
                      const items = Array.isArray(data.packages)
                        ? data.packages
                        : Array.isArray(data.data)
                        ? data.data
                        : data.results || [];
                      setRequests(items);
                    }

                    handleCloseRequestModal();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                className="px-4 py-2 bg-green-600  rounded hover:bg-green-700"
              >
                Approved
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token") : null;

                    const headers = {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    };

                    const response = await fetch(`/api/admin/prop-requests/${selectedRequest.id}/reject/`, {
                      method: 'POST',
                      credentials: 'include',
                      headers,
                    });

                    if (!response.ok) {
                      if (response.status === 401) {
                        setError('Session expired. Please log in again.');
                        return;
                      }
                      throw new Error('Failed to reject request');
                    }

                    // Refresh requests data
                    const fetchResponse = await fetch('/api/admin/prop-packages/?type=requests', {
                      method: 'GET',
                      credentials: 'include',
                      headers,
                    });

                    if (fetchResponse.ok) {
                      const data = await fetchResponse.json();
                      const items = Array.isArray(data.packages)
                        ? data.packages
                        : Array.isArray(data.data)
                        ? data.data
                        : data.results || [];
                      setRequests(items);
                    }

                    handleCloseRequestModal();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                className="px-4 py-2 bg-red-600  rounded hover:bg-red-700"
              >
                Rejected
              </button>
              <button
                onClick={handleCloseRequestModal}
                className="px-4 py-2 bg-gray-600  rounded hover:bg-gray-700"
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

export default PropFirm;
