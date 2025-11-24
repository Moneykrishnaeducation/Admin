import React, { useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
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

import SubRowButtons from "../commonComponent/SubRowButtons";
import DepositModal from "../Modals/DepositModal";
import WithdrawModal from "../Modals/WithdrawModal";
import CreditInModal from "../Modals/CreditInModal";
import CreditOutModal from "../Modals/CreditOutModal";
import DisableModal from "../Modals/DisableModal";
import HistoryModal from "../Modals/HistoryModal";

const MamAccount = () => {
  const [activeTab, setActiveTab] = useState("mam"); // "mam" or "investor"
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [modalAccountId, setModalAccountId] = useState("");
  const [disableAccountId, setDisableAccountId] = useState("");
  const [disableAction, setDisableAction] = useState("Enable Account");
  const [historyAccountId, setHistoryAccountId] = useState("");
  const [historyActiveTab, setHistoryActiveTab] = useState("transactions");

  // Modal visibility state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [creditInModalOpen, setCreditInModalOpen] = useState(false);
  const [creditOutModalOpen, setCreditOutModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

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

  const handleOpenDepositModal = (row) => {
    setModalAccountId(row.accountId || "");
    setDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
  };

  const handleDeposit = ({ accountId, amount, comment }) => {
    if (amount.trim() === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    alert(`Deposited $${amount} to account ${accountId}\nComment: ${comment}`);
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = (row) => {
    setModalAccountId(row.accountId || "");
    setWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleWithdraw = ({ accountId, amount, comment }) => {
    if (amount.trim() === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }
    alert(`Withdrew $${amount} from account ${accountId}\nComment: ${comment}`);
    setWithdrawModalOpen(false);
  };

  const handleOpenCreditInModal = (row) => {
    setModalAccountId(row.accountId || "");
    setCreditInModalOpen(true);
  };

  const handleCloseCreditInModal = () => {
    setCreditInModalOpen(false);
  };

  const handleCreditIn = ({ accountId, amount, comment }) => {
    if (amount.trim() === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid Credit In amount.");
      return;
    }
    alert(`Credited In $${amount} to account ${accountId}\nComment: ${comment}`);
    setCreditInModalOpen(false);
  };

  const handleOpenCreditOutModal = (row) => {
    setModalAccountId(row.accountId || "");
    setCreditOutModalOpen(true);
  };

  const handleCloseCreditOutModal = () => {
    setCreditOutModalOpen(false);
  };

  const handleCreditOut = ({ accountId, amount, comment }) => {
    if (amount.trim() === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid Credit Out amount.");
      return;
    }
    alert(`Credited Out $${amount} from account ${accountId}\nComment: ${comment}`);
    setCreditOutModalOpen(false);
  };

  const handleOpenDisableModal = (row) => {
    setDisableAccountId(row.accountId || "");
    setDisableAction("Enable Account");
    setDisableModalOpen(true);
  };

  const handleCloseDisableModal = () => {
    setDisableModalOpen(false);
  };

  const handleDisableProceed = () => {
    alert(`${disableAction} for Account ${disableAccountId}`);
    setDisableModalOpen(false);
  };

  const handleOpenHistoryModal = (row) => {
    setHistoryAccountId(row.accountId || "");
    setHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
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
    return activeTab === "mam" ? sampleMamAccounts : sampleInvestorAccounts;
  }, [activeTab]);

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
      { icon: "🛑", label: "Disable", onClick: () => handleOpenDisableModal(row) },
      { icon: "🕒", label: "History", onClick: () => handleOpenHistoryModal(row) },
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
            <SubRowButtons actionItems={actionItems} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Background blur for table when modal is open */}
      {(depositModalOpen || withdrawModalOpen || creditInModalOpen || creditOutModalOpen || disableModalOpen || historyModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40"></div>
      )}

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

      

      <div
        className={
          depositModalOpen || withdrawModalOpen || creditInModalOpen
            ? "pointer-events-none select-none opacity-20 filter blur-2xl"
            : ""
        }
      >
        <TableStructure
          columns={columns}
          data={data}
          onRowClick={toggleRowExpanded}
          renderRowSubComponent={renderRowSubComponent}
        />
      </div>

      {/* Modal components */}
      <DepositModal
        visible={depositModalOpen}
        onClose={handleCloseDepositModal}
        accountId={modalAccountId}
        onSubmit={handleDeposit}
      />
      <WithdrawModal
        visible={withdrawModalOpen}
        onClose={handleCloseWithdrawModal}
        accountId={modalAccountId}
        onSubmit={handleWithdraw}
      />
      <CreditInModal
        visible={creditInModalOpen}
        onClose={handleCloseCreditInModal}
        accountId={modalAccountId}
        onSubmit={handleCreditIn}
      />
      <CreditOutModal
        visible={creditOutModalOpen}
        onClose={handleCloseCreditOutModal}
        accountId={modalAccountId}
        onSubmit={handleCreditOut}
      />
      <DisableModal
        visible={disableModalOpen}
        onClose={handleCloseDisableModal}
        accountId={disableAccountId}
        action={disableAction}
        onProceed={handleDisableProceed}
        setAction={setDisableAction}
      />
      <HistoryModal
        visible={historyModalOpen}
        onClose={handleCloseHistoryModal}
        accountId={historyAccountId}
        activeTab={historyActiveTab}
        setActiveTab={setHistoryActiveTab}
      />
    </div>
  );
};

export default MamAccount;
