import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && (tab === "mam" || tab === "investor")) {
      setActiveTab(tab);
    }
  }, [location.search]);

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
    { Header: "User ID", accessor: "userId" },
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
    { Header: "User ID", accessor: "userId" },
    { Header: "Investor Name", accessor: "investorName" },
    { Header: "Investor Email", accessor: "investorEmail" },
    { Header: "Manager Name", accessor: "managerName" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Amount Invested", accessor: "amountInvested" },
    { Header: "Profit", accessor: "profit" },
  ];

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

  // Server-side fetch handler for MAM tables
  // Wrapped in useCallback so its identity is stable and TableStructure's
  // effect doesn't re-run on every render.
  const handleFetch = useCallback(async ({ page, pageSize, query }) => {
    const endpoint = activeTab === 'mam' ? '/api/mam-managers/' : '/api/mam-investors/';
    const params = new URLSearchParams();
    params.set('page', String(page || 1));
    params.set('page_size', String(pageSize || 10));
    if (query) params.set('query', String(query));

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let resJson;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      // Expect { data: [...], total: N } or fallback to array
      const items = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : (resJson.results || []));
      const total = typeof resJson.total === 'number' ? resJson.total : (typeof resJson.count === 'number' ? resJson.count : items.length);

      const mapped = items.map((item, idx) => {
        if (activeTab === 'mam') {
          return {
            id: item.id ?? item.pk ?? idx,
            userId: item.user_id ?? item.user ?? item.userId ?? '',
            // Prefer username, fall back to account_name or existing name
            name: (item.username ?? item.account_name ?? item.name) || `${(item.first_name || '')} ${(item.last_name || '')}`.trim() || 'Unknown',
            // Email field from API is `email`
            managerEmail: item.email ?? item.managerEmail ?? item.manager_email ?? '',
            // account id fields
            mamAccountId: item.account_id ?? item.accountId ?? item.mamAccountId ?? '',
            // balance can be under `balance` or `equity` (string) — normalize to number when possible
            accountBalance: item.balance ?? item.accountBalance ?? (item.equity ? Number(item.equity) : 0) ?? 0,
            // profit comes from `profit`
            totalProfit: item.profit ?? item.totalProfit ?? item.total_profit ?? 0,
            // profit sharing percentage from backend
            profitShare: item.profit_sharing_percentage ?? item.profitShare ?? item.profit_share ?? 0,
            riskLevel: item.risk_level ?? item.riskLevel ?? '',
            payoutFrequency: item.payout_frequency ?? item.payoutFrequency ?? '',
            accountId: item.account_id ?? item.accountId ?? '',
          };
        }

        // investor mapping
        return {
          id: item.id ?? item.pk ?? idx,
          // user id for first column
          userId: item.user_id ?? item.user ?? item.userId ?? '',
          // investor's displayed name
          investorName: item.username ?? item.investorName ?? `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() ?? '',
          investorEmail: item.investorEmail ?? item.email ?? item.investor_email ?? '',
          // manager/master name for this investor's MAM account
          managerName: item.mam_master_account_name ?? item.mam_master_account?.user?.username ?? item.managerName ?? '',
          tradingAccountId: item.tradingAccountId ?? item.trading_account_id ?? item.accountId ?? item.account_id ?? '',
          // amountInvested: prefer explicit invested fields, otherwise fall back to balance/equity
          amountInvested: (
            Number(item.amountInvested ?? item.amount_invested ?? item.invested_amount ?? null) ||
            Number(item.balance ?? item.equity ?? 0)
          ),
          profit: item.profit ?? item.total_profit ?? 0,
        };
      });

      return { data: mapped, total };
    } catch (err) {
      console.error('MAM fetch error', err);
      return { data: [], total: 0 };
    }
  }, [activeTab]);

  return (
    <div className="p-6 max-w-9xl mx-auto relative">
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
          onClick={() => {
            setActiveTab("mam");
            const params = new URLSearchParams(location.search);
            params.set("tab", "mam");
            navigate(`/mamaccount?${params.toString()}`, { replace: true });
          }}
        >
          MAM Account
        </button>
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "investor"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => {
            setActiveTab("investor");
            const params = new URLSearchParams(location.search);
            params.set("tab", "investor");
            navigate(`/mamaccount?${params.toString()}`, { replace: true });
          }}
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
          key={activeTab}
          columns={columns}
          data={[]}
          serverSide={true}
          onFetch={handleFetch}
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
