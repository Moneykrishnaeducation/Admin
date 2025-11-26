import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import ErrorBoundary from "../commonComponent/ErrorBoundary";
import PendingDepositModal from "../Modals/PendingDepositModal";
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
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Created At", accessor: "createdAt" },
    {
      Header: "Commissioning Profile",
      accessor: "commissionProfile",
      Cell: (cellValue, row) => (
        <select
          className={`border px-2 py-1 rounded  ${
          isDarkMode ? "bg-gray-900  " : "bg-white text-black"
          }`}
          value={cellValue || ""}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.id === row.id
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
      ),
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
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Wallet Address", accessor: "walletAddress" },
    { Header: "Exchange", accessor: "exchange" },
    { Header: "Created At", accessor: "createdAt" },
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
    { Header: "Date/Time", accessor: "dateTime" },
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "accountId" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "paymentMethod" },
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
    { Header: "Date/Time", accessor: "dateTime" },
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "accountId" },
    { Header: "Amount (USD)", accessor: "amount" },
    { Header: "Payment Method", accessor: "paymentMethod" },
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
    { Header: "User Id", accessor: "id" },
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Requested Changes", accessor: "requestedChanges" },
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
    { Header: "Transaction ID", accessor: "transactionId" },
    { Header: "User Name", accessor: "name" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Type", accessor: "type" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
    { Header: "Created At", accessor: "createdAt" },
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
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Bank Name", accessor: "bankName" },
    { Header: "Account Number", accessor: "accountNumber" },
    { Header: "Branch", accessor: "branch" },
    { Header: "IFSC Code", accessor: "ifscCode" },
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
    { Header: "User Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Document Type", accessor: "documentType" },
    {
      Header: "ID Proof",
      accessor: "idProof",
      Cell: (cellValue, row) => (
        <a
          href={cellValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View
        </a>
      ),
    },
    { Header: "Address Proof", accessor: "addressProof" },
    { Header: "Uploaded At", accessor: "uploadedAt" },
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
    await new Promise((res) => setTimeout(res, 500)); // simulate API delay

    let mock = [];
    switch (tab) {
      case "Bank Details":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Bank User ${i + 1}`,
          email: `bankuser${i + 1}@example.com`,
          bankName: "Bank of Example",
          accountNumber: `123456789${i + 1}`,
          branch: "Main Branch",
          ifscCode: `IFSC000${i + 1}`,
        }));
        break;
      case "Pending Deposits":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          dateTime: new Date(Date.now() - i * 86400000).toLocaleString(),
          name: `Pending User ${i + 1}`,
          email: `pendinguser${i + 1}@example.com`,
          accountId: `ACC${1000 + i + 1}`,
          amount: (Math.random() * 1000 + 100).toFixed(2),
          paymentMethod: i % 2 === 0 ? "Credit Card" : "Bank Transfer",
        }));
        break;
      case "Pending Withdrawals":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          dateTime: new Date(Date.now() - i * 86400000).toLocaleString(),
          name: `Withdrawal User ${i + 1}`,
          email: `withdrawaluser${i + 1}@example.com`,
          accountId: `WDR${1000 + i + 1}`,
          amount: (Math.random() * 2000 + 200).toFixed(2),
          paymentMethod: i % 2 === 0 ? "Bank Transfer" : "Credit Card",
        }));
        break;
      case "Profile Changes":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Profile User ${i + 1}`,
          email: `profileuser${i + 1}@example.com`,
          requestedChanges: `Change request ${i + 1}`,
        }));
        break;
      case "Document Requests":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Doc User ${i + 1}`,
          email: `docuser${i + 1}@example.com`,
          documentType: i % 2 === 0 ? "Passport" : "Driving License",
          idProof: `https://example.com/idproof${i + 1}.pdf`,
          addressProof: `Address Proof ${i + 1}`,
          uploadedAt: new Date().toLocaleDateString(),
        }));
        break;
      case "Crypto Details":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Crypto User ${i + 1}`,
          email: `cryptouser${i + 1}@example.com`,
          walletAddress: `walletaddress${i + 1}xyz`,
          exchange: i % 2 === 0 ? "Binance" : "Coinbase",
          createdAt: new Date().toLocaleDateString(),
        }));
        break;
      case "Commission Withdrawals":
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          transactionId: `TXN${1000 + i + 1}`,
          name: `Commission User ${i + 1}`,
          email: `commissionuser${i + 1}@example.com`,
          tradingAccountId: `TRADE${1000 + i + 1}`,
          type: i % 2 === 0 ? "Debit" : "Credit",
          amount: (Math.random() * 1500 + 300).toFixed(2),
          status:
            i % 3 === 0 ? "Pending" : i % 3 === 1 ? "Approved" : "Rejected",
          createdAt: new Date(Date.now() - i * 86400000).toLocaleString(),
        }));
        break;
      default:
        mock = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `${tab} User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          createdAt: new Date().toLocaleDateString(),
          commissionProfile: "",
        }));
    }

    setTableData(mock);
    setLoading(false);
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

      <PendingDepositModal
        visible={withdrawalModalVisible}
        onClose={() => setWithdrawalModalVisible(false)}
        depositData={selectedWithdrawal}
        onApprove={(id) => {
          alert(`User ${id} withdrawal has been approved`);
          setWithdrawalModalVisible(false);
        }}
        onReject={(id) => {
          alert(`User ${id} withdrawal has been rejected`);
          setWithdrawalModalVisible(false);
        }}
      />

      <PendingDepositModal
        visible={commissionWithdrawalModalVisible}
        onClose={() => setCommissionWithdrawalModalVisible(false)}
        depositData={selectedCommissionWithdrawal}
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
