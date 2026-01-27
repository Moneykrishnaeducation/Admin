import React, { useState, useEffect, useCallback } from "react";
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
  const [commissionProfiles, setCommissionProfiles] = useState([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState({}); // Maps IB request ID to selected profile name

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const [commissionWithdrawalModalVisible, setCommissionWithdrawalModalVisible] = useState(false);
  const [selectedCommissionWithdrawal, setSelectedCommissionWithdrawal] = useState(null);

  // -------------------- Data loader with pagination --------------------
  const handleFetchTabData = useCallback(async ({ page = 1, pageSize = 10, query = "" }) => {
    try {
      const apiEndpoints = {
        "IB Requests": "admin/ib-requests/",
        "Bank Details": "admin/bank-detail-requests/",
        "Profile Changes": "admin/profile-change-requests/",
        "Document Requests": "admin/document-requests/",
        "Crypto Details": "admin/crypto-details/",
        "Pending Deposits": "admin/pending-deposits/",
        "Pending Withdrawals": "admin/pending-withdrawals/",
        "Commission Withdrawals": "admin/pending-withdrawal-requests/",
      };
      const endpoint = apiEndpoints[activeTab];
      if (!endpoint) {
        return { data: [], total: 0 };
      }

      // Build URL with pagination parameters
      const urlWithPagination = `${endpoint}?page=${page}&page_size=${pageSize}`;

      // Assuming 'get' utility correctly prepends API_BASE and handles headers
      const response = await get(urlWithPagination);

      let respData = response;
      let dataArray = [];
      let totalCount = 0;

      // Logic to extract the array from common API response shapes
      if (Array.isArray(respData)) {
        dataArray = respData;
      } else if (respData && typeof respData === "object") {
        if (Array.isArray(respData.results)) {
          dataArray = respData.results;
          totalCount = respData.total || 0;
        } else if (Array.isArray(respData.data)) {
          dataArray = respData.data;
          totalCount = respData.total || 0;
        } else {
          const values = Object.values(respData).find(val => Array.isArray(val));
          if (values) {
            dataArray = values;
          } else {
            dataArray = [];
          }
        }
      }

      return { data: dataArray, total: totalCount };
    } catch (error) {
      console.error("Error loading tab data:", error);
      return { data: [], total: 0 };
    }
  }, [activeTab]);

  // Clear selected profiles when tab changes
  useEffect(() => {
    setSelectedProfiles({});
  }, [activeTab]);

  // Clear selected profiles when data is refetched
  useEffect(() => {
    setSelectedProfiles({});
  }, [refetchTrigger]);


  // Run once on page load
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await get("commissioning-profiles/");
        if (Array.isArray(response)) {
          setCommissionProfiles(response);
        }
      } catch (err) {
        // ignore
      }
    };
    loadProfiles();
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
        if (action === "approve") {
          // For IB requests, use the selected profile from the dropdown
          const selectedProfile = selectedProfiles[id];
          if (!selectedProfile) {
            alert("Please select a commissioning profile before approving");
            return;
          }
          bodyData = JSON.stringify({ status: "approved", profile_name: selectedProfile });
        } else {
          bodyData = JSON.stringify({ status: "rejected" });
        }
        method = 'PATCH';
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
        // Trigger a re-fetch by incrementing the refetch counter
        setRefetchTrigger(prev => prev + 1);
      } else {
        alert(`Failed to ${action} request ${id}. Check console for backend error details.`);
      }
    } catch (error) {
      alert(`Error: Failed to ${action} request ${id}`);
    }
  };


  const defaultColumns = [
    { Header: "ID", accessor: "request_id" },
    { Header: "User Id", accessor: "user_id" },
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
      Cell: (cellValue, row) => {
        const rowId = row.original?.request_id || row.request_id;
        return (
          <select
            className={`border px-2 py-1 rounded ${isDarkMode ? "bg-gray-900" : "bg-white text-black"
              }`}
            value={selectedProfiles[rowId] || ""}
            onChange={(e) => {
              setSelectedProfiles(prev => ({
                ...prev,
                [rowId]: e.target.value
              }));
            }}
          >
            <option value="">Select a profile</option>
            {commissionProfiles.map((profile) => {
              const profileName = profile.profileName || profile.displayText || profile.name || "";
              const profileId = profile.profileId || profile.id || "";
              return (
                <option key={profileId || profileName} value={profileName}>
                  {profileName}
                </option>
              );
            })}
          </select>
        );
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => {
        const rowId = row.original?.request_id || row.request_id;
        return (
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "approve", activeTab)}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "reject", activeTab)}
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];
  // -------------------- Crypto Details Columns --------------------
  const cryptoDetailsColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "User Id", accessor: "user_id" },
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
      Cell: (cellValue, row) => {
        const rowId = row.original?.id || row.id;
        return (
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "approve", activeTab)}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "reject", activeTab)}
            >
              Reject
            </button>
          </div>
        );
      },
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
    { Header: "ID", accessor: "id" },
    { Header: "User Id", accessor: "user_id" },
    { Header: "User Name", accessor: "user_name" },
    { Header: "Email", accessor: "email" },
    { Header: "Bank Name", accessor: "bank_name" },
    { Header: "Account Number", accessor: "account_number" },
    { Header: "Branch", accessor: "branch_name" },
    { Header: "IFSC Code", accessor: "ifsc_code" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => {
        const rowId = row.original?.id || row.id;
        return (
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "approve", activeTab)}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "reject", activeTab)}
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  // -------------------- Document Requests Columns --------------------
  const documentRequestsColumns = [
    { Header: "ID", accessor: "id" },
    { Header: "User Id", accessor: "user_id" },
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
      Cell: (cellValue, row) => {
        const rowId = row.original?.id || row.id;
        return (
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "approve", activeTab)}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded"
              onClick={() => handleAction(rowId, "reject", activeTab)}
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];



  // -------------------- Tab switching --------------------
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // TableStructure will automatically fetch data via onFetch when activeTab changes
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
          key={`table-${activeTab}-${refetchTrigger}`}
          columns={columns}
          data={[]}
          serverSide={true}
          onFetch={handleFetchTabData}
          initialPageSize={10}
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