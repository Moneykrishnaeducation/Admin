import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import ErrorBoundary from "../commonComponent/ErrorBoundary";
import PendingDepositModal from "../Modals/PendingDepositModal";
import PendingWithdrawalModal from "../Modals/PendingWithdrawalModal";
import PendingCommissionModal from "../Modals/PendingCommissionModal";
import { get } from "../utils/api-config"; // backend GET
import { useTheme } from "../context/ThemeContext";

const PendingRequest = () => {
  let {isDarkMode} = useTheme();
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

  // Mapping of tab to API endpoint for loading data
  const apiEndpoints = {
    "IB Requests": "api/admin/ib-requests/?page=1&pageSize=5",
    "Bank Details": "api/admin/bank-detail-requests/?page=1&pageSize=5",
    "Profile Changes": "api/admin/profile-change-requests/?page=1&pageSize=5",
    "Document Requests": "api/admin/document-requests/?page=1&pageSize=5",
    "Crypto Details": "api/admin/crypto-details/?page=1&pageSize=5",
    "Pending Deposits": "api/admin/pending-deposits/",
    "Pending Withdrawals": "api/admin/pending-withdrawals/",
    "Commission Withdrawals": "api/admin/pending-withdrawal-requests/",
  };

  const [activeTab, setActiveTab] = useState(""); // start with no tab selected
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
      const response = await get("commissioning-profiles/");
      if (Array.isArray(response)) {
        setCommissionProfiles(response);
      } else {
        console.error("Unexpected profiles response:", response);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    }
  };

  // Run once on page load
  useEffect(() => {
    fetchCommissionProfiles();
  }, []);
  const handleAction = (id, action) => {
    alert(`User ${id} has been ${action}`);
  };

  const defaultColumns = [
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "useremail" },
    { Header: "Created At", accessor: "created_at" },
    {
      Header: "Commissioning Profile",
      accessor: "commissionProfile",
      Cell: (cellValue, _row) => {
        const rowId = _row?.id;
        return (
          <select
            className={`border px-2 py-1 rounded  ${
              isDarkMode ? "bg-gray-900  " : "bg-white text-black"
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
            onClick={() => handleAction(row.id, "approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "rejected")}
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
    { Header: "Created At", accessor: "created_at" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "rejected")}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Pending Deposit Columns --------------------
  const pendingDepositsColumns = [
    { Header: "Date/Time", accessor: "created_at" },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "trading_account_id" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "transaction_type_display" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            setSelectedDeposit(row);
            setModalVisible(true);
          }}
        >
          View
        </button>
      ),
    },
  ];

  // -------------------- Pending Withdrawals Columns --------------------
  const pendingWithdrawalsColumns = [
    { Header: "Date/Time", accessor: "created_at" },
    { Header: "User Name", accessor: "username" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "trading_account_id" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "transaction_type_display" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            setSelectedWithdrawal(row);
            setWithdrawalModalVisible(true);
          }}
        >
          View
        </button>
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
            onClick={() => handleAction(row.id, "approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "rejected")}
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
    { Header: "Created At", accessor: "created_at" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => {
            setSelectedCommissionWithdrawal(row);
            setCommissionWithdrawalModalVisible(true);
          }}
        >
          View
        </button>
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
            onClick={() => handleAction(row.id, "approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "rejected")}
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
    { Header: "Uploaded At", accessor: "uploaded_at" },
    {
      Header: "Actions",
      accessor: "actions",
      Cell: (cellValue, row) => (
        <div className="flex gap-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleAction(row.id, "rejected")}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  // -------------------- Handle actions --------------------
 

  const handleApprove = (id) => {
    alert(`User ${id} has been approved`);
    setModalVisible(false);
  };

  const handleReject = (id) => {
    alert(`User ${id} has been rejected`);
    setModalVisible(false);
  };

  // -------------------- Simulated data loader --------------------
  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      const endpoint = apiEndpoints[tab];
      if (!endpoint) {
        setTableData([]);
        setLoading(false);
        return;
      }
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error("No access token found in localStorage");
        setTableData([]);
        setLoading(false);
        return;
      }
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${tab}`);
      }
      const respData = await response.json();
      console.log(`[PendingRequest] Data received for tab "${tab}":`, respData);
      // Ensure data is an array before setting state for TableStructure
      let dataArray = [];
      if (Array.isArray(respData)) {
        dataArray = respData;
      } else if (respData && typeof respData === "object") {
        // Look for likely data array in response object
        if (Array.isArray(respData.results)) {
          dataArray = respData.results;
        } else if (Array.isArray(respData.data)) {
          dataArray = respData.data;
        } else {
          // fallback: try to get values array from object
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
      console.error("Error loading tab data:", error);
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
    <div className="p-4">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleTabClick(btn)}
            className={`px-4 py-2 rounded-md font-semibold ${
              activeTab === btn
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
          pageSizeOptions={[5, 10, 20]}
          onRowClick={(row) => console.log("Clicked row", row.id)}
        />
      </ErrorBoundary>

      {/* Modals */}
      <PendingDepositModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        depositData={selectedDeposit}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <PendingWithdrawalModal
        visible={withdrawalModalVisible}
        onClose={() => setWithdrawalModalVisible(false)}
        withdrawalData={selectedWithdrawal}
        onApprove={(id) => {
          alert(`User ${id} withdrawal has been approved`);
          setWithdrawalModalVisible(false);
        }}
        onReject={(id) => {
          alert(`User ${id} withdrawal has been rejected`);
          setWithdrawalModalVisible(false);
        }}
      />

      <PendingCommissionModal
        visible={commissionWithdrawalModalVisible}
        onClose={() => setCommissionWithdrawalModalVisible(false)}
        commissiondata={selectedCommissionWithdrawal}
        onApprove={(id) => {
          alert(`User ${id} commission withdrawal has been approved`);
          setCommissionWithdrawalModalVisible(false);
        }}
        onReject={(id) => {
          alert(`User ${id} commission withdrawal has been rejected`);
          setCommissionWithdrawalModalVisible(false);
        }}
      />

      {loading && (
        <div className="mt-2 text-yellow-400 font-semibold">Loading...</div>
      )}
    </div>
  );
};

export default PendingRequest;
