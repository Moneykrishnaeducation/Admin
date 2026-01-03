// @/Admin/src/Modals/TradingAccountModal.jsx

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  Wallet,
  CreditCard,
  PlusCircle,
  MinusCircle,
  Ban,
  CheckCircle,
  BarChart3,
  User,
  Clock3,
  X,
} from "lucide-react";
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import CreditInModal from './CreditInModal';
import CreditOutModal from './CreditOutModal';
import ChangeLeverageModal from './ChangeLeverageModal';
import DisableModal from './DisableModal';
import AlgoTradingModal from './AlgoTradingModal';
import HistoryModal from './HistoryModal';
import ChangeUserProfileModal from './ChangeUserProfileModal';
import SubRowButtons from "../commonComponent/SubRowButtons";

const TradingAccountModal = ({
  visible,
  onClose,
  accounts = [],
  actionItems = null,
  userId = null,
}) => {
  const modalRef = useRef(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [activeOperation, setActiveOperation] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const { isDarkMode } = useTheme();

  // Operation form states
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [leverage, setLeverage] = useState("1:100");
  const [algoEnabled, setAlgoEnabled] = useState(false);
  const [disableAction, setDisableAction] = useState("Disable");
  const [historyTab, setHistoryTab] = useState("transactions");
  const [availableGroups, setAvailableGroups] = useState([]);
  const [accountsState, setAccountsState] = useState([]);
  const [filterAccountType, setFilterAccountType] = useState('all');

  
  // Close if clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (visible && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, onClose]);

  // Fetch accounts when `userId` is provided (use when modal opened for a specific user)
  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;

    (async () => {
      try {
        let endpoint = `ib-user/${userId}/trading-accounts/`;
        // Add server-side account_type filter if set
        if (filterAccountType && filterAccountType !== 'all') {
          endpoint += `?account_type=${encodeURIComponent(filterAccountType)}`;
        }
        const headers = { "Content-Type": "application/json" };
        const res = await fetch(endpoint, { credentials: "include", headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        const json = await res.json();
        const items = json?.data || json?.accounts || [];
        const mapped = (Array.isArray(items) ? items : []).map((u) => ({
          // map API fields to component expected shape
          id: u.id ?? u.pk,
          userId: u.user_id ?? u.userId ?? u.user,
          name: u.account_name || u.username || u.name || "-",
          email: u.email || "",
          accountId: u.account_id || u.accountId || u.accountNo || "-",
          balance: typeof u.balance === "number" ? u.balance : parseFloat(u.balance) || 0,
          accountType: u.account_type || u.accountType || "-",
          leverage: u.leverage ?? "-",
          availableGroups: u.group_name ? [u.group_name] : [],
          raw: u,
        }));
        if (!cancelled) setAccountsState(mapped);
      } catch (err) {
        console.error("Failed to fetch trading accounts for user", userId, err);
        if (!cancelled) setAccountsState([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, visible, filterAccountType]);

  if (!visible) return null;

  // ======================================
  // Operation Handlers
  // ======================================

  const handleOperationSubmit = (operationType, payload = {}) => {
    console.log(`${operationType} submitted:`, {
      account: selectedAccount?.accountId,
      payload,
      // legacy states (kept for backward compatibility)
      depositAmount,
      withdrawAmount,
      creditAmount,
      leverage,
      algoEnabled,
    });
    // TODO: Call API based on operationType and payload
    resetOperationForm();
  };

  const handleProfileSubmit = (groupId) => {
    handleOperationSubmit('profile', { groupId });
  };

  const resetOperationForm = () => {
    setActiveOperation(null);
    setSelectedAccount(null);
    setDepositAmount("");
    setWithdrawAmount("");
    setCreditAmount("");
    setLeverage("1:100");
    setAlgoEnabled(false);
  };

  // renderOperationForm removed — using dedicated modal components below

  // ======================================
  // Action Items Builder (supports external `actionItems` prop)
  // - Accepts `actionItems` as an array of:
  //   - strings (operation names),
  //   - objects { label, operation, icon, onClick }
  //   - objects with `onClick` callback (will be called with the row)
  // - Falls back to internal default items when `actionItems` is not provided
  // ======================================

  const defaultActionItems = (row) => [
    {
      icon: <Wallet size={18} />,
      label: "Deposit",
      operation: "deposit",
    },
    {
      icon: <CreditCard size={18} />,
      label: "Withdrawal",
      operation: "withdraw",
    },
    {
      icon: <PlusCircle size={18} />,
      label: "Credit In",
      operation: "creditIn",
    },
    {
      icon: <MinusCircle size={18} />,
      label: "Credit Out",
      operation: "creditOut",
    },
    {
      icon: <Ban size={18} />,
      label: "Disable",
      operation: "disable",
    },
    {
      icon: <CheckCircle size={18} />,
      label: "Enable Algo",
      operation: "algo",
    },
    {
      icon: <BarChart3 size={18} />,
      label: "Leverage",
      operation: "leverage",
    },
    {
      icon: <User size={18} />,
      label: "Profile",
      operation: "profile",
    },
    {
      icon: <Clock3 size={18} />,
      label: "History",
      operation: "history",
    },
  ].map((it) => ({
    icon: it.icon,
    label: it.label,
    onClick: () => {
      setSelectedAccount(row);
      setActiveOperation(it.operation);
    },
  }));

  const normalizeActionItems = (items, row) => {
    if (!Array.isArray(items)) return defaultActionItems(row);

    return items
      .map((it) => {
        if (!it) return null;

        // simple string -> treat as operation name
        if (typeof it === "string") {
          const op = it;
          const label = op.charAt(0).toUpperCase() + op.slice(1);
          return {
            icon: null,
            label,
            onClick: () => {
              setSelectedAccount(row);
              setActiveOperation(op);
            },
          };
        }

        // object with explicit onClick
        if (typeof it.onClick === "function") {
          return {
            icon: it.icon || null,
            label: it.label || it.operation || "Action",
            onClick: () => it.onClick(row),
          };
        }

        // object with operation (map to internal handler)
        const op = it.operation || (it.label && it.label.toLowerCase());
        return {
          icon: it.icon || null,
          label: it.label || op,
          onClick: () => {
            setSelectedAccount(row);
            setActiveOperation(op);
          },
        };
      })
      .filter(Boolean);
  };

  const getActionItems = (row) => {
    if (Array.isArray(actionItems) && actionItems.length) {
      return normalizeActionItems(actionItems, row);
    }
    return defaultActionItems(row);
  };

  const overlayBg = isDarkMode ? "bg-black/70" : "bg-black/50";
  const modalBase = isDarkMode
    ? "bg-gray-900 text-gray-100"
    : "bg-white text-gray-900";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const headerText = isDarkMode ? "text-gray-100" : "text-gray-900";

  const displayAccounts = Array.isArray(accounts) && accounts.length ? accounts : accountsState;


  return (
    <div className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}>
      <div
        ref={modalRef}
        className={`${modalBase} rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-5`}
      >
        {/* Modal Header */}
        <div className={`flex justify-between items-center border-b ${borderColor} pb-3 mb-4`}>
          <h2 className={`text-xl font-semibold ${headerText}`}>Trading Accounts</h2>
          <button
            aria-label="Close modal"
            className={`text-2xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-700"} hover:text-red-500`}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="flex items-center gap-3 mb-3">
            <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Account Type:</label>
            <select
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
              className={`px-2 py-1 rounded ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} border ${borderColor}`}
            >
              <option value="all">All</option>
              <option value="standard">standard</option>
              <option value="mam">mam</option>
              <option value="mam_investment">mam_investment</option>
            </select>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className={`text-left ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>User Name</th>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Account ID</th>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Email</th>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Balance</th>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Account Type</th>
                <th className={`p-3 border ${borderColor} text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Action</th>
              </tr>
            </thead>

            <tbody>
              {displayAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className={`p-4 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No Accounts Found
                  </td>
                </tr>
              ) : (
                displayAccounts.map((row) => (
                  <React.Fragment key={row.accountId}>
                    {/* Main Row */}
                    <tr className={`${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
                      <td className={`p-3 border ${borderColor}`}>{row.name}</td>
                      <td className={`p-3 border ${borderColor}`}>{row.accountId}</td>
                      <td className={`p-3 border ${borderColor}`}>{row.email}</td>
                      <td className={`p-3 border ${borderColor}`}>{row.balance || "$0"}</td>
                      <td className={`p-3 border ${borderColor}`}>{row.accountType}</td>
                      <td className={`p-3 border ${borderColor}`}>
                        <button
                          className={`inline-flex items-center justify-center px-3 py-1 rounded ${isDarkMode ? "bg-yellow-400 text-black" : "bg-yellow-500 text-black"} hover:bg-yellow-600`}
                          onClick={() =>
                            setExpandedRowId((p) =>
                              p === row.accountId ? null : row.accountId
                            )
                          }
                        >
                          Actions
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Action Row */}
                    {expandedRowId === row.accountId && (
                      <tr>
                        <td
                          className={`p-0 border ${borderColor} ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
                          colSpan={6}
                        >
                          <div className="flex flex-wrap gap-2 p-3">
                            <SubRowButtons actionItems={getActionItems(row)} />
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* operation form now uses dedicated modal components (rendered below) */}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Operation Modals (rendered as overlays) */}
        <DepositModal
          visible={activeOperation === 'deposit' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          onSubmit={(data) => handleOperationSubmit('deposit', data)}
        />

        <WithdrawModal
          visible={activeOperation === 'withdraw' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          onSubmit={(data) => handleOperationSubmit('withdraw', data)}
        />

        <CreditInModal
          visible={activeOperation === 'creditIn' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          onSubmit={(data) => handleOperationSubmit('creditIn', data)}
        />

        <CreditOutModal
          visible={activeOperation === 'creditOut' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          onSubmit={(data) => handleOperationSubmit('creditOut', data)}
        />

        <ChangeLeverageModal
          visible={activeOperation === 'leverage' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          currentLeverage={selectedAccount?.leverage || leverage}
          leverageOptions={["1:10","1:50","1:100","1:200","1:500","1:1000"]}
          onUpdate={(newLev) => handleOperationSubmit('leverage', { newLeverage: newLev })}
        />

        <DisableModal
          visible={activeOperation === 'disable' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          action={disableAction}
          onActionChange={() => setDisableAction((p) => (p === 'Disable' ? 'Enable' : 'Disable'))}
          onConfirm={() => handleOperationSubmit('disable', { action: disableAction })}
        />

        <AlgoTradingModal
          visible={activeOperation === 'algo' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          onProceed={(act) => handleOperationSubmit('algo', { action: act })}
        />

        <HistoryModal
          visible={activeOperation === 'history' && !!selectedAccount}
          onClose={resetOperationForm}
          accountId={selectedAccount?.accountId}
          activeTab={historyTab}
          setActiveTab={setHistoryTab}
        />
        
        <ChangeUserProfileModal
          visible={activeOperation === 'profile' && !!selectedAccount}
          onClose={resetOperationForm}
          groups={selectedAccount?.availableGroups || availableGroups}
          onSubmit={(groupId) => handleProfileSubmit(groupId)}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default TradingAccountModal;
