import React, { useState, useRef } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { DepositModal, WithdrawModal } from "../Modals";
import HistoryModal from "../Modals/HistoryModal";
import DisableModal from "../Modals/DisableModal";
import CreditOutModal from "../Modals/CreditOutModal";
import CreditInModal from "../Modals/CreditInModal";
import SubRowButtons from "../commonComponent/SubRowButtons";
import {
  Wallet,
  CreditCard,
  Gift,
  PlusCircle,
  MinusCircle,
  Ban,
  CheckCircle,
  BarChart3,
  User,
  Clock3
} from "lucide-react";
import InternalTransferModal from "../Modals/InternalTransferModal";
import EditProfileModal from "../Modals/EditProfileModal";
import ChangeLeverageModal from "../Modals/ChangeLeverageModal";
import AlgoTradingModal from "../Modals/AlgoTradingModal";

const currencyFormatter = (v) => {
  if (typeof v !== "number") return v;

};


const TradingAccountPage = () => {
  const [data, setData] = useState([
    {
      id: 1,
      userId: "7001477",
      name: "Thilsath",
      email: "raffiullah2020@gmail.com",
      accountId: "2141713782",
      balance: 0,
      leverage: "1:500",
      group: "Real-ECN",
      status: "Running",
      country: "India",
    },
    {
      id: 2,
      userId: "7001488",
      name: "Aisha",
      email: "aisha@example.com",
      accountId: "2141713800",
      balance: 523.5,
      leverage: "1:200",
      group: "Demo-Standard",
      status: "Running",
      country: "USA",
    },
  ]);

  const [loading] = useState(false);
  const [error] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Modal states
  const [modalAccountId, setModalAccountId] = useState("");
  const [disableAccountId, setDisableAccountId] = useState("");
  const [disableAction, setDisableAction] = useState("Enable Account");
  const [historyAccountId, setHistoryAccountId] = useState("");
  const [historyActiveTab, setHistoryActiveTab] = useState("transactions");

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [creditInModalOpen, setCreditInModalOpen] = useState(false);
  const [creditOutModalOpen, setCreditOutModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [algoModalOpen, setAlgoModalOpen] = useState(false);
  const [leverageModalOpen, setLeverageModalOpen] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedLeverage, setSelectedLeverage] = useState("1:500");

  // Edit Profile modal state and data
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState(null);

  // Internal transfer modal state
  const [internalTransferOpen, setInternalTransferOpen] = useState(false);

  // Reference for modal backdrop to handle outside click
  const interTransModalRef = useRef(null);

  // ======================
  // Modal Handlers
  // ======================

  const handleOpenDepositModal = (row) => {
    setModalAccountId(row.accountId);
    setDepositModalOpen(true);
  };
  const handleDeposit = ({ accountId, amount, comment }) => {
    if (!amount || Number(amount) <= 0) return alert("Invalid Deposit Amount");
    alert(`Deposited $${amount} to ${accountId}\nComment: ${comment}`);
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = (row) => {
    setModalAccountId(row.accountId);
    setWithdrawModalOpen(true);
  };
  const handleWithdraw = ({ accountId, amount, comment }) => {
    if (!amount || Number(amount) <= 0) return alert("Invalid Withdrawal Amount");
    alert(`Withdrew $${amount} from ${accountId}\nComment: ${comment}`);
    setWithdrawModalOpen(false);
  };

  const handleOpenCreditInModal = (row) => {
    setModalAccountId(row.accountId);
    setCreditInModalOpen(true);
  };
  const handleCreditIn = ({ accountId, amount, comment }) => {
    if (!amount || Number(amount) <= 0) return alert("Invalid Credit In Amount");
    alert(`Credit In $${amount} to ${accountId}\nComment: ${comment}`);
    setCreditInModalOpen(false);
  };

  const handleOpenCreditOutModal = (row) => {
    setModalAccountId(row.accountId);
    setCreditOutModalOpen(true);
  };
  const handleCreditOut = ({ accountId, amount, comment }) => {
    if (!amount || Number(amount) <= 0) return alert("Invalid Credit Out Amount");
    alert(`Credit Out $${amount} from ${accountId}\nComment: ${comment}`);
    setCreditOutModalOpen(false);
  };

  const handleOpenDisableModal = (row) => {
    setDisableAccountId(row.accountId);
    setDisableAction("Enable Account");
    setDisableModalOpen(true);
  };

  const handleDisableProceed = () => {
    alert(`${disableAction} for Account ${disableAccountId}`);
    setDisableModalOpen(false);
  };

  const handleOpenHistoryModal = (row) => {
    setHistoryAccountId(row.accountId);
    setHistoryModalOpen(true);
  };

  // ======================
  // Table Columns
  // ======================

  const columns = [
    { Header: "User ID", accessor: "userId" },
    { Header: "Name", accessor: "name" },
    { Header: "Email", accessor: "email" },
    { Header: "Account ID", accessor: "accountId" },
    {
      Header: "Balance",
      accessor: "balance",
      Cell: (value) => <strong>{currencyFormatter(value)}</strong>,
    },
    { Header: "Leverage", accessor: "leverage" },
    { Header: "Group", accessor: "group" },
    {
      Header: "Status",
      accessor: "status",
      Cell: (value) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${value === "Running" ? "bg-green-500" : "bg-gray-500"
            } text-white`}
        >
          {value}
        </span>
      ),
    },
    { Header: "Country", accessor: "country" },
  ];

  const onRowClick = (row) => {
    setExpandedId((prev) => (prev === row.id ? null : row.id));
  };

  // ======================
  // Row Subcomponent
  // ======================

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedId === row.id;


    const actionItems = [
      {
        icon: <Wallet size={18} />,
        label: "Deposit",
        onClick: () => handleOpenDepositModal(row),
      },
      {
        icon: <CreditCard size={18} />,
        label: "Withdrawal",
        onClick: () => handleOpenWithdrawModal(row),
      },
      {
        icon: <PlusCircle size={18} />,
        label: "Credit In",
        onClick: () => handleOpenCreditInModal(row),
      },
      {
        icon: <MinusCircle size={18} />,
        label: "Credit Out",
        onClick: () => handleOpenCreditOutModal(row),
      },
      {
        icon: <Ban size={18} />,
        label: "Disable",
        onClick: () => handleOpenDisableModal(row),
      },
      {
        icon: <CheckCircle size={18} />,
        label: "Enable Algo",
        onClick: () => {
          setSelectedAccountId(row.accountId);
          setAlgoModalOpen(true);
        }
      },
      {
        icon: <BarChart3 size={18} />,
        label: "Leverage",
        onClick: () => {
          setSelectedAccountId(row.accountId);
          setSelectedLeverage(row.leverage);
          setLeverageModalOpen(true);
        }
      },
      {
        icon: <User size={18} />,
        label: "Profile",
        onClick: () => {
          setEditProfileData(row);
          setEditProfileOpen(true);
        },
      },
      {
        icon: <Clock3 size={18} />,
        label: "History",
        onClick: () => handleOpenHistoryModal(row),
      },
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
            className="bg-gray-800 text-yellow-400 rounded p-2 flex gap-3 flex-wrap"
          >
            <SubRowButtons actionItems={actionItems} />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Trading Accounts</h2>

      {loading && <div className="text-white">Loading…</div>}
      {error && <div className="text-red-400">{error}</div>}

      <TableStructure
        columns={columns}
        data={data}
        initialPageSize={10}
        topActions={
          <button
            className="bg-yellow-400 text-black px-3 py-2 rounded-md font-semibold flex items-center gap-2"
            onClick={() => setInternalTransferOpen(true)}
          >
            <span>➕</span> Internal Transfer
          </button>
        }
        renderRowSubComponent={renderRowSubComponent}
        onRowClick={onRowClick}
      />

      {/* Modals */}
      <InternalTransferModal
        visible={internalTransferOpen}
        onClose={() => setInternalTransferOpen(false)}
        accounts={data.map(d => ({
          account_no: d.accountId,
          balance: d.balance
        }))}
      />
      <AlgoTradingModal
        visible={algoModalOpen}
        onClose={() => setAlgoModalOpen(false)}
        accountId={selectedAccountId}
        onProceed={(action) => console.log("Algo:", action)}
      />

      <ChangeLeverageModal
        visible={leverageModalOpen}
        onClose={() => setLeverageModalOpen(false)}
        currentLeverage={selectedLeverage}
        leverageOptions={["1:50", "1:100", "1:200", "1:300", "1:500"]}
        onUpdate={(newLev) => console.log("Updated leverage:", newLev)}
      />

      <DepositModal visible={depositModalOpen} onClose={() => setDepositModalOpen(false)} accountId={modalAccountId} onSubmit={handleDeposit} />
      <WithdrawModal visible={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} accountId={modalAccountId} onSubmit={handleWithdraw} />
      <CreditInModal visible={creditInModalOpen} onClose={() => setCreditInModalOpen(false)} accountId={modalAccountId} onSubmit={handleCreditIn} />
      <CreditOutModal visible={creditOutModalOpen} onClose={() => setCreditOutModalOpen(false)} accountId={modalAccountId} onSubmit={handleCreditOut} />
      <DisableModal visible={disableModalOpen} onClose={() => setDisableModalOpen(false)} accountId={disableAccountId} action={disableAction} onProceed={handleDisableProceed} setAction={setDisableAction} />
      <HistoryModal visible={historyModalOpen} onClose={() => setHistoryModalOpen(false)} accountId={historyAccountId} activeTab={historyActiveTab} setActiveTab={setHistoryActiveTab} />
      <EditProfileModal
        visible={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        initialData={editProfileData}
        onSave={(updatedProfile) => {
          setEditProfileOpen(false);
          setData((prevData) =>
            prevData.map((item) =>
              item.id === updatedProfile.id ? { ...item, ...updatedProfile } : item
            )
          );
        }}
      />
    </div>
  );
};

export default TradingAccountPage;
