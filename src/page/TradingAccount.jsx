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

const _currencyFormatter = (v) => {
  if (typeof v !== "number") return v;

};


const TradingAccountPage = () => {
    const [activeClientFilter, setActiveClientFilter] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
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
  // const [disableModalClosed, setDisableModalClosed] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [algoModalOpen, setAlgoModalOpen] = useState(false);
  const [leverageModalOpen, setLeverageModalOpen] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedLeverage, setSelectedLeverage] = useState("1:500");

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Change Profile modal state and data
  const [changeProfileOpen, setChangeProfileOpen] = useState(false);
  const [profileAccountId, setProfileAccountId] = useState(null);

  // Internal transfer modal state
  const [internalTransferOpen, setInternalTransferOpen] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]); // Store all accounts for modal

  // Fetch all trading accounts (for modals like internal transfer)
  const fetchAllAccounts = React.useCallback(async () => {
    try {
      // Try multiple endpoints until one works
      const endpoints = [
        "/api/admin/trading-accounts/",
        "/admin/trading-accounts/",
        "/api/trading-accounts/"
      ];
      
      let resJson = null;
      let successfulEndpoint = null;
      
      for (const endpoint of endpoints) {
        try {
          const params = new URLSearchParams();
          params.set("page", "1");
          params.set("page_size", "1000");
          // Don't send 'all=1' - let backend default to standard accounts
          
          const url = `${endpoint}?${params.toString()}`;
          // console.log("Trying endpoint:", url);
          
          const headers = { "Content-Type": "application/json" };
          const res = await fetch(url, { credentials: "include", headers });
          
          if (res.ok) {
            resJson = await res.json();
            successfulEndpoint = endpoint;
            // console.log(`✅ Success with endpoint: ${endpoint}`, resJson);
            break;
          }
        } catch (e) {
          console.warn(`❌ Failed endpoint: ${endpoint}`, e);
          continue;
        }
      }
      
      if (!resJson) {
        console.error("All endpoints failed");
        setAllAccounts([]);
        return;
      }
      
      let items = [];
      if (Array.isArray(resJson.results)) {
        items = resJson.results;
      } else if (Array.isArray(resJson.data)) {
        items = resJson.data;
      } else if (Array.isArray(resJson)) {
        items = resJson;
      }
      
      // console.log(`Found ${items.length} accounts from ${successfulEndpoint}`);
      
      // if (items.length > 0) {
      //   console.log("First account sample:", items[0]);
      // }
      
      const mapped = items.map((u) => {
        return {
          userId: u.user_id || u.id || "-",
          name: u.account_name || u.username || "-",
          email: u.email || "-",
          accountId: u.account_id || "-",
          balance: typeof u.balance === "number" ? u.balance : 0,
          leverage: u.leverage || "-",
          status: u.status === "active" ? "Running" : "Stopped",
          country: u.country || "-",
          isEnabled: u.is_enabled !== undefined ? Boolean(u.is_enabled) : true,
        };
      });
      
      // console.log("Final mapped accounts for modal:", mapped);
      setAllAccounts(mapped);
    } catch  {
      // console.error("Failed to fetch all accounts:", err);
      setAllAccounts([]);
    }
  }, []);

  // Fetch all accounts on component mount
  React.useEffect(() => {
    fetchAllAccounts();
  }, [fetchAllAccounts]);

  // fetch users (admin) with pagination - using server-side pagination
  const handleFetch = React.useCallback(
    async ({ page = 1, pageSize = 10, query = "" } = {}) => {
      setCurrentPage(page);
      setCurrentPageSize(pageSize);
      const endpoint = "/api/admin/trading-accounts/";
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (query) params.set("query", query);
      // Backend-driven filtering - don't send 'all=1', let backend default to standard accounts
      if (activeClientFilter === '1') {
        params.set("active", "1");
      } else if (activeClientFilter === '0') {
        params.set("inactive", "1");
      }
      try {
        setLoading(true);
        const client = typeof window !== "undefined" && window.adminApiClient ? window.adminApiClient : null;
        let resJson;
        if (client && typeof client.get === "function") {
          resJson = await client.get(`${endpoint}?${params.toString()}`);
        } else {
          const headers = { "Content-Type": "application/json" };
          const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: "include", headers });
          if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
          resJson = await res.json();
        }
        const items = Array.isArray(resJson.data)
          ? resJson.data
          : Array.isArray(resJson)
            ? resJson
            : resJson.results || [];
        const totalCount =
          typeof resJson.total === "number"
            ? resJson.total
            : typeof resJson.count === "number"
              ? resJson.count
              : items.length;
        let mapped = items.map((u) => {
          const isEnabled = Boolean(u.is_enabled);
          const balance = typeof u.balance === "number" ? u.balance : 0;
          return {
            userId: u.user_id ?? u.id ?? u.pk,
            name: u.account_name || u.username || "-",
            email: u.email,
            accountId: u.account_id || "-",
            balance,
            leverage: u.leverage || "-",
            status: u.status ? "Running" : "Stopped",
            country: u.country || "-",
            isEnabled: isEnabled,
            groupName: u.group_name || "",
            alias: u.alias || "",
            activeClient: Number(balance) >= 10 ? 1 : 0,
          };
        });
        setTotal(totalCount);
        setData(mapped);
        return { data: mapped, total: totalCount };
      }
      finally {
        setLoading(false);
      }
    },
    [activeClientFilter]
  );

  // Reference for modal backdrop to handle outside click
  const _interTransModalRef = useRef(null);

  // ======================
  // Modal Handlers
  // ======================

  const handleOpenDepositModal = (row) => {
    setModalAccountId(row.accountId);
    setDepositModalOpen(true);
  };
  // Parent handler receives response object from DepositModal via onSubmit
  const handleDeposit = (res) => {
    // res may be the server response object or a payload with amount/accountId
    let amount = null;
    let acct = modalAccountId;
    let comment = "";
    if (!res) {
      setDepositModalOpen(false);
      return;
    }
    if (typeof res === "object") {
      amount = res.amount ?? res.new_balance ?? (res.transaction && res.transaction.amount) ?? null;
      acct = res.account_id ?? res.accountId ?? acct;
      comment = res.comment ?? "";
    }
    if (amount != null) {
      alert(`Deposited $${amount} to ${acct}\nComment: ${comment}`);
    }
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = (row) => {
    setModalAccountId(row.accountId);
    setWithdrawModalOpen(true);
  };
  const handleWithdraw = (res) => {
    let amount = null;
    let acct = modalAccountId;
    let comment = "";
    if (!res) {
      setWithdrawModalOpen(false);
      return;
    }
    if (typeof res === "object") {
      amount = res.amount ?? res.new_balance ?? (res.transaction && res.transaction.amount) ?? null;
      acct = res.account_id ?? res.accountId ?? acct;
      comment = res.comment ?? "";
    }
    if (amount != null) {
      alert(`Withdrew $${amount} from ${acct}\nComment: ${comment}`);
    }
    setWithdrawModalOpen(false);
  };

  const handleOpenCreditInModal = (row) => {
    setModalAccountId(row.accountId);
    setCreditInModalOpen(true);
  };
  const handleCreditIn = (res) => {
    let amount = null;
    let acct = modalAccountId;
    let comment = "";
    if (!res) {
      setCreditInModalOpen(false);
      return;
    }
    if (typeof res === "object") {
      amount = res.amount ?? res.new_balance ?? (res.transaction && res.transaction.amount) ?? null;
      acct = res.account_id ?? res.accountId ?? acct;
      comment = res.comment ?? "";
    }
    if (amount != null) {
      alert(`Credit In $${amount} to ${acct}\nComment: ${comment}`);
    }
    setCreditInModalOpen(false);
  };

  const handleOpenCreditOutModal = (row) => {
    setModalAccountId(row.accountId);
    setCreditOutModalOpen(true);
  };
  const handleCreditOut = (res) => {
    let amount = null;
    let acct = modalAccountId;
    let comment = "";
    if (!res) {
      setCreditOutModalOpen(false);
      return;
    }
    if (typeof res === "object") {
      amount = res.amount ?? res.new_balance ?? (res.transaction && res.transaction.amount) ?? null;
      acct = res.account_id ?? res.accountId ?? acct;
      comment = res.comment ?? "";
    }
    if (amount != null) {
      alert(`Credit Out $${amount} from ${acct}\nComment: ${comment}`);
    }
    setCreditOutModalOpen(false);
  };

  const handleOpenDisableModal = (row) => {
    setDisableAccountId(row.accountId);
    setDisableAction(row.isEnabled ? "Disable Account" : "Enable Account");
    setDisableModalOpen(true);
  };

  // Direct toggle function for expand row button
  const handleToggleAccountStatus = async (account) => {
    try {
      const payload = {
        accountId: account.accountId,
        action: account.isEnabled ? "disable" : "enable",
      };

      const response = await fetch(`/api/admin/toggle-account-status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update account status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update state with the response data
      setData(prevData =>
        prevData.map(acc =>
          acc.accountId === account.accountId
            ? { ...acc, isEnabled: result.is_enabled }
            : acc
        )
      );

      showToast(`Account ${account.accountId} ${result.is_enabled ? 'Enabled' : 'Disabled'}`, 'success');
    } catch (error) {
      console.error('Error updating account status:', error);
      showToast('Failed to update account status: ' + error.message, 'error');
    }
  };

  // Keep this for the modal
  const handleDisableProceed = () => {
    handleToggleAccountStatus({ accountId: disableAccountId });
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
    { Header: "Alias", accessor: "alias" },
    {
      Header: "Balance",
      accessor: "balance",
    },
    { Header: "Leverage", accessor: "leverage" },
    {
      Header: "Active Client",
      accessor: "activeClient",
      Cell: (value, row) => {
        // Use balance to determine label
        const bal = Number(row && row.balance);
        return (
          <span className={bal >= 10 ? "text-green-500 font-bold" : "text-gray-400"}>
            {bal >= 10 ? "Active" : "Inactive"}
          </span>
        );
      },
    },
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
    // { Header: "Country", accessor: "country" },
  ];

  const onRowClick = (row) => {
    setExpandedId((prev) => (prev === row.accountId ? null : row.accountId));
  };

  // ======================
  // Row Subcomponent
  // ======================

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedId === row.accountId;
    
    // Get the latest account data from the state to ensure we have current isEnabled status
    const currentAccount = data.find(acc => acc.accountId === row.accountId) || row;


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
            className="text-yellow-400 rounded p-2 flex gap-3 flex-wrap items-center justify-between"
          >
            <SubRowButtons actionItems={actionItems} />
            <div className="flex items-center gap-2 ml-auto">
              <span className={`text-sm font-semibold ${currentAccount.isEnabled ? "text-green-400" : "text-red-400"}`}>
                {currentAccount.isEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={() => handleToggleAccountStatus(currentAccount)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${currentAccount.isEnabled ? "bg-green-500" : "bg-red-500"
                  } hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-transform duration-300 ${currentAccount.isEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                />
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-4 relative">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-end gap-3">
        <div className="flex gap-4 w-full md:w-auto justify-end">
          <select
            className="w-48 py-2 px-3 text-base font-semibold border-2 rounded-md shadow-sm bg-yellow-100 text-yellow-700 border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={activeClientFilter}
            onChange={e => setActiveClientFilter(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="">All Clients</option>
            <option value="1">Active Clients</option>
            <option value="0">Inactive Clients</option>
          </select>
          <button
            className="bg-yellow-400 mx-2 w-full md:w-auto text-black px-4 py-2 rounded-md font-semibold flex items-center gap-2 hover:opacity-90 transition"
            onClick={() => setInternalTransferOpen(true)}
          >
            <span>➕</span>
            Internal Transfer
          </button>
        </div>
      </div>
      {error && <div className="text-red-400 mb-2">{error}</div>}

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

      {/* Internal Transfer Button moved above */}

      {/* Show correct range and total above table */}
      <div className="text-right text-sm text-gray-500 mb-2">
        {total > 0 ? (
          <>
            Showing {(currentPage - 1) * currentPageSize + 1}
            {' '}to {Math.min(currentPage * currentPageSize, total)}
            {' '}of {total} {activeClientFilter === '1' ? 'Active' : activeClientFilter === '0' ? 'Inactive' : ''} Clients
            <br />
          </>
        ) : (
          <>No Clients Found</>
        )}
      </div>
      <TableStructure
        columns={columns}
        serverSide={true}
        data={data}
        isLoading={loading}
        onFetch={handleFetch}
        renderRowSubComponent={renderRowSubComponent}
        onRowClick={onRowClick}
        total={total}
      />

      {/* Modals */}
      <InternalTransferModal
        visible={internalTransferOpen}
        onClose={() => setInternalTransferOpen(false)}
        accounts={allAccounts.map(d => ({
          account_no: d.accountId,
          account_name: d.name,
          email: d.email,
          balance: d.balance
        }))}
      />
      <AlgoTradingModal
        visible={algoModalOpen}
        onClose={() => setAlgoModalOpen(false)}
        accountId={selectedAccountId}
        onProceed={(action) => {action==="enable" ? showToast(`Algo Trading ${action} for ${selectedAccountId}`, 'success') : showToast(`Algo Trading Disabled for ${selectedAccountId}`, 'error'); setAlgoModalOpen(false);}}
      />

      <ChangeLeverageModal
        visible={leverageModalOpen}
        accountId={selectedAccountId}
        onClose={() => setLeverageModalOpen(false)}
        currentLeverage={selectedLeverage}
        leverageOptions={["1:50", "1:100", "1:200", "1:300", "1:500"]}
        onUpdate={(newLev) => {
          // Update the selected leverage immediately
          setSelectedLeverage(newLev);
          // Update the data array with new leverage
          setData(prevData =>
            prevData.map(acc =>
              acc.accountId === selectedAccountId
                ? { ...acc, leverage: newLev }
                : acc
            )
          );
          showToast(`Leverage updated to ${newLev}`, 'success');
        }}
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
	accountId={profileAccountId}
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
