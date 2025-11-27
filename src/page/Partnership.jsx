import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import PartnershipModals from "../Modals/PartnershipModals";

const Partnership = () => {
  const [activeTab, setActiveTab] = useState("partnerList");
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [databaseOnly, setDatabaseOnly] = useState(false);
  const [tradingAccounts, setTradingAccounts] = useState([]);
  const [commissionBalance, setCommissionBalance] = useState(0);
  const [editRowId, setEditRowId] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});

  // New states for button modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showDisableIBModal, setShowDisableIBModal] = useState(false);
  const [showClientListModal, setShowClientListModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // New states for profile modal
  const [currentProfile, setCurrentProfile] = useState(null);
  const [selectedNewProfile, setSelectedNewProfile] = useState("");
  const [availableProfiles, setAvailableProfiles] = useState([]);

  // New states for add client modal
  const [unassignedClients, setUnassignedClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // New states for history modal
  const [historyData, setHistoryData] = useState([]);

  // New states for client list modal
  // eslint-disable-next-line no-unused-vars
  const [clientListData, setClientListData] = useState([]);

  // New state for statistics data
  const [statisticsData, setStatisticsData] = useState(null);

  // New state for statistics tab
  const [statisticsTab, setStatisticsTab] = useState("summary");

  // New state for commission details data
  const [commissionDetailsData, setCommissionDetailsData] = useState(null);



  // New states for commission stats filters
  const [commissionLevelFilter, setCommissionLevelFilter] = useState("All Levels");
  const [commissionDateFrom, setCommissionDateFrom] = useState("");
  const [commissionDateTo, setCommissionDateTo] = useState("");

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

  const [pageByTab] = useState({ partnerList: 1, withdrawalRequest: 1, withdrawalPending: 1 });
  const [perPage] = useState(10);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [_modalLoading, setModalLoading] = useState(false);

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
    tradingAccounts: "/ib-user/",
    commissionBalance: "/api/admin/ib-user/",
    partnerProfile: "/partner-profile/",
    unassignedClients: "/api/admin/unassigned-clients/",
    statistics: "/api/admin/ib-user/",
  };

  const fetchData = async (tab) => {
    const endpoint = API_ENDPOINTS[tab];
    if (!endpoint) return;
    setError(null);
    try {
      // Build headers and include credentials to support cookie-based auth
      const headers = { Accept: "application/json" };
      // If you store a token in localStorage (e.g. 'accessToken' or 'token'), include it
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
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
          email: u.email ?? "",
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
            } catch {
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
    }
  };

  // Approve / Reject handlers for withdrawal requests
  const handleApprove = async (row) => {
    const id = row.transactionId ?? row._raw?.transactionId ?? row.id;
    if (!id) return setError("Cannot determine transaction id for approve action");
    setActionLoading((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
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

  // Re-fetch commission details when filters change and modal is open
  useEffect(() => {
    if (selectedId && showStatisticsModal && statisticsTab === "commissionStats") {
      fetchCommissionDetails(selectedId, commissionLevelFilter, commissionDateFrom, commissionDateTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionLevelFilter, commissionDateFrom, commissionDateTo, selectedId, showStatisticsModal, statisticsTab]);

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

  const [viewingGroups, setViewingGroups] = useState(null); // array of groups being viewed in popover
  const [availableGroups, setAvailableGroups] = useState([]);

  // Partner-list specific sub-row actions (stubs — wire to real behaviour later)
  const fetchTradingAccounts = async (userId) => {
    const endpoint = `${API_ENDPOINTS.tradingAccounts}${userId}/trading-accounts/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view trading accounts.");
        setTradingAccounts([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch trading accounts: ${res.status}`);
      const json = await res.json();
      const accounts = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);
      setTradingAccounts(accounts);
    } catch (err) {
      setError(err.message || "Failed to load trading accounts");
      setTradingAccounts([]);
    }
  };

  const fetchCommissionBalance = async (userId) => {
    const endpoint = `${API_ENDPOINTS.commissionBalance}${userId}/commission-balance/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view commission balance.");
        setCommissionBalance(0);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch commission balance: ${res.status}`);
      const json = await res.json();
      const balance = json.balance ?? json.commission_balance ?? 0;
      setCommissionBalance(balance);
    } catch (err) {
      setError(err.message || "Failed to load commission balance");
      setCommissionBalance(0);
    }
  };

  const handleTransfer = async (row) => {
    setSelectedRow(row);
    setSelectedAccount("");
    setWithdrawAmount("");
    setDatabaseOnly(false);
    setShowTransferModal(true);
    // Fetch trading accounts and commission balance
    const userId = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    if (userId) {
      await Promise.all([fetchTradingAccounts(userId), fetchCommissionBalance(userId)]);
    }
  };





  const handleTransferSubmit = async () => {
    if (!selectedAccount || !withdrawAmount) {
      alert("Please select an account and enter an amount");
      return;
    }
    setError(null);
    try {
      const endpoint = "/api/admin/commission-db-withdraw/";
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: selectedRow.userId ?? selectedRow._raw?.user_id ?? selectedRow._raw?.id,
          accountId: selectedAccount,
          amount: parseFloat(withdrawAmount),
          database_only: databaseOnly,
        }),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to perform this action.");
        return;
      }
      if (!res.ok) throw new Error(`Transfer failed: ${res.status}`);
      alert("Transfer submitted successfully");
      setShowTransferModal(false);
      // Refresh data if needed
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to submit transfer");
    }
  };

  const handleZeroBalance = async () => {
    setError(null);
    try {
      const endpoint = "/api/admin/commission-zero/";
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          user_id: selectedRow.userId ?? selectedRow._raw?.user_id ?? selectedRow._raw?.id,
        }),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to perform this action.");
        return;
      }
      if (!res.ok) throw new Error(`Zero balance failed: ${res.status}`);
      alert("Commission balance zeroed successfully");
      setShowTransferModal(false);
      // Refresh data if needed
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to zero balance");
    }
  };

  const fetchCurrentProfile = async (userId) => {
    const endpoint = `${API_ENDPOINTS.partnerProfile}${userId}/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view current profile.");
        setCurrentProfile(null);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch current profile: ${res.status}`);
      const json = await res.json();
      setCurrentProfile(json);
    } catch (err) {
      setError(err.message || "Failed to load current profile");
      setCurrentProfile(null);
    }
  };

  const fetchAvailableProfiles = async () => {
    const endpoint = API_ENDPOINTS.commissionProfiles;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view available profiles.");
        setAvailableProfiles([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch available profiles: ${res.status}`);
      const json = await res.json();
      const items = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);
      const profiles = items.map(p => ({ id: p.profileId, name: p.profileName }));
      setAvailableProfiles(profiles);
    } catch (err) {
      setError(err.message || "Failed to load available profiles");
      setAvailableProfiles([]);
    }
  };

  const handleChangeProfile = async () => {
    if (!selectedNewProfile) {
      alert("Please select a new profile");
      return;
    }
    setError(null);
    try {
      const endpoint = `/update-partner-profile/${selectedId}/`;
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ profile_id: selectedNewProfile }),
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to change profile.");
        return;
      }
      if (!res.ok) throw new Error(`Failed to change profile: ${res.status}`);
      alert("Profile changed successfully");
      setShowProfileModal(false);
      // Refresh data
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to change profile");
    }
  };

  const handleProfile = async (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    setSelectedNewProfile("");
    await Promise.all([fetchCurrentProfile(id), fetchAvailableProfiles()]);
    setShowProfileModal(true);
  };

  const fetchUnassignedClients = async () => {
    const endpoint = API_ENDPOINTS.unassignedClients;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view unassigned clients.");
        setUnassignedClients([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch unassigned clients: ${res.status}`);
      const json = await res.json();
      const clients = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);
      setUnassignedClients(clients);
    } catch (err) {
      setError(err.message || "Failed to load unassigned clients");
      setUnassignedClients([]);
    }
  };

  const handleAddClient = async (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    setSelectedClient("");
    setClientSearchTerm("");
    await fetchUnassignedClients();
    setShowAddClientModal(true);
  };

  const handleAddClientSubmit = async () => {
    if (!selectedClient) {
      alert("Please select a client");
      return;
    }
    setError(null);
    try {
      // First, get the IB user email
      const ibUserEndpoint = `/api/admin/user-info/${selectedId}/`;
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const ibRes = await fetch(ibUserEndpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!ibRes.ok) throw new Error(`Failed to fetch IB user info: ${ibRes.status}`);
      const ibUserData = await ibRes.json();
      const parentIbEmail = ibUserData.email;

      // Then, get the client user email
      const clientUserEndpoint = `/api/admin/user-info/${selectedClient}/`;
      const clientRes = await fetch(clientUserEndpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!clientRes.ok) throw new Error(`Failed to fetch client user info: ${clientRes.status}`);
      const clientUserData = await clientRes.json();
      const clientEmail = clientUserData.email;

      // Now, assign the client
      const endpoint = `/api/admin/assign-specific-client/`;
      const assignRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          client_email: clientEmail,
          parent_ib_email: parentIbEmail
        }),
      });
      if (assignRes.status === 401) {
        setError("Unauthorized: please log in to add client.");
        return;
      }
      if (!assignRes.ok) throw new Error(`Failed to add client: ${assignRes.status}`);
      alert("Client added successfully");
      setShowAddClientModal(false);
      // Refresh data
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to add client");
    }
  };

  const fetchHistoryData = async (userId) => {
    const endpoint = `/api/admin/commission-withdrawal-history/${userId}/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view history.");
        setHistoryData([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
      const json = await res.json();
      const items = json.results ?? json.items ?? json.data ?? (Array.isArray(json) ? json : []);
      const transformed = items.map((it) => ({
        transactionId: it.id ?? it.transaction_id ?? "",
        date: it.created_at ?? it.date ?? "",
        amount: it.amount ?? "",
        tradingAccount: it.trading_account_id ?? it.trading_account ?? "",
      }));
      setHistoryData(transformed);
    } catch (err) {
      setError(err.message || "Failed to load history");
      setHistoryData([]);
    }
  };

  const handleHistory = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    fetchHistoryData(id);
    setShowHistoryModal(true);
  };

  const fetchCommissionDetails = async (userId, level = "", dateFrom = "", dateTo = "") => {
    let endpoint = `/api/admin/ib-users/${userId}/commission-details/?page=1&pageSize=10&per_page=10`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (params.toString()) endpoint += `&${params.toString()}`;

    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view commission details.");
        setCommissionDetailsData(null);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch commission details: ${res.status}`);
      const json = await res.json();
      setCommissionDetailsData(json.details || []);
    } catch (err) {
      setError(err.message || "Failed to load commission details");
      setCommissionDetailsData(null);
    }
  };

  const handleStatistics = async (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    // Reset filters
    setCommissionLevelFilter("");
    setCommissionDateFrom("");
    setCommissionDateTo("");
    // Fetch statistics data
    const endpoint = `${API_ENDPOINTS.statistics}${id}/statistics/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view statistics.");
        setStatisticsData(null);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch statistics: ${res.status}`);
      const json = await res.json();
      setStatisticsData(json);
    } catch (err) {
      setError(err.message || "Failed to load statistics");
      setStatisticsData(null);
    }
    // Fetch commission details data
    await fetchCommissionDetails(id);
    setShowStatisticsModal(true);
  };

  const handleDisableIB = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    setSelectedRow(row);
    setShowDisableIBModal(true);
  };

  const handleDisableIBSubmit = async () => {
    setError(null);
    try {
      const endpoint = `/api/admin/disable-ib/${selectedId}/`;
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to disable IB.");
        return;
      }
      if (!res.ok) throw new Error(`Failed to disable IB: ${res.status}`);
      alert("IB disabled successfully");
      setShowDisableIBModal(false);
      // Refresh data
      fetchData(activeTab);
    } catch (err) {
      setError(err.message || "Failed to disable IB");
    }
  };

  const fetchClientListData = async (userId) => {
    const endpoint = `/api/admin/ib-users/${userId}/clients/`;
    setError(null);
    try {
      const token = window.localStorage.getItem("access_token") || window.localStorage.getItem("token");
      const res = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Unauthorized: please log in to view client list.");
        setClientListData([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch client list: ${res.status}`);
      const json = await res.json();
      let clients = [];
      if (Array.isArray(json)) {
        clients = json[0]?.clients ?? [];
      } else {
        clients = json.levels?.[0]?.clients ?? [];
      }
      const transformed = clients.map((client) => ({
        name: client.name,
        email: client.email,
        user_id: client.user_id,
      }));
      setClientListData(transformed);
    } catch (err) {
      setError(err.message || "Failed to load client list");
      setClientListData([]);
    }
  };

  const handleClientList = (row) => {
    const id = row.userId ?? row._raw?.user_id ?? row._raw?.id;
    setSelectedId(id);
    fetchClientListData(id);
    setShowClientListModal(true);
  };

  const fetchCommissionProfiles = async () => {
    const endpoint = API_ENDPOINTS.commissionProfiles;
    if (!endpoint) return;
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
      await res.json();
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

  // Subrow component for Partner List
  const renderPartnerSubRow = (row, rowIndex) => {
    return (
      <tr key={`sub-${rowIndex}`} className="bg-gray-50 dark:bg-gray-800">
        <td colSpan={partnerListColumns.length} className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTransfer(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Transfer
            </button>
            <button
              onClick={() => handleProfile(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Profile
            </button>
            <button
              onClick={() => handleAddClient(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Add Client
            </button>
            <button
              onClick={() => handleHistory(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              History
            </button>
            <button
              onClick={() => handleStatistics(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Statistics
            </button>
            <button
              onClick={() => handleDisableIB(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Disable IB
            </button>
            <button
              onClick={() => handleClientList(row)}
              className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600 transition"
            >
              Client List
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Determine columns, data, and actions based on active tab
  let columns = [];
  let data = [];
  let actionsColumn = undefined;
  let renderRowSubComponent = undefined;

  switch (activeTab) {
    case "partnerList":
      columns = partnerListColumns;
      data = dataState.partnerList.items;
      actionsColumn = undefined;
      renderRowSubComponent = renderPartnerSubRow;
      break;
    case "withdrawalRequest":
      columns = withdrawalRequestColumns;
      data = dataState.withdrawalRequest.items;
      // actions removed per request (no Approve/Reject buttons in table)
      actionsColumn = undefined;
      renderRowSubComponent = undefined;
      break;
    case "withdrawalPending":
      columns = withdrawalPendingColumns;
      data = dataState.withdrawalPending.items;
      // enable actions (Approve/Reject) for pending withdrawals
      actionsColumn = withdrawalRequestActions;
      renderRowSubComponent = undefined;
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
        renderRowSubComponent={renderRowSubComponent}
      />

      <PartnershipModals
        showCommissionModal={showCommissionModal}
        setShowCommissionModal={setShowCommissionModal}
        isCreateMode={isCreateMode}
        setIsCreateMode={setIsCreateMode}
        newProfile={newProfile}
        setNewProfile={setNewProfile}
        availableGroups={availableGroups}
        commissionProfiles={commissionProfiles}
        commissionProfileColumns={commissionProfileColumns}
        commissionActionsColumn={commissionActionsColumn}
        viewingGroups={viewingGroups}
        setViewingGroups={setViewingGroups}
        setEditRowId={setEditRowId}
        setEditedRowData={setEditedRowData}
        handleCreateProfile={handleCreateProfile}
        showTransferModal={showTransferModal}
        setShowTransferModal={setShowTransferModal}
        selectedRow={selectedRow}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        withdrawAmount={withdrawAmount}
        setWithdrawAmount={setWithdrawAmount}
        databaseOnly={databaseOnly}
        setDatabaseOnly={setDatabaseOnly}
        handleTransferSubmit={handleTransferSubmit}
        handleZeroBalance={handleZeroBalance}
        tradingAccounts={tradingAccounts}
        commissionBalance={commissionBalance}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        ProfileName={currentProfile}
        availableProfiles={availableProfiles}
        selectedNewProfile={selectedNewProfile}
        setSelectedNewProfile={setSelectedNewProfile}
        handleChangeProfile={handleChangeProfile}
        showAddClientModal={showAddClientModal}
        setShowAddClientModal={setShowAddClientModal}
        unassignedClients={unassignedClients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clientSearchTerm={clientSearchTerm}
        setClientSearchTerm={setClientSearchTerm}
        handleAddClientSubmit={handleAddClientSubmit}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        historyData={historyData}
        clientListData={clientListData}
        showStatisticsModal={showStatisticsModal}
        setShowStatisticsModal={setShowStatisticsModal}
        statisticsData={statisticsData}
        statisticsTab={statisticsTab}
        setStatisticsTab={setStatisticsTab}
        commissionDetailsData={commissionDetailsData}
        commissionLevelFilter={commissionLevelFilter}
        setCommissionLevelFilter={setCommissionLevelFilter}
        commissionDateFrom={commissionDateFrom}
        setCommissionDateFrom={setCommissionDateFrom}
        commissionDateTo={commissionDateTo}
        setCommissionDateTo={setCommissionDateTo}
        showDisableIBModal={showDisableIBModal}
        setShowDisableIBModal={setShowDisableIBModal}
        showClientListModal={showClientListModal}
        setShowClientListModal={setShowClientListModal}
        selectedId={selectedId}
        handleDisableIBSubmit={handleDisableIBSubmit}
      />
    </div>
  );
};

export default Partnership;
