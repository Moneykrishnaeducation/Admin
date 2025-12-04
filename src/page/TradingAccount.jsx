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
import ChangeUserProfileModal from "../Modals/ChangeUserProfileModal";
import ChangeLeverageModal from "../Modals/ChangeLeverageModal";
import AlgoTradingModal from "../Modals/AlgoTradingModal";

const currencyFormatter = (v) => {
  if (typeof v !== "number") return v;

};


const TradingAccountPage = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Change Profile modal state and data
  const [changeProfileOpen, setChangeProfileOpen] = useState(false);
  const [profileAccountId, setProfileAccountId] = useState(null);

  // Internal transfer modal state
  const [internalTransferOpen, setInternalTransferOpen] = useState(false);

  // fetch users (admin) with pagination
  const fetchUsers = React.useCallback(
      async ({ page: p = 1, pageSize: ps = 10, query = "" }) => {
        const endpoint = "/admin/trading-accounts/";
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("pageSize", String(ps));
        if (query) params.set("query", query);
        try {
          const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
          let resJson;
          if (client && typeof client.get === "function") {
            resJson = await client.get(`${endpoint}?${params.toString()}`);
          } else {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token")
                : null;
            const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
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
            userId: u.user_id ?? u.id ?? u.pk,
            name: `${u.username || "-"}`.trim(),
            email: u.email,
            accountId: u.account_id || "-",
            balance: typeof u.balance === "number" ? u.balance : 0,
            leverage : u.leverage || "-",
            status: u.status ? "Running" : "Stopped",
            country: u.country || "-",
            isEnabled: Boolean(u.is_is_enabled ?? u.enabled ?? u.is_enabled),
          }));
          setData(mapped);
          return { data: mapped, total };
        } catch (err) {
          console.error("Failed to load users:", err);
          return { data: [], total: 0 };
        }
      },
      []
    );

  React.useEffect(() => {
    fetchUsers(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

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
    },
    { Header: "Leverage", accessor: "leverage" },
    {
      Header: "Status",
      accessor: "status",
      Cell: (accessor) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${accessor === "Running" ? "bg-green-500" : "bg-gray-500"
            } text-white`}
        >
          {accessor}
        </span>
      ),
    },
    { Header: "Country", accessor: "country" },
  ];

  const onRowClick = (row) => {
    setExpandedId((prev) => (prev === row.accountId ? null : row.accountId));
  };

  // ======================
  // Row Subcomponent
  // ======================

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedId === row.accountId;


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
          setProfileAccountId(row.accountId);
          setChangeProfileOpen(true);
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
      {/* Change user profile (trading group) modal */}
      <ChangeUserProfileModal
        visible={changeProfileOpen}
        onClose={() => setChangeProfileOpen(false)}
        groups={Array.from(new Set(data.map(d => d.group))).map(g => ({ id: g, name: g }))}
        onSubmit={(selectedGroup) => {
          setChangeProfileOpen(false);
          setData(prev => prev.map(item =>
            item.accountId === profileAccountId ? { ...item, group: selectedGroup } : item
          ));
        }}
      />
    </div>
  );
};

export default TradingAccountPage;
