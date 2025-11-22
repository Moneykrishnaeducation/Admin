import React, { useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const sampleMamAccounts = [
  {
    id: 1,
    name: "John Manager",
    managerEmail: "john.manager@example.com",
    mamAccountId: "MAM001",
    accountBalance: 50000,
    totalProfit: 12000,
    profitShare: 25,
    riskLevel: "Medium",
    payoutFrequency: "Monthly",
    accountId: "2141712206"
  },
  {
    id: 2,
    name: "Lisa Manager",
    managerEmail: "lisa.manager@example.com",
    mamAccountId: "MAM002",
    accountBalance: 75000,
    totalProfit: 18000,
    profitShare: 30,
    riskLevel: "High",
    payoutFrequency: "Quarterly",
    accountId: "2141712207"
  },
];

const sampleInvestorAccounts = [
  {
    id: 1,
    investorEmail: "investor1@example.com",
    mamAccountName: "John Manager",
    tradingAccountId: "TA1001",
    amountInvested: 10000,
    profit: 2500,
  },
  {
    id: 2,
    investorEmail: "investor2@example.com",
    mamAccountName: "Lisa Manager",
    tradingAccountId: "TA1002",
    amountInvested: 15000,
    profit: 4000,
  },
];

const MamAccount = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("mam"); // "mam" or "investor"
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAccountId, setModalAccountId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [comment, setComment] = useState("");

  const toggleRowExpanded = (row) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(row.id)) {
        newSet.delete(row.id);
      } else {
        newSet.add(row.id);
      }
      return newSet;
    });
  };

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [creditInModalOpen, setCreditInModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawComment, setWithdrawComment] = useState("");
  const [creditInAmount, setCreditInAmount] = useState("");
  const [creditInComment, setCreditInComment] = useState("");
  const [creditOutModalOpen, setCreditOutModalOpen] = useState(false);
  const [creditOutAmount, setCreditOutAmount] = useState("");
  const [creditOutComment, setCreditOutComment] = useState("");



  const handleOpenDepositModal = (row) => {
    setModalAccountId(row.accountId || "");
    setDepositAmount("");
    setComment("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleDeposit = () => {
    if (depositAmount.trim() === "" || isNaN(depositAmount) || Number(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    alert(`Deposited $${depositAmount} to account ${modalAccountId}\nComment: ${comment}`);
    setModalOpen(false);
  };

  const handleOpenWithdrawModal = (row) => {
    setModalAccountId(row.accountId || "");
    setWithdrawAmount("");
    setWithdrawComment("");
    setWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleWithdraw = () => {
    if (withdrawAmount.trim() === "" || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }
    alert(`Withdrew $${withdrawAmount} from account ${modalAccountId}\nComment: ${withdrawComment}`);
    setWithdrawModalOpen(false);
  };

  const handleOpenCreditInModal = (row) => {
    setModalAccountId(row.accountId || "");
    setCreditInAmount("");
    setCreditInComment("");
    setCreditInModalOpen(true);
  };

  const handleCloseCreditInModal = () => {
    setCreditInModalOpen(false);
  };

  const handleCreditIn = () => {
    if (creditInAmount.trim() === "" || isNaN(creditInAmount) || Number(creditInAmount) <= 0) {
      alert("Please enter a valid Credit In amount.");
      return;
    }
    alert(`Credited In $${creditInAmount} to account ${modalAccountId}\nComment: ${creditInComment}`);
    setCreditInModalOpen(false);
  };

  const handleOpenCreditOutModal = (row) => {
    setModalAccountId(row.accountId || "");
    setCreditOutAmount("");
    setCreditOutComment("");
    setCreditOutModalOpen(true);
  };

  const handleCloseCreditOutModal = () => {
    setCreditOutModalOpen(false);
  };

  const handleCreditOut = () => {
    if (creditOutAmount.trim() === "" || isNaN(creditOutAmount) || Number(creditOutAmount) <= 0) {
      alert("Please enter a valid Credit Out amount.");
      return;
    }
    alert(`Credited Out $${creditOutAmount} from account ${modalAccountId}\nComment: ${creditOutComment}`);
    setCreditOutModalOpen(false);
  };

  const columnsMam = [
    { Header: "Name", accessor: "name" },
    { Header: "Manager Email", accessor: "managerEmail" },
    { Header: "MAM Account ID", accessor: "mamAccountId" },
    { Header: "Account Balance", accessor: "accountBalance" },
    { Header: "Total Profit", accessor: "totalProfit" },
    { Header: "Profit Share (%)", accessor: "profitShare" },
    { Header: "Risk Level", accessor: "riskLevel" },
    { Header: "Payout Frequency", accessor: "payoutFrequency" },
  ];

  const columnsInvestor = [
    { Header: "Investor Email", accessor: "investorEmail" },
    { Header: "MAM Account Name", accessor: "mamAccountName" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Amount Invested", accessor: "amountInvested" },
    { Header: "Profit", accessor: "profit" },
  ];

  const data = useMemo(() => {
    const sourceData = activeTab === "mam" ? sampleMamAccounts : sampleInvestorAccounts;
    if (!searchText.trim()) {
      return sourceData;
    }
    const lowerSearch = searchText.toLowerCase();
    return sourceData.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [activeTab, searchText]);

  const columns = activeTab === "mam" ? columnsMam : columnsInvestor;

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRows.has(row.id);
    const actionItems = [
      {
        icon: "💰",
        label: "Deposit",
        onClick: () => handleOpenDepositModal(row),
      },
      {
        icon: "💸",
        label: "Withdrawal",
        onClick: () => handleOpenWithdrawModal(row),
      },
      {
        icon: "➕",
        label: "Credit In",
        onClick: () => handleOpenCreditInModal(row),
      },
      {
        icon: "➖",
        label: "Credit Out",
        onClick: () => handleOpenCreditOutModal(row),
      },
      { icon: "🛑", label: "Disable", onClick: () => alert("Disable clicked") },
      { icon: "🕒", label: "History", onClick: () => alert("History clicked") },
    ];

    return (
      <tr style={{ height: isExpanded ? "auto" : "0px", overflow: "hidden", padding: 0, margin: 0, border: 0 }}>
        <td colSpan={columns.length} className="p-0 m-0 border-0">
          <div
            style={{
              maxHeight: isExpanded ? 100 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease, opacity 0.3s ease",
              opacity: isExpanded ? 1 : 0,
            }}
            className="bg-gray-800 text-yellow-400 rounded p-2 flex gap-4 flex-wrap"
          >
            {actionItems.map(({ icon, label, onClick }) => (
              <button
                key={label}
                className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Background blur for table when modal is open */}
      {modalOpen && <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"></div>}

      <div className="flex gap-4 mb-4 z-50 relative">
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "mam"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => setActiveTab("mam")}
        >
          MAM Account
        </button>
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "investor"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => setActiveTab("investor")}
        >
          Investor Account
        </button>
      </div>

      <div className="flex justify-end mb-4 z-50 relative">
        <div
          className={`flex items-center gap-2 border border-yellow-500 rounded-md px-3 py-2 w-full sm:w-72 ${
            isDarkMode ? "bg-black" : "bg-white"
          } hover:bg-gray-900 transition`}
        >
          <Search size={18} className="text-yellow-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "mam" ? "MAM" : "Investor"} accounts...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`bg-transparent w-full focus:outline-none ${
              isDarkMode
                ? "text-yellow-300 placeholder-yellow-400"
                : "text-black placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      <div className={modalOpen || withdrawModalOpen || creditInModalOpen ? "pointer-events-none select-none opacity-20 filter blur-2xl" : ""}>
        <TableStructure
          columns={columns}
          data={data}
          onRowClick={toggleRowExpanded}
          renderRowSubComponent={renderRowSubComponent}
        />
      </div>

      {modalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/50">
    <div className="bg-black text-white rounded-lg shadow-lg max-w-md w-full p-6 relative border border-yellow-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Deposit to Account {modalAccountId}</h3>
        <button
          className="text-gray-300 hover:text-white"
          onClick={handleCloseModal}
        >
          &times;
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleDeposit();
        }}
      >
        <div className="mb-4">
          <label className="block mb-1 font-medium">Account ID</label>
          <input
            type="text"
            disabled
            value={modalAccountId}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 cursor-not-allowed text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Deposit Amount ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Comment</label>
          <textarea
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="submit"
            className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
          >
            Deposit
          </button>
          <button
            type="button"
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            onClick={handleCloseModal}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {withdrawModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/50">
          <div className="bg-black text-white rounded-lg shadow-lg max-w-md w-full p-6 relative border border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Withdraw from Account {modalAccountId}</h3>
              <button
                className="text-gray-300 hover:text-white"
                onClick={handleCloseWithdrawModal}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleWithdraw();
              }}
            >
              <div className="mb-4">
                <label className="block mb-1 font-medium">Account ID</label>
                <input
                  type="text"
                  disabled
                  value={modalAccountId}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 cursor-not-allowed text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Withdraw Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Comment</label>
                <textarea
                  placeholder="Optional comment"
                  value={withdrawComment}
                  onChange={(e) => setWithdrawComment(e.target.value)}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  onClick={handleCloseWithdrawModal}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {creditInModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/50">
          <div className="bg-black text-white rounded-lg shadow-lg max-w-md w-full p-6 relative border border-yellow-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Credit In to Account {modalAccountId}</h3>
              <button
                className="text-gray-300 hover:text-white"
                onClick={handleCloseCreditInModal}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreditIn();
              }}
            >
              <div className="mb-4">
                <label className="block mb-1 font-medium">Account ID</label>
                <input
                  type="text"
                  disabled
                  value={modalAccountId}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 cursor-not-allowed text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">
                  Credit In Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={creditInAmount}
                  onChange={(e) => setCreditInAmount(e.target.value)}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Comment</label>
                <textarea
                  placeholder="Optional comment"
                  value={creditInComment}
                  onChange={(e) => setCreditInComment(e.target.value)}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
                >
                  Credit In
                </button>
                <button
                  type="button"
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  onClick={handleCloseCreditInModal}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MamAccount;
