import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import SubRowButtons from "../commonComponent/SubRowButtons";

const Partnership = () => {
  const [activeTab, setActiveTab] = useState("partnerList");
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});

  // New states for create mode and new commission form
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newProfile, setNewProfile] = useState({
    profileName: "",
    usdPerLot: "",
    isPercentageBased: false,
    levelPercentages: "",
    selectedGroups: [],
  });

  const partnerListColumns = [
    { Header: "IB User Name", accessor: "ibUserName" },
    { Header: "User ID", accessor: "userId" },
    { Header: "Commission Profile", accessor: "commissionProfile" },
    { Header: "Total Clients", accessor: "totalClients" },
  ];

  const withdrawalRequestColumns = [
    { Header: "Transaction ID", accessor: "transactionId" },
    { Header: "User ID", accessor: "userId" },
    { Header: "User Name", accessor: "userName" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Amount", accessor: "amount" },
    { 
      Header: "Status", 
      accessor: "status",
      Cell: (value) => (
        <span className={value === "approved" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { Header: "Created At", accessor: "createdAt" },
    { Header: "Approved At", accessor: "approvedAt" },
    { Header: "Approved By", accessor: "approvedBy" },
  ];

 const withdrawalRequestActions = (row) => {
  const id = row.transactionId ?? row._raw?.transactionId ?? row.id;
  const approving = !!actionLoading[id];
  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          if (window.confirm("Approve this withdrawal?")) handleApprove(row);
        }}
        disabled={approving}
        className={`bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition ${approving ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {approving ? "Approving..." : "Approve"}
      </button>

      <button
        onClick={() => {
          if (window.confirm("Reject this withdrawal?")) handleReject(row);
        }}
        disabled={approving}
        className={`bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition ${approving ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {approving ? "Processing..." : "Reject"}
      </button>
    </div>
  );
 };


  const withdrawalPendingColumns = [
    { Header: "Transaction ID", accessor: "transactionId" },
    { Header: "User ID", accessor: "userId" },
    { Header: "User Name", accessor: "userName" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Date", accessor: "createdAt" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
  ];

  // Data fetched from API (per-tab storage)
  const [dataState, setDataState] = useState({
    partnerList: { items: [], total: 0 },
    withdrawalRequest: { items: [], total: 0 },
    withdrawalPending: { items: [], total: 0 },
  });

  const [pageByTab, setPageByTab] = useState({ partnerList: 1, withdrawalRequest: 1, withdrawalPending: 1 });
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Map tabs to API endpoints — adjust endpoints to match your backend
  const API_ENDPOINTS = {
    commissionProfiles: "/api/commissioning-profiles/",
    createCommissionProfile: "/api/create-commissioning-profile/",
    tradingGroups: "/api/trading-groups/",
    partnerList: "/api/admin/ib-users/",
    withdrawalRequest: "/api/admin/commission-withdrawal-history",
    withdrawalPending: "/api/admin/pending-withdrawal-requests",
    // Actions - base path; handlers will append the transaction id and action
    withdrawalApprove: "/api/admin/transaction/",
    withdrawalReject: "/api/admin/transaction/",
  };

  const currentPage = pageByTab[activeTab] || 1;

  const fetchData = async (tab) => {
    const endpoint = API_ENDPOINTS[tab];
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      // Build headers and include credentials to support cookie-based auth
      const headers = { Accept: "application/json" };
      // If you store a token in localStorage (e.g. 'accessToken' or 'token'), include it
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${endpoint}?page=${pageByTab[tab]}&per_page=${perPage}`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        // Unauthorized — show friendly message (don't throw raw status)
        setError("Unauthorized: please log in to view this data.");
        setDataState((prev) => ({ ...prev, [tab]: { items: [], total: 0 } }));
        return;
      }

      if (!res.ok) throw new Error(`Failed to fetch ${tab}: ${res.status}`);
      const json = await res.json();
      // Support a few possible response shapes: { results: [], total }, { items: [], total }, or direct array
      const items = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);

      // Try to read total from common headers if backend provides it (e.g. X-Total-Count)
      const totalHeader = res.headers.get("X-Total-Count") || res.headers.get("X-Total") || res.headers.get("Total-Count");
      const totalFromJson = json.total ?? json.count;
      const total = totalHeader ? parseInt(totalHeader, 10) : (totalFromJson ?? (Array.isArray(items) ? items.length : 0));

      // Transform items to match table column shape for specific tabs
      let transformed = items;
      if (tab === "partnerList") {
        transformed = items.map((u) => ({
          ibUserName: u.username ?? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
          userId: u.user_id ?? u.userId ?? u.id,
          commissionProfile: u.commission_profile_name ?? u.commissioning_profile ?? u.commission_profile ?? "",
          totalClients: u.total_clients ?? u.totalClients ?? 0,
          // keep original object for advanced rows if needed
          _raw: u,
        }));
      } else if (tab === "withdrawalRequest" || tab === "withdrawalPending") {
        // API returns snake_case fields like `id`, `username`, `trading_account_id`, `transaction_type_display`, `created_at`
        transformed = items.map((it) => ({
          transactionId: it.id ?? it.transactionId ?? it.transaction_id,
          userId: it.user_id ?? it.userId ?? it.user ?? null,
          userName: it.username ?? it.user_name ?? it.display_name ?? it.name,
          email: it.email ?? it.user_email ?? "",
          tradingAccountId: it.trading_account_id ?? it.tradingAccountId ?? it.trading_account ?? "",
          // Map approved_by and approved_at for display
          approvedBy: it.approved_by_username ?? it.approved_by ?? it.approved_by_email ?? "",
          approvedAt: it.approved_at ? (() => {
            try {
              return new Date(it.approved_at).toLocaleString();
            } catch (e) {
              return String(it.approved_at);
            }
          })() : "",
          // 'type' column removed from UI; we still keep raw value on _raw if needed
          amount: it.amount ?? it.value ?? "",
          status: it.status ?? "",
          createdAt: it.created_at ?? it.createdAt ?? it.date ?? "",
          _raw: it,
        }));
      }

      setDataState((prev) => ({ ...prev, [tab]: { items: transformed, total } }));
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject handlers for withdrawal requests
  const handleApprove = async (row) => {
    const id = row.transactionId ?? row._raw?.transactionId ?? row.id;
    if (!id) return setError("Cannot determine transaction id for approve action");
    setActionLoading((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      // Build URL with id (backend expects /api/admin/transaction/<id>/approve/)
      const url = `${API_ENDPOINTS.withdrawalApprove}${id}/approve/`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ transactionId: id }),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to perform this action.");
        return;
      }
      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      // Refresh current tab
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to approve");
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  const handleReject = async (row) => {
    const id = row.transactionId ?? row._raw?.transactionId ?? row.id;
    if (!id) return setError("Cannot determine transaction id for reject action");
    setActionLoading((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      // Build URL with id (backend expects /api/admin/transaction/<id>/reject/)
      const url = `${API_ENDPOINTS.withdrawalReject}${id}/reject/`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ transactionId: id }),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to perform this action.");
        return;
      }
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
      // Refresh current tab
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to reject");
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // Fetch when active tab, page or perPage changes
  useEffect(() => {
    fetchData(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pageByTab[activeTab], perPage]);

  // Commission profiles data and columns for modal
  const [commissionProfiles, setCommissionProfiles] = useState([
    {
      id: "1",
      profileName: "Gold Plan",
      profileId: "GP001",
      commissionDetails: "15% on sales",
      type: "Fixed",
      groups: "Group A",
    },
    {
      id: "2",
      profileName: "Silver Plan",
      profileId: "SP002",
      commissionDetails: "10% on sales",
      type: "Variable",
      groups: "Group B",
    },
  ]);

  const commissionProfileColumns = [
    {
      Header: "Profile Name",
      accessor: "profileName",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <input
              type="text"
              value={editedRowData.profileName || ""}
              onChange={(e) => handleEditChange("profileName", e.target.value)}
              className="border p-1 rounded w-full"
            />
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Profile ID",
      accessor: "profileId",
      Cell: (cellValue) => <span className="select-none">{cellValue}</span>, // Non-editable
    },
    {
      Header: "Commission Details",
      accessor: "commissionDetails",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <input
              type="text"
              value={editedRowData.commissionDetails || ""}
              onChange={(e) => handleEditChange("commissionDetails", e.target.value)}
              className="border p-1 rounded w-full"
            />
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Type",
      accessor: "type",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <select
              value={editedRowData.type || ""}
              onChange={(e) => handleEditChange("type", e.target.value)}
              className="border p-1 rounded w-full"
            >
              <option value="">Select Type</option>
              <option value="Fixed">Fixed</option>
              <option value="Variable">Variable</option>
            </select>
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Groups",
      accessor: "groupsList",
      Cell: (cellValue, row) => {
        // cellValue is groupsList array (from mapping)
        const groups = Array.isArray(cellValue) ? cellValue : (row.groupsList || []);
        const count = groups.length;
        return (
          <div>
            <button
              type="button"
              onClick={() => setViewingGroups(groups)}
              className="bg-gray-100 text-black px-2 py-1 rounded text-sm"
            >
              {count} {count === 1 ? 'Group' : 'Groups'}
            </button>
          </div>
        );
      },
    },
  ];

  // Handlers for editing
  const handleEditChange = (field, value) => {
    setEditedRowData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditedRowData(row);
  };

  const handleDeleteClick = (row) => {
    if (window.confirm(`Are you sure you want to delete profile "${row.profileName}"?`)) {
      setCommissionProfiles(prev => prev.filter(item => item.id !== row.id));
      if (editRowId === row.id) {
        setEditRowId(null);
        setEditedRowData({});
      }
    }
  };

  const handleSaveClick = () => {
    setCommissionProfiles(prev =>
      prev.map(item => (item.id === editRowId ? { ...item, ...editedRowData } : item))
    );
    setEditRowId(null);
    setEditedRowData({});
  };

  const handleCancelClick = () => {
    setEditRowId(null);
    setEditedRowData({});
  };

  const [modalLoading, setModalLoading] = useState(false);
  const [viewingGroups, setViewingGroups] = useState(null); // array of groups being viewed in popover
  const [availableGroups, setAvailableGroups] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // Partner-list specific sub-row actions (stubs — wire to real behaviour later)
  const handleTransfer = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Transfer clicked for", id, row);
    alert(`Transfer action for user ${id}`);
  };

  const handleProfile = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Profile clicked for", id, row);
    alert(`Open profile for user ${id}`);
  };

  const handleAddClient = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Add client for", id, row);
    alert(`Add client for user ${id}`);
  };

  const handleHistory = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("History for", id, row);
    alert(`History for user ${id}`);
  };

  const handleStatistics = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Statistics for", id, row);
    alert(`Statistics for user ${id}`);
  };

  const handleDisableIB = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Disable IB for", id, row);
    if (window.confirm(`Disable IB for user ${id}?`)) {
      alert(`Disabled IB ${id} (stub)`);
    }
  };

  const handleClientList = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    console.log("Client List for", id, row);
    alert(`Open client list for user ${id}`);
  };

  const fetchCommissionProfiles = async () => {
    const endpoint = API_ENDPOINTS.commissionProfiles;
    if (!endpoint) return;
    setModalLoading(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view commission profiles.");
        setCommissionProfiles([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch commission profiles: ${res.status}`);
      const json = await res.json();
      const items = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);
      const mapped = items.map((p) => {
        const groupsArray = Array.isArray(p.approvedGroups)
          ? p.approvedGroups
          : Array.isArray(p.approved_groups)
          ? p.approved_groups
          : Array.isArray(p.groups)
          ? p.groups
          : [];
        return ({
          id: p.id ?? p.profileId ?? p.profile_id ?? String(p.id ?? Math.random()),
          profileName: p.profileName ?? p.name ?? p.profile_name ?? p.commission_profile_name ?? "",
          profileId: p.profileId ?? p.profile_id ?? p.id ?? "",
          // Prefer displayText if provided by serializer for human-friendly description
          commissionDetails: p.displayText ?? p.commissionDetails ?? p.details ?? p.commission_details ?? p.description ?? "",
          type: p.type ?? p.commission_type ?? (p.usePercentageBased ? 'Percentage' : 'USD per lot') ?? "",
          groupsList: groupsArray,
          groupsCount: Array.isArray(groupsArray) ? groupsArray.length : 0,
        });
      });
      setCommissionProfiles(mapped);
    } catch (err) {
      setError(err.message || "Failed to load commission profiles");
    } finally {
      setModalLoading(false);
    }
  };

  const fetchAvailableGroups = async () => {
    const endpoint = API_ENDPOINTS.tradingGroups;
    if (!endpoint) return;
    setModalLoading(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view available groups.");
        setAvailableGroups([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch groups: ${res.status}`);
      const json = await res.json();
      // Expecting shape: { available_groups: [...] } or direct array
      const groups = json.available_groups ?? json.availableGroups ?? json.groups ?? (Array.isArray(json) ? json : []);
      setAvailableGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      setError(err.message || "Failed to load groups");
      setAvailableGroups([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenCommissionModal = async (create = false) => {
    setIsCreateMode(create);
    // fetch groups and profiles so modal shows up-to-date data
    await Promise.all([fetchAvailableGroups(), fetchCommissionProfiles()]);
    setShowCommissionModal(true);
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfile.profileName) {
      alert("Profile Name is required");
      return;
    }
    setModalLoading(true);
    setError(null);
    try {
      const endpoint = API_ENDPOINTS.createCommissionProfile;
      if (!endpoint) throw new Error("Create endpoint not configured");
      const token = window.localStorage.getItem("accessToken") || window.localStorage.getItem("token");
      // Build payload to match backend serializer expectations
      const body = {
        // serializer expects 'name' for the profile name
        name: newProfile.profileName,
        // backend expects 'use_percentage_based' boolean
        use_percentage_based: !!newProfile.isPercentageBased,
        // approved_groups should be an array of group names
        approved_groups: Array.isArray(newProfile.selectedGroups) ? newProfile.selectedGroups : [],
      };

      if (newProfile.isPercentageBased) {
        // send level_percentages as comma-separated string (legacy) or 'levels' if you prefer
        if (newProfile.levelPercentages) {
          body.level_percentages = newProfile.levelPercentages;
        }
      } else {
        // USD per lot; support single value or comma-separated amounts
        if (newProfile.usdPerLot) {
          // If the user entered a comma-separated list, send it as level_amounts_usd_per_lot
          if (String(newProfile.usdPerLot).includes(',')) {
            body.level_amounts_usd_per_lot = String(newProfile.usdPerLot);
          } else {
            // otherwise set level_1_usd_per_lot for the primary level and also provide level_amounts_usd_per_lot
            const val = parseFloat(String(newProfile.usdPerLot));
            if (!Number.isNaN(val)) {
              body.level_1_usd_per_lot = val;
              body.level_amounts_usd_per_lot = String(newProfile.usdPerLot);
            }
          }
        }
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to perform this action.");
        return;
      }
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const created = await res.json();
      // Refresh list
      await fetchCommissionProfiles();
      setShowCommissionModal(false);
      setIsCreateMode(false);
      setNewProfile({ profileName: "", usdPerLot: "", isPercentageBased: false, levelPercentages: "", selectedGroups: [] });
    } catch (err) {
      setError(err.message || "Failed to create profile");
    } finally {
      setModalLoading(false);
    }
  };


  // Actions column for commission profiles modal table
  const commissionActionsColumn = (row) => {
    if (editRowId === row.id) {
      return (
        <div className="flex gap-2">
          <button
            onClick={handleSaveClick}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={handleCancelClick}
            className="bg-gray-400 text-white px-2 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleEditClick(row)}
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteClick(row)}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    );
  };

  // Determine columns, data, and actions based on active tab
  let columns = [];
  let data = [];
  let actionsColumn = undefined;

  switch (activeTab) {
    case "partnerList":
      columns = partnerListColumns;
      data = dataState.partnerList.items;
      actionsColumn = undefined;
      break;
    case "withdrawalRequest":
      columns = withdrawalRequestColumns;
      data = dataState.withdrawalRequest.items;
      // actions removed per request (no Approve/Reject buttons in table)
      actionsColumn = undefined;
      break;
    case "withdrawalPending":
      columns = withdrawalPendingColumns;
      data = dataState.withdrawalPending.items;
      // enable actions (Approve/Reject) for pending withdrawals
      actionsColumn = withdrawalRequestActions;
      break;
    default:
      break;
  }

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "partnerList" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("partnerList")}
        >
          Partner List
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "withdrawalRequest" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("withdrawalRequest")}
        >
          Withdrawal History
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold ${
            activeTab === "withdrawalPending" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("withdrawalPending")}
        >
          Withdrawal Pending
        </button>
      </div>

      <div className="flex justify-between mb-4">
        <button
          className="bg-gray-300 text-black px-3 py-1 rounded-md"
          onClick={() => handleOpenCommissionModal(false)}
        >
          View list
        </button>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
          onClick={() => {
            setEditRowId(null);
            setEditedRowData({});
            setNewProfile({ profileName: "", usdPerLot: "", isPercentageBased: false, levelPercentages: "", selectedGroups: [] });
            handleOpenCommissionModal(true);
          }}
        >
          +Create
        </button>
      </div>

      {/* Top pagination removed per request */}

      {error && <div className="text-red-400 mb-2">{error}</div>}

      <TableStructure
        columns={columns}
        data={data}
        actionsColumn={actionsColumn}
      />

      {showCommissionModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
    <div className="bg-black text-white rounded-lg shadow-lg w-11/12 max-w-4xl p-6 relative">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Commission Profiles</h2>
      {isCreateMode ? (
        <form
          onSubmit={handleCreateProfile}
          className="space-y-4"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm">
            <label className="block font-semibold mb-1">Profile Name</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-black text-white"
              value={newProfile.profileName}
              onChange={(e) => setNewProfile({ ...newProfile, profileName: e.target.value })}
              required
            />
          </div>
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Commission Type</label>
            <div className="flex gap-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={!newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: false })}
                  className="text-white"
                />
                <span className="ml-2">USD per Lot</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: true })}
                  className="text-white"
                />
                <span className="ml-2">Percentage-based</span>
              </label>
            </div>
          </div>
          {newProfile.isPercentageBased ? (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">Level Percentages (e.g., 50,20,20,10)</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.levelPercentages}
                onChange={(e) => setNewProfile({ ...newProfile, levelPercentages: e.target.value })}
                placeholder="Comma-separated percentages"
                pattern="^(?:\d+,)*\d+$"
              />
            </div>
          ) : (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">USD per Lot</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.usdPerLot}
                onChange={(e) => setNewProfile({ ...newProfile, usdPerLot: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>
          )}
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Select Groups</label>
            <div className="border rounded bg-black text-white p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
              {availableGroups.length > 0 ? (
                availableGroups.map((g) => {
                  const checked = newProfile.selectedGroups.includes(g);
                  return (
                    <label key={g} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        className="text-white"
                        checked={checked}
                        onChange={(e) => {
                          setNewProfile((prev) => {
                            const set = new Set(prev.selectedGroups || []);
                            if (e.target.checked) set.add(g);
                            else set.delete(g);
                            return { ...prev, selectedGroups: Array.from(set) };
                          });
                        }}
                      />
                      <span className="select-none">{g}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-sm text-gray-400">No groups available</div>
              )}
            </div>
            <div className="mt-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="text-white"
                  checked={availableGroups.length > 0 && newProfile.selectedGroups.length === availableGroups.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // select all groups
                      setNewProfile((prev) => ({ ...prev, selectedGroups: Array.from(availableGroups) }));
                    } else {
                      // clear selection (backend interprets empty array as 'all groups')
                      setNewProfile((prev) => ({ ...prev, selectedGroups: [] }));
                    }
                  }}
                />
                <span className="ml-2">Select All Groups</span>
              </label>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={() => {
                setShowCommissionModal(false);
                setIsCreateMode(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <>
          <TableStructure
            columns={commissionProfileColumns}
            data={commissionProfiles}
            actionsColumn={commissionActionsColumn}
          />
          {viewingGroups && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-black text-white rounded-lg shadow-lg w-3/4 max-w-2xl p-4 relative">
                <h3 className="text-lg font-semibold mb-2 text-yellow-400">Groups</h3>
                <div style={{ maxHeight: 400, overflowY: 'auto' }} className="text-sm">
                  {viewingGroups.map((g, i) => (
                    <div key={i} className="py-1 border-b border-white/10">{g}</div>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => setViewingGroups(null)}
                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              setShowCommissionModal(false);
              setEditRowId(null);
              setEditedRowData({});
            }}
            className="absolute top-3 right-3 text-white hover:text-gray-300 font-bold text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </>
      )}


          </div>
        </div>
      )}
    </div>
  );
};

export default Partnership;
