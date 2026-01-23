import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import ErrorBoundary from "../commonComponent/ErrorBoundary";
import PendingDepositModal from "../Modals/PendingDepositModal";
import PendingWithdrawalModal from "../Modals/PendingWithdrawalModal";
import PendingCommissionModal from "../Modals/PendingCommissionModal";
import { get, API_BASE } from "../utils/api-config"; // backend GET utility and API_BASE
import { useTheme } from "../context/ThemeContext";

// Date formatting utility
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}:${month}:${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return "N/A";
  }
};

const PendingRequest = () => {
  let { isDarkMode } = useTheme();
  const buttons = [
    "IB Requests",
    "Bank Details",
    "Profile Changes",
    "Document Requests",
    "Crypto Details",
    "Pending Deposits",
    "Pending Withdrawals",
    "Commission Withdrawals",
  ];

  // Mapping of tab to API endpoint for loading data (list GET endpoints)
  const apiEndpoints = {
    "IB Requests": "admin/ib-requests/?page=1&pageSize=5",
    "Bank Details": "admin/bank-detail-requests/?page=1&pageSize=5",
    "Profile Changes": "admin/profile-change-requests/?page=1&pageSize=5",
    "Document Requests": "admin/document-requests/?page=1&pageSize=5",
    "Crypto Details": "admin/crypto-details/?page=1&pageSize=5",
    "Pending Deposits": "admin/pending-deposits/",
    "Pending Withdrawals": "admin/pending-withdrawals/",
    "Commission Withdrawals": "admin/pending-withdrawal-requests/",
  };

  // Mapping of tab to approve/reject endpoint base path (action POST endpoints)
  const approveRejectEndpoints = {
    "IB Requests": "admin/ib-request",
    "Bank Details": "admin/bank-detail-request",
    "Profile Changes": "admin/profile-change-request",
    "Document Requests": "admin/document-request",
    "Crypto Details": "admin/crypto-detail",
    "Pending Deposits": "admin/transaction", // Transactions (Deposits/Withdrawals) use this base
    "Pending Withdrawals": "admin/transaction",
    "Commission Withdrawals": "admin/transaction",
  };

  const [activeTab, setActiveTab] = useState("IB Requests");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [commissionProfiles, setCommissionProfiles] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const [commissionWithdrawalModalVisible, setCommissionWithdrawalModalVisible] = useState(false);
  const [selectedCommissionWithdrawal, setSelectedCommissionWithdrawal] = useState(null);

  // Fetch commissioning profiles
  const fetchCommissionProfiles = async () => {
    try {
      // Assuming 'get' utility prepends API_BASE
      const response = await get("commissioning-profiles/");
      if (Array.isArray(response)) {
        setCommissionProfiles(response);
      }
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab) {
      loadTabData(activeTab);
    }
  }, []);


  // Run once on page load
  useEffect(() => {
    fetchCommissionProfiles();
  }, []);

  // -------------------- Handle actions --------------------
  const handleAction = async (id, action, tab) => {
    if (!tab) {
      alert("Please select a tab first");
      return;
    }
    try {
      let endpointBase = `${approveRejectEndpoints[tab]}`;
      let fullEndpoint = '';
      let bodyData = undefined;
      let method = 'POST';

      // Special case for 'IB Requests' which uses the ID directly (path('api/admin/ib-request/<int:id>/'))
      // and sends the status in the body via PATCH method.
      if (tab === "IB Requests") {
        fullEndpoint = `${endpointBase}/${id}/`;
        // Find the row data to get the selected commissioning profile
        const row = tableData.find(item => item.id === id);
        if (!row) {
          alert("Request data not found");
          return;
        }
        if (action === "approve") {
          const selectedProfile = row.commissionProfile;
          if (!selectedProfile) {
            alert("Please select a commissioning profile before approving.");
            return;
          }
          bodyData = JSON.stringify({ status: "approved", profile_name: selectedProfile });
        } else {
          bodyData = JSON.stringify({ status: "rejected" });
        }
        method = 'PATCH'; // Use PATCH for IB Requests as per backend
      }
      // Special cases for Profile Changes, Document Requests, Bank Details, and Crypto Details which use PATCH method
      else if (tab === "Profile Changes" || tab === "Document Requests" || tab === "Bank Details" || tab === "Crypto Details") {
        // Concatenates the base path, ID, and action (e.g., admin/profile-change-request/123/approve/)
        fullEndpoint = `${endpointBase}/${id}/${action}/`;
        method = 'PATCH'; // Use PATCH for Profile Changes, Document Requests, Bank Details, and Crypto Details as per backend
      }
      // All other requests use the explicit URL patterns like:
      // path('api/admin/bank-detail-request/<int:id>/approve/')
      else {
        // Concatenates the base path, ID, and action (e.g., admin/bank-detail-request/123/approve/)
        fullEndpoint = `${endpointBase}/${id}/${action}/`;
      }

      const fullUrl = `${API_BASE}/${fullEndpoint}`;

      const response = await fetch(fullUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Send cookies automatically (includes jwt_token)
        body: bodyData,
      });

      if (response.ok) {
        const actionPast = action === "approve" ? "approved" : "rejected";
        alert(`Request ${id} in ${tab} has been ${actionPast}`);
        loadTabData(tab); // Reload list data after action success
      } else {
        const errorText = await response.text();
        alert(`Failed to ${action} request ${id}. Check console for backend error details.`);
      }
    } catch (error) {
      alert(`Error: Failed to ${action} request ${id}`);
    }
  };


  const defaultColumns = [
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "useremail" },
    {
      Header: "Created At",
      accessor: "created_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    {
      Header: "Commissioning Profile",
      accessor: "commissionProfile",
      Cell: (cellValue, _row) => {
        const rowId = _row?.id;
        return (
          <select
            className={`border px-2 py-1 rounded ${isDarkMode ? "bg-gray-900" : "bg-white text-black"
              }`}
            value={cellValue || ""}
            onChange={(e) =>
              setTableData((prev) =>
                prev.map((item) =>
                  item.id === rowId
                    ? { ...item, commissionProfile: e.target.value }
                    : item
                )
              )
            }
          >
            <option value="">Select the profile</option>
            {commissionProfiles.map((p) => (
              <option key={p.profileId} value={p.profileName}>
                {p.profileId} - {p.profileName}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approve", activeTab)}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "reject", activeTab)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];
  // -------------------- Crypto Details Columns --------------------
  const cryptoDetailsColumns = [
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "user_name" },
    { Header: "Email", accessor: "email" },
    { Header: "Wallet Address", accessor: "wallet_address" },
    { Header: "Exchange", accessor: "exchange" },
    {
      Header: "Created At",
      accessor: "created_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approve", activeTab)}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "reject", activeTab)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Pending Deposit Columns --------------------
  const pendingDepositsColumns = [
    {
      Header: "Date/Time",
      accessor: "created_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "trading_account_id" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "transaction_type_display" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => {
              setSelectedDeposit(row);
              setModalVisible(true);
            }}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Pending Withdrawals Columns --------------------
  const pendingWithdrawalsColumns = [
    {
      Header: "Date/Time",
      accessor: "created_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "trading_account_id" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "transaction_type_display" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => {
              setSelectedWithdrawal(row);
              setWithdrawalModalVisible(true);
            }}
          >
            View
          </button>

        </div>
      ),
    },
  ];

  // -------------------- Profile Changes Columns --------------------
  const profileChangesColumns = [
    { Header: "User Id", accessor: "user_id" },
    { Header: "User Name", accessor: "user_name" },
    { Header: "Email", accessor: "email" },
    {
      Header: "Requested Changes",
      accessor: "requested_changes",
      Cell: (cellValue) => {
        if (typeof cellValue === "object" && cellValue !== null) {
          return (
            <div>
              {Object.entries(cellValue).map(([key, value]) => (
                <div key={key}>
                  <strong>{key.replace(/_/g, " ").toUpperCase()}:</strong> {String(value)}
                </div>
              ))}
            </div>
          );
        }
        return String(cellValue);
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approve", activeTab)}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "reject", activeTab)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Commission Withdrawals Columns --------------------
  const commissionWithdrawalsColumns = [
    { Header: "Transaction ID", accessor: "id" },
    { Header: "User Name", accessor: "username" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "trading_account_id" },
    { Header: "Type", accessor: "transaction_type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
    {
      Header: "Created At",
      accessor: "created_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => {
              setSelectedCommissionWithdrawal(row);
              setCommissionWithdrawalModalVisible(true);
            }}
          >
            View
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Bank Details Columns --------------------
  const bankDetailsColumns = [
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "user_name" },
    { Header: "Email", accessor: "email" },
    { Header: "Bank Name", accessor: "bank_name" },
    { Header: "Account Number", accessor: "account_number" },
    { Header: "Branch", accessor: "branch_name" },
    { Header: "IFSC Code", accessor: "ifsc_code" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approve", activeTab)}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "reject", activeTab)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Document Requests Columns --------------------
  const documentRequestsColumns = [
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "user_name" },
    { Header: "Email", accessor: "email" },
    {
      Header: "Id Proof",
      accessor: "id_proof",
      Cell: (cellValue) => {
        if (typeof cellValue === "string" && cellValue) {
          return (
            <button
              className="text-blue-600 underline"
              onClick={() => window.open(cellValue, '_blank')}
            >
              View
            </button>
          );
        }
        return "N/A";
      },
    },
    {
      Header: "Address Proof",
      accessor: "address_proof",
      Cell: (cellValue) => {
        if (typeof cellValue === "string" && cellValue) {
          return (
            <button
              className="text-blue-600 underline"
              onClick={() => window.open(cellValue, '_blank')}
            >
              View
            </button>
          );
        }
        return "N/A";
      },
    },
    {
      Header: "Uploaded At",
      accessor: "uploaded_at",
      Cell: (cellValue) => formatDateTime(cellValue),
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approve", activeTab)}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "reject", activeTab)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];



  // -------------------- Data loader --------------------
  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      const endpoint = apiEndpoints[tab];
      if (!endpoint) {
        setTableData([]);
        setLoading(false);
        return;
      }
      // Assuming 'get' utility correctly prepends API_BASE and handles headers
      const response = await get(endpoint);

      let respData = response;
      let dataArray = [];

      // Logic to extract the array from common API response shapes
      if (Array.isArray(respData)) {
        dataArray = respData;
      } else if (respData && typeof respData === "object") {
        if (Array.isArray(respData.results)) {
          dataArray = respData.results;
        } else if (Array.isArray(respData.data)) {
          dataArray = respData.data;
        } else {
          const values = Object.values(respData).find(val => Array.isArray(val));
          if (values) {
            dataArray = values;
          } else {
            dataArray = [];
          }
        }
      }
      setTableData(dataArray);
    } catch (error) {
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  // Pick correct columns for selected tab
  const columns =
    activeTab === "Bank Details"
      ? bankDetailsColumns
      : activeTab === "Pending Deposits"
        ? pendingDepositsColumns
        : activeTab === "Pending Withdrawals"
          ? pendingWithdrawalsColumns
          : activeTab === "Commission Withdrawals"
            ? commissionWithdrawalsColumns
            : activeTab === "Profile Changes"
              ? profileChangesColumns
              : activeTab === "Document Requests"
                ? documentRequestsColumns
                : activeTab === "Crypto Details"
                  ? cryptoDetailsColumns
                  : defaultColumns;

  return (
    <div className="px-4">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleTabClick(btn)}
            className={`md:px-4 md:py-2 p-2 rounded-md font-semibold w-full transition-all ${activeTab === btn
                ? "bg-yellow-400 text-black"
                : "bg-gray-200 dark:bg-gray-700 dark:text-white text-black"
              }`}
          >
            {btn}
          </button>
        ))}
      </div>


      {/* Table */}
      <ErrorBoundary>
        <TableStructure
          columns={columns}
          data={tableData}
          serverSide={false}
          initialPageSize={5}
          isLoading={loading}
          pageSizeOptions={[5, 10, 20]}
        />
      </ErrorBoundary>

      {/* Modals */}
      <PendingDepositModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        depositData={selectedDeposit}
        onApprove={(id) => {
          handleAction(id, "approve", activeTab);
          setModalVisible(false);
        }}
        onReject={(id) => {
          handleAction(id, "reject", activeTab);
          setModalVisible(false);
        }}
      />


      <PendingWithdrawalModal
        visible={withdrawalModalVisible}
        onClose={() => setWithdrawalModalVisible(false)}
        withdrawalData={selectedWithdrawal}
        onApprove={(id) => {
          handleAction(id, "approve", activeTab);
          setWithdrawalModalVisible(false);
        }}
        onReject={(id) => {
          handleAction(id, "reject", activeTab);
          setWithdrawalModalVisible(false);
        }}
      />

      <PendingCommissionModal
        visible={commissionWithdrawalModalVisible}
        onClose={() => setCommissionWithdrawalModalVisible(false)}
        commissiondata={selectedCommissionWithdrawal}
        onApprove={(id) => {
          handleAction(id, "approve", activeTab);
          setCommissionWithdrawalModalVisible(false);
        }}
        onReject={(id) => {
          handleAction(id, "reject", activeTab);
          setCommissionWithdrawalModalVisible(false);
        }}
      />

      
    </div>
  );
};

export default PendingRequest;