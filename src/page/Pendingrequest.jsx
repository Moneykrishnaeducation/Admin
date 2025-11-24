import React, { useState, useEffect } from "react";
import TableStructure from "../commonComponent/TableStructure";
import ErrorBoundary from "../commonComponent/ErrorBoundary";
import PendingDepositModal from "../Modals/PendingDepositModal";

const PendingRequest = () => {
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

  const [activeTab, setActiveTab] = useState(buttons[0]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const [commissionWithdrawalModalVisible, setCommissionWithdrawalModalVisible] = useState(false);
  const [selectedCommissionWithdrawal, setSelectedCommissionWithdrawal] = useState(null);

  // Existing columns for tabs other than Bank Details
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
          className="border px-2 py-1 rounded"
          value={row.commissionProfile || ""}
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
          <option value="Profile A">Profile A</option>
          <option value="Profile B">Profile B</option>
          <option value="Profile C">Profile C</option>
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


  // Columns specifically for Crypto Details tab
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

  // Columns specifically for Pending Deposits tab
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

  // Columns specifically for Pending Withdrawals tab
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

  // Columns specifically for Profile Changes tab
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

  // Columns specifically for Commission Withdrawals tab
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

  // Columns specifically for Bank Details tab
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

  // Columns specifically for Document Requests tab
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
          href={row.idProof}
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


  const handleAction = (id, action) => {
    alert(`User ${id} has been ${action}`);
    // Here you can call API to approve/reject
  };

  const handleApprove = (id) => {
    alert(`User ${id} has been approved`);
    setModalVisible(false);
    // Update corresponding table data or refresh
  };

  const handleReject = (id) => {
    alert(`User ${id} has been rejected`);
    setModalVisible(false);
    // Update corresponding table data or refresh
  };

  // Simulate fetching data per activeTab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 500));

      // Mock data for Bank Details tab
      if (activeTab === "Bank Details") {
        const mockBankData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Bank User ${i + 1}`,
          email: `bankuser${i + 1}@example.com`,
          bankName: "Bank of Example",
          accountNumber: `123456789${i + 1}`,
          branch: "Main Branch",
          ifscCode: `IFSC000${i + 1}`,
        }));

        setTableData(mockBankData);
        setLoading(false);
        return;
      }

      if (activeTab === "Pending Deposits") {
        const mockPendingDepositsData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          dateTime: new Date(Date.now() - i * 86400000).toLocaleString(),
          name: `Pending User ${i + 1}`,
          email: `pendinguser${i + 1}@example.com`,
          accountId: `ACC${1000 + i + 1}`,
          amount: (Math.random() * 1000 + 100).toFixed(2),
          paymentMethod: i % 2 === 0 ? "Credit Card" : "Bank Transfer",
        }));
  
        setTableData(mockPendingDepositsData);
        setLoading(false);
        return;
      }
  
      if (activeTab === "Pending Withdrawals") {
        const mockPendingWithdrawalsData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          dateTime: new Date(Date.now() - i * 86400000).toLocaleString(),
          name: `Withdrawal User ${i + 1}`,
          email: `withdrawaluser${i + 1}@example.com`,
          accountId: `WDR${1000 + i + 1}`,
          amount: (Math.random() * 2000 + 200).toFixed(2),
          paymentMethod: i % 2 === 0 ? "Bank Transfer" : "Credit Card",
        }));
  
        setTableData(mockPendingWithdrawalsData);
        setLoading(false);
        return;
      }

      if (activeTab === "Profile Changes") {
        const mockProfileChangesData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Profile User ${i + 1}`,
          email: `profileuser${i + 1}@example.com`,
          requestedChanges: `Change request ${i + 1}`,
        }));

        setTableData(mockProfileChangesData);
        setLoading(false);
        return;
      }

      if (activeTab === "Document Requests") {
        const mockDocumentRequestsData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Doc User ${i + 1}`,
          email: `docuser${i + 1}@example.com`,
          documentType: i % 2 === 0 ? "Passport" : "Driving License",
          idProof: `https://example.com/idproof${i + 1}.pdf`,
          addressProof: `Address Proof ${i + 1}`,
          uploadedAt: new Date().toLocaleDateString(),
        }));

        setTableData(mockDocumentRequestsData);
        setLoading(false);
        return;
      }

      if (activeTab === "Crypto Details") {
        const mockCryptoData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Crypto User ${i + 1}`,
          email: `cryptouser${i + 1}@example.com`,
          walletAddress: `walletaddress${i + 1}xyz`,
          exchange: i % 2 === 0 ? "Binance" : "Coinbase",
          createdAt: new Date().toLocaleDateString(),
        }));

        setTableData(mockCryptoData);
        setLoading(false);
        return;
      }

      if (activeTab === "Commission Withdrawals") {
        const mockCommissionWithdrawalsData = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          transactionId: `TXN${1000 + i + 1}`,
          name: `Commission User ${i + 1}`,
          email: `commissionuser${i + 1}@example.com`,
          tradingAccountId: `TRADE${1000 + i + 1}`,
          type: i % 2 === 0 ? "Debit" : "Credit",
          amount: (Math.random() * 1500 + 300).toFixed(2),
          status: i % 3 === 0 ? "Pending" : i % 3 === 1 ? "Approved" : "Rejected",
          createdAt: new Date(Date.now() - i * 86400000).toLocaleString(),
        }));

        setTableData(mockCommissionWithdrawalsData);
        setLoading(false);
        return;
      }

      // Mock data for other tabs
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `${activeTab} User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        createdAt: new Date().toLocaleDateString(),
        commissionProfile: "", // default empty
      }));

      setTableData(mockData);
      setLoading(false);
    };

    fetchData();
  }, [activeTab]);

  // Conditional columns based on activeTab
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
      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => setActiveTab(btn)}
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
