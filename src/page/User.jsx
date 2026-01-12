// src/pages/User.jsx
import React, { useState, useMemo, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import SubRowButtons from "../commonComponent/SubRowButtons";
import { useTheme } from "../context/ThemeContext";
import {
  Search,
  Eye,
  EyeOff,
  X,
  PlusCircle,
  ShieldCheck,
  LineChart,
  Gamepad2,
  Ticket,
  User as UserIcon,
  Landmark,
  ArrowUpCircle,
  Power,
  Shuffle,
  Award,
} from "lucide-react";
import Verify from "../Modals/Verify";

import DemoAccountModal from "../Modals/DemoAccountModal";
import BankCryptoModal from "../Modals/BankCryptoModal";
import { ChangeStatusModal, EditProfileModal, TicketsModal, AddTradingAccountModal } from "../Modals";
import Transactions from "../Modals/Transactions";
import TradingAccountModal from "../Modals/TradingAccountModal";
import IbStatusModal from "../Modals/IbStatusModal";

const User = () => {
  const { isDarkMode } = useTheme(); // from your ThemeContext


  // will be loaded from API

  // Add states for DemoAccountModal
  const [demoModalVisible, setDemoModalVisible] = useState(false);
  const [demoModalRow, setDemoModalRow] = useState(null);

  // Add states for BankCryptoModal
  const [bankCryptoModalVisible, setBankCryptoModalVisible] = useState(false);
  const [bankCryptoRow, setBankCryptoRow] = useState(null);



  const [data, setData] = useState([]);

  // Client-side fetch for TableStructure - load all data
  const handleTableFetch = React.useCallback(
    async ({ page: p = 1, pageSize: ps = 10, query = "" }) => {
      const endpoint = "/api/admin/users/";
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(ps));
      if (query) params.set("search", query);
      try {
        const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
        let resJson;
        if (client && typeof client.get === "function") {
          resJson = await client.get(`${endpoint}?${params.toString()}`);
        } else {
          const headers = { "Content-Type": "application/json" };
          const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: "include", headers });
          if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
          resJson = await res.json();
        }
        const items = Array.isArray(resJson.data)
          ? resJson.data
          : Array.isArray(resJson)
            ? resJson
            : resJson.results || [];
        const total =
          typeof resJson.total === "number"
            ? resJson.total
            : typeof resJson.count === "number"
              ? resJson.count
              : items.length;
        const mapped = items.map((u) => ({
          userId: u.user_id ??u.id ?? u.pk,
          name: `${u.first_name || "-"}${u.last_name ? " " + u.last_name : ""}`.trim(),
          email: u.email,
          phone: u.phone_number || u.phone || "-",
          registeredDate: u.date_joined
            ? typeof u.date_joined === "string"
              ? u.date_joined.split("T")[0]
              : String(u.date_joined)
            : "-",
          country: u.country || "-",
          isEnabled: Boolean(u.is_active),
        }));
        setData(mapped);
        return { data: mapped, total };
      } catch {
        console.error("Failed to load users");
        return { data: [], total: 0 };
      }
    },
    []
  );

  // Load all data on mount for client-side
  // No initial client-side preload; TableStructure will call `handleTableFetch` when serverSide=true
  // (This avoids loading all users into the client and enables backend search.)

  // Row expansion
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleRowExpanded = (row) => {
    const newSet = new Set(expandedRows);
    newSet.has(row.userId) ? newSet.delete(row.userId) : newSet.add(row.userId);
    setExpandedRows(newSet);
  };

  const columns = useMemo(
    () => [
      { Header: "User Id", accessor: "userId" },
      { Header: "Name", accessor: "name" },
      { Header: "Email", accessor: "email" },
      { Header: "Phone", accessor: "phone" },
      { Header: "Registered date", accessor: "registeredDate" },
      { Header: "Country", accessor: "country" },
    ],
    []
  );
  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: "",
    email: "",
    phone_number: "",
    dob: "",
    country: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleAddInput = (e) => {
    const { name, value } = e.target;
    setAddForm((p) => ({ ...p, [name]: value }));
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (addForm.password !== addForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      // Prepare payload according to backend format
      const payload = {
        first_name: addForm.first_name,
        last_name: "",
        username: addForm.email,
        email: addForm.email,
        phone_number: addForm.phone_number,
        dob: addForm.dob,
        password: addForm.password,
        country: addForm.country,
        address: addForm.address,
        is_active: true,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/admin/create-user/", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Extract field-specific error messages from backend
        let errorMessage = 'Failed to create user.';
        
        if (response.status === 400) {
          // Check for field-specific errors in various formats
          if (typeof errorData === 'object') {
            // Try to extract field errors
            const fieldErrors = [];
            
            for (const [field, error] of Object.entries(errorData)) {
              if (field === 'message' || field === 'detail') continue;
              
              let fieldError = '';
              if (Array.isArray(error)) {
                fieldError = error.join(', ');
              } else if (typeof error === 'object' && error.message) {
                fieldError = error.message;
              } else {
                fieldError = String(error);
              }
              
              if (fieldError) {
                fieldErrors.push(fieldError);
              }
            }
            
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join(' | ');
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            }
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        showToast(errorMessage, 'error');
        return;
      }

      const result = await response.json();
      showToast('User created successfully!', 'success');

      // Refresh the table data
      if (handleTableFetch) {
        const freshData = await handleTableFetch({ page: 1, pageSize: 10, query: "" });
        setData(freshData.data || []);
      }

      alert("User created successfully!");
      setShowAddModal(false);
      setAddForm({
        first_name: "",
        email: "",
        phone_number: "",
        dob: "",
        country: "Afghanistan",
        address: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyRow, setVerifyRow] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [addressFile, setAddressFile] = useState(null);
  const [idMismatch, setIdMismatch] = useState(false);
  const [addressMismatch, setAddressMismatch] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingAddress, setUploadingAddress] = useState(false);

  const handleOpenVerifyModal = (row) => {
    // Ensure `id` exists on verifyRow (some sources use `userId`)
    setVerifyRow({ ...row, id: row.id ?? row.userId ?? row.user_id });
    setIdFile(null);
    setAddressFile(null);
    setIdMismatch(false);
    setAddressMismatch(false);
    setVerifyModalOpen(true);
  };

  // Listen for legacy/openVerificationModal events dispatched by global scripts
  useEffect(() => {
    function onOpenVerify(event) {
      const detail = (event && event.detail) || {};
      const userIdFromEvent = detail.userId ?? detail.id ?? detail;
      const userDetails = detail.userDetails ?? detail.user ?? null;
      if (!userIdFromEvent) return;

      const row = {
        id: userIdFromEvent,
        userId: userIdFromEvent,
        user_id: userIdFromEvent,
        username: userDetails?.username,
        name: userDetails?.username || `${userDetails?.first_name || ''} ${userDetails?.last_name || ''}`.trim() || userDetails?.name,
        first_name: userDetails?.first_name,
        last_name: userDetails?.last_name,
        email: userDetails?.email,
        phone: userDetails?.phone_number || userDetails?.phone,
      };

      setVerifyRow(row);
      setIdFile(null);
      setAddressFile(null);
      setIdMismatch(false);
      setAddressMismatch(false);
      setVerifyModalOpen(true);
    }

    window.addEventListener("openVerificationModal", onOpenVerify);
    // expose a direct hook for legacy code to call React directly
    // eslint-disable-next-line no-unused-expressions
    window.__openVerificationModalReact = (userId, userDetails) => onOpenVerify({ detail: { userId, userDetails } });

    return () => {
      window.removeEventListener("openVerificationModal", onOpenVerify);
      try {
        // cleanup global hook
        if (window.__openVerificationModalReact) delete window.__openVerificationModalReact;
      } catch (err) {
        // ignore
      }
    };
  }, []);


  const handleIdSelect = (e) => {
    const f = e.target.files?.[0] ?? null;
    setIdFile(f);
    setIdMismatch(false);
  };

  const handleAddressSelect = (e) => {
    const f = e.target.files?.[0] ?? null;
    setAddressFile(f);
    setAddressMismatch(false);
  };

  const handleUploadId = async () => {
    if (!idFile) {
      alert("Select ID proof first");
      return;
    }
    setUploadingId(true);
    try {
      console.log("Uploading ID for", verifyRow?.id, idFile.name);
      setTimeout(() => setUploadingId(false), 700);
    } catch {
      setUploadingId(false);
      alert("Upload failed");
    }
  };

  const handleUploadAddress = async () => {
    if (!addressFile) {
      alert("Select Address proof first");
      return;
    }
    setUploadingAddress(true);
    try {
      console.log("Uploading Address for", verifyRow?.id, addressFile.name);
      setTimeout(() => setUploadingAddress(false), 700);
    } catch {
      setUploadingAddress(false);
      alert("Upload failed");
    }
  };


  // Trading modal (NEW)
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [selectedTradingRow, setSelectedTradingRow] = useState(null);

  const handleTrading = (row) => {
    // open modal and pass row (so Trading modal can optionally filter by user)
    setSelectedTradingRow(row);
    setShowTradingModal(true);
  };

  // other row actions
  const handleDemo = (row) => {
    setDemoModalRow(row);
    setDemoModalVisible(true);
  };
  const handleTickets = (row) => {
    setTicketsRow(row);
    setTicketsModalVisible(true);
  };
  const handleProfile = (row) => {
    setEditProfileRow(row);
    setEditProfileModalVisible(true);
  };
  const handleBankCrypto = (row) => {
    setBankCryptoRow(row);
    setBankCryptoModalVisible(true);
  };
  const handleIbStatus = (row) => {
    setIbStatusRow(row);
    setIbStatusModalVisible(true);
  };

  const handleSaveBankCrypto = (data) => {
    console.log("Bank/Crypto save data for user id", bankCryptoRow?.id, data);
    // TODO: Call API to save bank/crypto details here
    setBankCryptoModalVisible(false);
    setBankCryptoRow(null);
  };
  const [changeStatusModalVisible, setChangeStatusModalVisible] = useState(false);
  const [changeStatusRow, setChangeStatusRow] = useState(null);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfileRow, setEditProfileRow] = useState(null);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRow, setHistoryRow] = useState(null);

  const [ticketsModalVisible, setTicketsModalVisible] = useState(false);
  const [ticketsRow, setTicketsRow] = useState(null);

  const [addTradingAccountModalVisible, setAddTradingAccountModalVisible] = useState(false);
  const [addTradingAccountRow, setAddTradingAccountRow] = useState(null);

  const [ibStatusModalVisible, setIbStatusModalVisible] = useState(false);
  const [ibStatusRow, setIbStatusRow] = useState(null);

  const handlePromote = (row) => {
    setChangeStatusRow(row);
    setChangeStatusModalVisible(true);
  };

  const handleStatusUpdate = (newStatus) => {
    console.log('Updated user', changeStatusRow?.id, 'to status:', newStatus);
    // TODO: Call API to update user status
    setChangeStatusModalVisible(false);
    setChangeStatusRow(null);
  };
  const handleSaveProfile = (profileData) => {
    console.log("Saving profile for user", editProfileRow?.id, profileData);
    // TODO: Call API to save profile data including image
    setEditProfileModalVisible(false);
    setEditProfileRow(null);
  };
  const handleDisable = async (row) => {
    console.log("Toggle user:", row?.id, "New status:", !row.isEnabled);
    // TODO: Call API to disable/enable user
    const newEnabled = !row.isEnabled;
    // Optimistically update UI
    setData(prevData =>
      prevData.map(user =>
        user.userId === row.userId ? { ...user, isEnabled: newEnabled } : user
      )
    );
    // Call API to actually enable/disable user
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      const response = await fetch(`/api/users/${row.userId}/status/`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ active: newEnabled }),
      });
      if (!response.ok) {
        throw new Error("Failed to update user status");
      }
      return newEnabled;
    } catch (err) {
      alert("Failed to update user status");
      // Optionally revert UI change if needed
      setData(prevData =>
        prevData.map(user =>
          user.userId === row.userId ? { ...user, isEnabled: row.isEnabled } : user
        )
      );
      throw err; // Re-throw to allow caller to handle
    }
  };
  const handleTransactions = (row) => {
    setHistoryRow(row);
    setHistoryModalVisible(true);
  };
  const handleAddAccount = (row) => {
    setAddTradingAccountRow(row);
    setAddTradingAccountModalVisible(true);
  };


  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRows.has(row.userId);

    const actionItems = [
      { icon: <ShieldCheck size={15} />, label: "Verify", onClick: () => handleOpenVerifyModal(row) },
      { icon: <LineChart size={15} />, label: "Trading", onClick: () => handleTrading(row) }, // changed to open modal
      { icon: <Gamepad2 size={15} />, label: "Demo", onClick: () => handleDemo(row) },
      { icon: <Ticket size={15} />, label: "Tickets", onClick: () => handleTickets(row) },
      { icon: <Award size={15} />, label: "IB Status", onClick: () => handleIbStatus(row) },
      { icon: <UserIcon size={15} />, label: "Profile", onClick: () => handleProfile(row) },
      { icon: <Landmark size={15} />, label: "Bank/Crypto", onClick: () => handleBankCrypto(row) },
      { icon: <ArrowUpCircle size={15} />, label: "Promote", onClick: () => handlePromote(row) },
      { icon: <Shuffle size={15} />, label: "Transactions", onClick: () => handleTransactions(row) },
      { icon: <PlusCircle size={15} />, label: "Add Account", onClick: () => handleAddAccount(row) },
    ];

    return (
      <tr style={{ height: isExpanded ? "auto" : "0px", overflow: "hidden", padding: 0, margin: 0, border: 0 }}>
        <td colSpan={columns.length} className="p-0 m-0 border-0">
          <div
            style={{
              maxHeight: isExpanded ? 120 : 0,
              overflow: "hidden",
              transition: "max-height 0.25s ease, opacity 0.25s ease",
              opacity: isExpanded ? 1 : 0,
            }}
            className={`${isDarkMode ? "bg-gray-900 text-yellow-400 border-t border-yellow-600" : "bg-white text-black border-t border-yellow-500"} rounded p-2 flex gap-4 flex-wrap items-center justify-between`}
          >
            <SubRowButtons actionItems={actionItems} />
            <div className="flex items-center gap-2 ml-auto">
              <span className={`text-sm font-semibold ${row.isEnabled ? "text-green-400" : "text-red-400"}`}>
                {row.isEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={() => handleDisable(row)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${row.isEnabled ? "bg-green-500" : "bg-red-500"
                  } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? "focus:ring-yellow-400" : "focus:ring-yellow-500"
                  }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-transform duration-300 ${row.isEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // classes
  const pageBg = isDarkMode ? "bg-black text-yellow-300" : "bg-white text-black";
  const inputBase = isDarkMode
    ? "bg-gray-800 text-yellow-200 border border-yellow-600 placeholder-yellow-500"
    : "bg-gray-50 text-black border border-gray-300 placeholder-gray-500";
  const modalBg = isDarkMode ? "bg-gray-900 text-yellow-300" : "bg-white text-black";
  const btnPrimary = "bg-yellow-500 text-black hover:bg-yellow-400";
  const btnGhost = isDarkMode ? "bg-gray-800 text-white border border-gray-700" : "bg-gray-100 text-black border border-gray-200";

  return (
    <div className={`p-4 min-h-screen ${pageBg} relative`}>
     {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[999] animate-pulse ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

  {/* Header */}
  <div className="mb-4 md:mb-0 md:absolute md:top-4 md:right-4 z-10 w-full md:w-auto">
    <button
      onClick={() => setShowAddModal(true)}
      className={`${btnPrimary} w-full md:w-auto px-6 py-2 rounded-lg font-semibold flex items-center justify-center gap-2`}
    >
      <PlusCircle size={16} />
      Add User
    </button>
  </div>

      {/* Table */}
      <TableStructure
        columns={columns}
        data={data}
        onRowClick={toggleRowExpanded}
        renderRowSubComponent={renderRowSubComponent}
        serverSide={true}
        onFetch={handleTableFetch}
        initialPageSize={10}
      />
      

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div
            className={`relative max-w-2xl w-full mx-4 rounded-lg shadow-xl ${modalBg} border ${isDarkMode ? "border-yellow-700" : "border-gray-200"}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? "#b8860b33" : "#eee" }}>
              <h3 className={`text-xl font-bold ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>Add New User</h3>
              <button className="p-1" onClick={() => setShowAddModal(false)} aria-label="Close add user">
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 text-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* form fields (same as before) */}
                <div>
                  <label htmlFor="first_name" className="block mb-1 text-xs font-semibold">Full Name:</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="Enter full name"
                    value={addForm.first_name}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-1 text-xs font-semibold">Email Address:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="user@example.com"
                    value={addForm.email}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="block mb-1 text-xs font-semibold">Phone Number:</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    placeholder="eg: 1234567890"
                    value={addForm.phone_number}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                  />
                </div>

                <div>
                  <label htmlFor="dob" className="block mb-1 text-xs font-semibold">Date Of Birth:</label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={addForm.dob}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block mb-1 text-xs font-semibold">Country:</label>
                  <select
                    id="country"
                    name="country"
                    value={addForm.country}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                  >
                    <option>Afghanistan</option>
                    <option>Albania</option>
                    <option>Algeria</option>
                    <option>Andorra</option>
                    <option>Angola</option>
                    <option>Argentina</option>
                    <option>Armenia</option>
                    <option>Australia</option>
                    <option>Austria</option>
                    <option>Azerbaijan</option>
                    <option>Bahamas</option>
                    <option>Bahrain</option>
                    <option>Bangladesh</option>
                    <option>Barbados</option>
                    <option>Belarus</option>
                    <option>Belgium</option>
                    <option>Belize</option>
                    <option>Benin</option>
                    <option>Bhutan</option>
                    <option>Bolivia</option>
                    <option>Bosnia and Herzegovina</option>
                    <option>Botswana</option>
                    <option>Brazil</option>
                    <option>Brunei</option>
                    <option>Bulgaria</option>
                    <option>Burkina Faso</option>
                    <option>Burundi</option>
                    <option>Cambodia</option>
                    <option>Cameroon</option>
                    <option>Canada</option>
                    <option>Cape Verde</option>
                    <option>Central African Republic</option>
                    <option>Chad</option>
                    <option>Chile</option>
                    <option>China</option>
                    <option>Colombia</option>
                    <option>Comoros</option>
                    <option>Congo</option>
                    <option>Costa Rica</option>
                    <option>Croatia</option>
                    <option>Cuba</option>
                    <option>Cyprus</option>
                    <option>Czech Republic</option>
                    <option>Denmark</option>
                    <option>Djibouti</option>
                    <option>Dominica</option>
                    <option>Dominican Republic</option>
                    <option>Ecuador</option>
                    <option>Egypt</option>
                    <option>El Salvador</option>
                    <option>Equatorial Guinea</option>
                    <option>Eritrea</option>
                    <option>Estonia</option>
                    <option>Ethiopia</option>
                    <option>Fiji</option>
                    <option>Finland</option>
                    <option>France</option>
                    <option>Gabon</option>
                    <option>Gambia</option>
                    <option>Georgia</option>
                    <option>Germany</option>
                    <option>Ghana</option>
                    <option>Greece</option>
                    <option>Grenada</option>
                    <option>Guatemala</option>
                    <option>Guinea</option>
                    <option>Guinea-Bissau</option>
                    <option>Guyana</option>
                    <option>Haiti</option>
                    <option>Honduras</option>
                    <option>Hungary</option>
                    <option>Iceland</option>
                    <option>India</option>
                    <option>Indonesia</option>
                    <option>Iran</option>
                    <option>Iraq</option>
                    <option>Ireland</option>
                    <option>Israel</option>
                    <option>Italy</option>
                    <option>Ivory Coast</option>
                    <option>Jamaica</option>
                    <option>Japan</option>
                    <option>Jordan</option>
                    <option>Kazakhstan</option>
                    <option>Kenya</option>
                    <option>Kiribati</option>
                    <option>Kosovo</option>
                    <option>Kuwait</option>
                    <option>Kyrgyzstan</option>
                    <option>Laos</option>
                    <option>Latvia</option>
                    <option>Lebanon</option>
                    <option>Lesotho</option>
                    <option>Liberia</option>
                    <option>Libya</option>
                    <option>Liechtenstein</option>
                    <option>Lithuania</option>
                    <option>Luxembourg</option>
                    <option>Madagascar</option>
                    <option>Malawi</option>
                    <option>Malaysia</option>
                    <option>Maldives</option>
                    <option>Mali</option>
                    <option>Malta</option>
                    <option>Marshall Islands</option>
                    <option>Mauritania</option>
                    <option>Mauritius</option>
                    <option>Mexico</option>
                    <option>Micronesia</option>
                    <option>Moldova</option>
                    <option>Monaco</option>
                    <option>Mongolia</option>
                    <option>Montenegro</option>
                    <option>Morocco</option>
                    <option>Mozambique</option>
                    <option>Myanmar</option>
                    <option>Namibia</option>
                    <option>Nauru</option>
                    <option>Nepal</option>
                    <option>Netherlands</option>
                    <option>New Zealand</option>
                    <option>Nicaragua</option>
                    <option>Niger</option>
                    <option>Nigeria</option>
                    <option>North Korea</option>
                    <option>North Macedonia</option>
                    <option>Norway</option>
                    <option>Oman</option>
                    <option>Pakistan</option>
                    <option>Palau</option>
                    <option>Palestine</option>
                    <option>Panama</option>
                    <option>Papua New Guinea</option>
                    <option>Paraguay</option>
                    <option>Peru</option>
                    <option>Philippines</option>
                    <option>Poland</option>
                    <option>Portugal</option>
                    <option>Qatar</option>
                    <option>Romania</option>
                    <option>Russia</option>
                    <option>Rwanda</option>
                    <option>Saint Kitts and Nevis</option>
                    <option>Saint Lucia</option>
                    <option>Saint Vincent and the Grenadines</option>
                    <option>Samoa</option>
                    <option>San Marino</option>
                    <option>Sao Tome and Principe</option>
                    <option>Saudi Arabia</option>
                    <option>Senegal</option>
                    <option>Serbia</option>
                    <option>Seychelles</option>
                    <option>Sierra Leone</option>
                    <option>Singapore</option>
                    <option>Slovakia</option>
                    <option>Slovenia</option>
                    <option>Solomon Islands</option>
                    <option>Somalia</option>
                    <option>South Africa</option>
                    <option>South Korea</option>
                    <option>South Sudan</option>
                    <option>Spain</option>
                    <option>Sri Lanka</option>
                    <option>Sudan</option>
                    <option>Suriname</option>
                    <option>Sweden</option>
                    <option>Switzerland</option>
                    <option>Syria</option>
                    <option>Taiwan</option>
                    <option>Tajikistan</option>
                    <option>Tanzania</option>
                    <option>Thailand</option>
                    <option>Timor-Leste</option>
                    <option>Togo</option>
                    <option>Tonga</option>
                    <option>Trinidad and Tobago</option>
                    <option>Tunisia</option>
                    <option>Turkey</option>
                    <option>Turkmenistan</option>
                    <option>Tuvalu</option>
                    <option>Uganda</option>
                    <option>Ukraine</option>
                    <option>United Arab Emirates</option>
                    <option>United Kingdom</option>
                    <option>United States</option>
                    <option>Uruguay</option>
                    <option>Uzbekistan</option>
                    <option>Vanuatu</option>
                    <option>Vatican City</option>
                    <option>Venezuela</option>
                    <option>Vietnam</option>
                    <option>Yemen</option>
                    <option>Zambia</option>
                    <option>Zimbabwe</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address" className="block mb-1 text-xs font-semibold">Address:</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Street address (optional)"
                    value={addForm.address}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full`}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="block mb-1 text-xs font-semibold">Password:</label>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter secure password"
                    value={addForm.password}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute right-2 top-7 text-gray-500"
                    aria-label="Toggle password visibility"
                  >
                    {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <label htmlFor="confirmPassword" className="block mb-1 text-xs font-semibold">Confirm Password:</label>
                  <input
                    type={confirmVisible ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={addForm.confirmPassword}
                    onChange={handleAddInput}
                    className={`${inputBase} p-2 rounded w-full pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmVisible((v) => !v)}
                    className="absolute right-2 top-7 text-gray-500"
                    aria-label="Toggle confirm password visibility"
                  >
                    {confirmVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setShowAddModal(false)} className={`px-4 py-2 rounded ${btnGhost}`}>
                  Cancel
                </button>
                <button type="submit" className={`px-4 py-2 rounded ${btnPrimary}`}>
                  <div className="flex items-center gap-2"><PlusCircle size={16} /> Create User</div>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Modal (keeps your Verify component usage) */}
      {verifyModalOpen && verifyRow && (
        <Verify
          isDarkMode={isDarkMode}
          modalBg={modalBg}
          btnGhost={btnGhost}
          verifyRow={verifyRow}
          idFile={idFile}
          addressFile={addressFile}
          idMismatch={idMismatch}
          addressMismatch={addressMismatch}
          uploadingId={uploadingId}
          uploadingAddress={uploadingAddress}
          setVerifyModalOpen={setVerifyModalOpen}
          handleIdSelect={handleIdSelect}
          handleAddressSelect={handleAddressSelect}
          handleUploadId={handleUploadId}
          handleUploadAddress={handleUploadAddress}
        />
      )}

      {/* Trading Modal (large full-screen style) */}
      {showTradingModal && (
        <TradingAccountModal
          visible={showTradingModal}
          onClose={() => {
            setShowTradingModal(false);
            setSelectedTradingRow(null);
          }}
          userId={selectedTradingRow?.userId}
        />
      )}

      {/* Demo Modal */}
      {demoModalVisible && demoModalRow && (
        <DemoAccountModal
          isOpen={demoModalVisible}
          onClose={() => {
            setDemoModalVisible(false);
            setDemoModalRow(null);
          }}
          isDarkMode={isDarkMode}
          userRow={demoModalRow}
        />
      )}

      {/* BankCrypto Modal */}
      {bankCryptoModalVisible && bankCryptoRow && (
        <BankCryptoModal
          visible={bankCryptoModalVisible}
          onClose={() => {
            setBankCryptoModalVisible(false);
            setBankCryptoRow(null);
          }}
          initialData={bankCryptoRow}
          onSave={handleSaveBankCrypto}
          userId={bankCryptoRow.userId}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ChangeStatus Modal */}
      {changeStatusModalVisible && changeStatusRow && (
        <ChangeStatusModal
          isOpen={changeStatusModalVisible}
          onClose={() => {
            setChangeStatusModalVisible(false);
            setChangeStatusRow(null);
          }}
          onUpdate={handleStatusUpdate}
          userRow={changeStatusRow}
          isDarkMode={isDarkMode}
          modalBg={modalBg}
          btnGhost={btnGhost}
        />
      )}

      {/* Edit Profile Modal */}
      {editProfileModalVisible && editProfileRow && (
        <EditProfileModal
          visible={editProfileModalVisible}
          onClose={() => {
            setEditProfileModalVisible(false);
            setEditProfileRow(null);
          }}
          userId={editProfileRow.userId}
          onSave={handleSaveProfile}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Transactions Modal */}
      {historyModalVisible && historyRow && (
        <Transactions
          visible={historyModalVisible}
          onClose={() => {
            setHistoryModalVisible(false);
            setHistoryRow(null);
          }}
          accountId={historyRow?.userId}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Tickets Modal */}
      {ticketsModalVisible && ticketsRow && (
        <TicketsModal
          visible={ticketsModalVisible}
          onClose={() => {
            setTicketsModalVisible(false);
            setTicketsRow(null);
          }}
          userName={ticketsRow?.name}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Add Trading Account Modal */}
      {addTradingAccountModalVisible && addTradingAccountRow && (
        <AddTradingAccountModal
          visible={addTradingAccountModalVisible}
          onClose={() => {
            setAddTradingAccountModalVisible(false);
            setAddTradingAccountRow(null);
          }}
          userName={addTradingAccountRow?.name}
          isDarkMode={isDarkMode}
          userId ={addTradingAccountRow?.userId}
        />
      )}

      {/* IB Status Modal */}
      {ibStatusModalVisible && ibStatusRow && (
        <IbStatusModal
          visible={ibStatusModalVisible}
          onClose={() => {
            setIbStatusModalVisible(false);
            setIbStatusRow(null);
          }}
          userRow={ibStatusRow}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default User;
