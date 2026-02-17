import React, { useState, useCallback, useEffect } from "react";
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
import { useTheme } from "../context/ThemeContext";

const PamAccount = () => {
  const { isDarkMode = true } = useTheme() || {};

  // THEME CLASSES
  const blurOverlayCls = isDarkMode
    ? "fixed inset-0 bg-black-400 bg-opacity-40 backdrop-blur-md z-40"
    : "fixed inset-0 bg-white-400 bg-opacity-40 backdrop-blur-md z-40";

  const activeTabCls = "bg-yellow-400 text-black";
  const inactiveTabCls = isDarkMode
    ? "bg-gray-700 text-yellow-300"
    : "bg-gray-300 text-gray-800";
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pam"); // "pam" or "investor"
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [data, setData] = useState([]);
  const [modalAccountId, setModalAccountId] = useState("");
  const [depositContext, setDepositContext] = useState(null);
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

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && (tab === "pam" || tab === "investor")) {
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
    const acctId = activeTab === 'pam' ? (row.accountId || "") : (row.tradingAccountId || "");
    setModalAccountId(acctId);
    if (activeTab === 'investor') {
      setDepositContext({ type: 'investor', investmentId: row.id, pamAccountId: row.pamAccountId, pammMt5Login: row.pammMt5Login, investorUserId: row.userId });
    } else {
      setDepositContext({ type: 'pam' });
    }
    setDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
    setDepositContext(null);
  };

  const handleOpenWithdrawModal = (row) => {
    const acctId = activeTab === 'pam' ? (row.accountId || "") : (row.tradingAccountId || "");
    setModalAccountId(acctId);
    setWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleOpenCreditInModal = (row) => {
    const acctId = activeTab === 'pam' ? (row.accountId || "") : (row.tradingAccountId || "");
    setModalAccountId(acctId);
    setCreditInModalOpen(true);
  };

  const handleOpenCreditOutModal = (row) => {
    const acctId = activeTab === 'pam' ? (row.accountId || "") : (row.tradingAccountId || "");
    setModalAccountId(acctId);
    setCreditOutModalOpen(true);
  };

  const handleToggleAccountStatus = (account) => {
    // Toggle the isEnabled status
    const updatedData = data.map(acc =>
      (activeTab === 'pam' ? acc.accountId === account.accountId : acc.tradingAccountId === account.tradingAccountId)
        ? { ...acc, isEnabled: !acc.isEnabled }
        : acc
    );
    setData(updatedData);
  };

  const handleOpenHistoryModal = (row) => {
    const acctId = activeTab === 'pam' ? (row.accountId || "") : (row.tradingAccountId || "");
    setHistoryAccountId(acctId);
    setHistoryModalOpen(true);
  };

  const handleEditManagerCapital = async (row) => {
    const acctId = row.accountId || row.mamAccountId || '';
    if (!acctId) return showToast('Missing account id', 'error');
    const input = window.prompt('Enter manager capital amount (prefix + to add, e.g. +100):', '');
    if (!input) return;
    let operation = 'set';
    let amountStr = input;
    if (input.trim().startsWith('+')) {
      operation = 'increment';
      amountStr = input.trim().slice(1);
    }
    const amount = parseFloat(amountStr);
    if (Number.isNaN(amount)) return showToast('Invalid amount', 'error');

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let res;
      if (client && typeof client.patch === 'function') {
        res = await client.patch(`/api/pam-accounts/${acctId}/manager-capital/`, { amount: String(amount), operation });
      } else {
        const r = await fetch(`/api/pam-accounts/${acctId}/manager-capital/`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: String(amount), operation }),
        });
        if (!r.ok) throw new Error(`Server ${r.status}`);
        res = await r.json();
      }

      showToast('Manager capital updated', 'success');
      // Update local row in table data
      setData(prev => prev.map(d => (d.accountId === acctId ? { ...d, managerCapital: Number(res.manager_capital ?? res.managerCapital ?? d.managerCapital ?? 0) } : d)));
    } catch (err) {
      showToast(err?.message || 'Failed to update manager capital', 'error');
    }
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
  };

  const handleCloseCreditInModal = () => {
    setCreditInModalOpen(false);
  };

  const handleCloseCreditOutModal = () => {
    setCreditOutModalOpen(false);
  };

  const handleCloseDisableModal = () => {
    setDisableModalOpen(false);
  };

  const handleDisableProceed = () => {
    // Implement disable logic here
    setDisableModalOpen(false);
  };

  const columnsMam = [
    { Header: "User ID", accessor: "userId" },
    { Header: "Name", accessor: "name" },
    { Header: "MAM Email", accessor: "managerEmail" },
    { Header: "MAM Account ID", accessor: "mamAccountId" },
    { Header: "Manager Capital", accessor: "managerCapital" },
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

  const columns = activeTab === "pam" ? columnsMam : columnsInvestor;

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRows.has(row.id);
    
    // Get the latest account data from the state to ensure we have current isEnabled status
    const acctId = activeTab === 'pam' ? row.accountId : row.tradingAccountId;
    const currentAccount = data.find(acc => (activeTab === 'pam' ? acc.accountId === acctId : acc.tradingAccountId === acctId)) || row;

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
      { icon: "", label: "History", onClick: () => handleOpenHistoryModal(row) },
      { icon: "🏦", label: "Edit Capital", onClick: () => handleEditManagerCapital(row) },
    ];

    return (
      <tr style={{ height: isExpanded ? "auto" : "0px", overflow: "hidden", padding: 0, margin: 0, border: 0 }}>
        <td colSpan={columns.length} className="p-0 m-0 border-0">
          <div
            style={{
              maxHeight: isExpanded ? 120 : 0,
              overflow: "hidden",
              transition: "max-height 0.3s ease, opacity 0.3s ease",
              opacity: isExpanded ? 1 : 0,
            }}
            className={`${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-800'} rounded p-2 flex gap-4 flex-wrap items-center justify-between`}
          >
            <SubRowButtons actionItems={actionItems} />
            <div className="flex items-center gap-2 ml-auto">
              <span className={`text-sm font-semibold ${currentAccount.isEnabled ? "text-green-400" : "text-red-400"}`}>
                {currentAccount.isEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={() => handleToggleAccountStatus(currentAccount)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  currentAccount.isEnabled ? "bg-green-500" : "bg-red-500"
                } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-transform duration-300 ${
                    currentAccount.isEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Server-side fetch handler for PAM/MAM tables
  const handleFetch = useCallback(async ({ page, pageSize, query }) => {
    const endpoint = activeTab === 'pam' ? '/api/pam-accounts/' : '/api/pam-investors/';
    const params = new URLSearchParams();
    params.set('page', String(page || 1));
    params.set('page_size', String(pageSize || 10));
    
    // Add search query parameter if provided
    if (query && query.trim()) {
      params.set('search', String(query.trim()));
    }

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let resJson;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        const headers = { 'Content-Type': 'application/json' };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      // Expect { data: [...], total: N } or fallback to array
      const items = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : (resJson.results || []));
      const total = typeof resJson.total === 'number' ? resJson.total : (typeof resJson.count === 'number' ? resJson.count : items.length);

      const mapped = items.map((item, idx) => {
        if (activeTab === 'pam') {
          const isEnabled = Boolean(item.is_enabled ?? item.enabled ?? true);
          return {
            id: item.id ?? item.pk ?? idx,
            // Show PAM record id in User ID column for clarity
            userId: item.id ?? item.pk ?? idx,
            name: (item.name || item.account_name || `${(item.first_name || '')} ${(item.last_name || '')}`.trim() || 'Unknown'),
            // backend provides manager_name instead of email
            managerEmail: item.manager_name ?? item.managerEmail ?? item.manager_email ?? '',
            // MT5 login is used as PAM account identifier
            mamAccountId: item.mt5_login ?? item.account_id ?? item.accountId ?? item.mamAccountId ?? '',
            // Use pool_balance (PAM pool) or mt5_balance as fallback
            accountBalance: Number(item.pool_balance ?? item.mt5_balance ?? item.balance ?? 0),
            managerCapital: Number(item.manager_capital ?? item.managerCapital ?? 0),
            totalProfit: Number(item.total_profit ?? item.totalProfit ?? item.profit ?? 0),
            profitShare: Number(item.profit_share ?? item.profitShare ?? item.profit_sharing_percentage ?? 0),
            riskLevel: item.risk_level ?? item.riskLevel ?? '',
            payoutFrequency: item.payout_frequency ?? item.payoutFrequency ?? '',
            accountId: item.mt5_login ?? item.account_id ?? item.accountId ?? '',
            isEnabled: isEnabled,
          };
        }

        // investor mapping
        const isEnabled = Boolean(item.is_enabled ?? true);
        return {
          id: item.id ?? item.pk ?? idx,
          userId: item.user_id ?? item.user ?? item.userId ?? '',
          investorName: item.investor_name ?? item.username ?? item.investorName ?? `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() ?? '',
          investorEmail: item.investorEmail ?? item.email ?? item.investor_email ?? '',
          managerName: item.manager_name ?? item.mam_master_account_name ?? item.mam_master_account?.user?.username ?? item.managerName ?? '',
          tradingAccountId: item.pamm_mt5_login ?? item.tradingAccountId ?? item.trading_account_id ?? item.accountId ?? item.account_id ?? '',
          // Deposit amount reported by backend is `amount`; prefer it for Amount Invested
          amountInvested: Number(item.amount ?? item.amountInvested ?? item.amount_invested ?? item.invested_amount ?? item.balance ?? 0),
          // Withdraw / net current amount reported by backend is `net_current_amount` — show it in Profit column
          profit: Number(item.net_profit_loss ?? item.netCurrentAmount ?? item.net_profit_loss ?? item.profit ?? item.total_profit ?? 0),
          // Preserve PAM/investment identifiers for deposit flows
          pamAccountId: item.pam_account ?? item.pamAccount ?? null,
          pammMt5Login: item.pamm_mt5_login ?? item.pammMt5Login ?? null,
          investorUserId: item.investor ?? item.user_id ?? item.user ?? null,
          isEnabled: isEnabled,
        };
      });

      setData(mapped);
      return { data: mapped, total };
    } catch {
      return { data: [], total: 0 };
    }
  }, [activeTab]);

  return (
    <div className={`p-6 max-w-9xl mx-auto relative ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Background blur for table when modal is open */}
      {(depositModalOpen || withdrawModalOpen || creditInModalOpen || creditOutModalOpen || disableModalOpen || historyModalOpen) && (
        <div className={blurOverlayCls}></div>
      )}

      <div className="flex gap-4 mb-4  relative">
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "pam"
              ? activeTabCls
              : inactiveTabCls
          }`}
          onClick={() => {
            setActiveTab("pam");
            const params = new URLSearchParams(location.search);
            params.set("tab", "pam");
            navigate(`/pamaccount?${params.toString()}`, { replace: true });
          }}
        >
          PAM Account
        </button>
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "investor"
              ? activeTabCls
              : inactiveTabCls
          }`}
          onClick={() => {
            setActiveTab("investor");
            const params = new URLSearchParams(location.search);
            params.set("tab", "investor");
            navigate(`/pamaccount?${params.toString()}`, { replace: true });
          }}
        >
          Investor's List
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
          data={data}
          serverSide={true}
          onFetch={handleFetch}
          onRowClick={toggleRowExpanded}
          renderRowSubComponent={renderRowSubComponent}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[999] animate-pulse ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      <DepositModal
        visible={depositModalOpen}
        onClose={handleCloseDepositModal}
        accountId={modalAccountId}
        depositContext={depositContext}
      />
      <WithdrawModal
        visible={withdrawModalOpen}
        onClose={handleCloseWithdrawModal}
        accountId={modalAccountId}
      />
      <CreditInModal
        visible={creditInModalOpen}
        onClose={handleCloseCreditInModal}
        accountId={modalAccountId}
      />
      <CreditOutModal
        visible={creditOutModalOpen}
        onClose={handleCloseCreditOutModal}
        accountId={modalAccountId}
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

export default PamAccount;
