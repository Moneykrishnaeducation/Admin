import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeftRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

// API call utility
const apiCall = async (endpoint, options = {}) => {
  const baseURL = window.location.origin;
  const url = `${baseURL}/${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

/* Small selectable account card used in lists */
function AccountCard({ acc, selected, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left cursor-pointer rounded-lg p-3 border transition-all flex items-center justify-between ${
        selected
          ? isDarkMode
            ? 'border-yellow-400 bg-yellow-400/10'
            : 'border-yellow-500 bg-yellow-50'
          : isDarkMode
          ? 'border-gray-700 bg-gray-900 hover:border-yellow-400/40'
          : 'border-gray-300 bg-white hover:border-yellow-50'
      }`}
    >
      <div>
        <p className="text-sm font-semibold">{acc.account_id}</p>
        <p className="text-xs opacity-70">{acc.group_alias || acc.account_type}</p>
      </div>
      <div className={`text-sm font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
        ${acc.balance.toFixed(2)}
      </div>
    </button>
  );
}

export default function InternalTransfer() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Debounce refs
  const fromSearchTimeoutRef = useRef(null);
  const toSearchTimeoutRef = useRef(null);

  // Fetch non-demo accounts
  useEffect(() => {
    setMessage({ type: "", text: "" });
    fetchAccounts();
  }, []);

  const fetchAccounts = async (searchTerm = '') => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const url = searchTerm 
        ? `api/admin/non-demo-accounts/?search=${encodeURIComponent(searchTerm)}`
        : 'api/admin/non-demo-accounts/';
      
      const data = await apiCall(url);
      const accountsList = Array.isArray(data) ? data : (data.accounts || []);
      
      setAccounts(accountsList);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setMessage({ type: "error", text: "Failed to load accounts. Please try again." });
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter accounts based on search term (client-side fallback for already loaded accounts)
  const filterAccounts = (searchTerm, accountList) => {
    if (!searchTerm) return accountList;
    const term = searchTerm.toLowerCase();
    return accountList.filter(acc => 
      acc.account_id.toString().includes(term) ||
      (acc.user_email && acc.user_email.toLowerCase().includes(term)) ||
      (acc.user_name && acc.user_name.toLowerCase().includes(term))
    );
  };

  const selectedFromAccount = accounts.find(acc => acc.account_id === fromAccount);
  const selectedToAccount = accounts.find(acc => acc.account_id === toAccount);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validation
    if (!fromAccount || !toAccount || !amount) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    if (fromAccount === toAccount) {
      setMessage({ type: "error", text: "Cannot transfer to the same account" });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    if (selectedFromAccount && transferAmount > selectedFromAccount.balance) {
      setMessage({ type: "error", text: "Insufficient balance in source account" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiCall('api/admin/internal-transfer/', {
        method: 'POST',
        body: JSON.stringify({
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: transferAmount,
          comment: comment || 'Internal Transfer'
        })
      });

      if (response.success || response.status === 'success') {
        setMessage({ type: "success", text: response.message || "Transfer completed successfully!" });
        // Clear form
        setFromAccount("");
        setToAccount("");
        setFromSearch("");
        setToSearch("");
        setAmount("");
        setComment("");
        // Refresh accounts after 1 second
        setTimeout(() => {
          fetchAccounts();
        }, 1000);
      } else {
        const errorMsg = response.message || response.error || "Transfer failed";
        if (response.code === 'cent_conversion_blocked' || errorMsg.toLowerCase().includes('cent')) {
          setMessage({ type: "error", text: "CENT account transfers are not allowed. Please contact support." });
        } else {
          setMessage({ type: "error", text: errorMsg });
        }
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to process transfer. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'standard': return 'Live';
      case 'mam': return 'MAM Master';
      case 'mam_investment': return 'MAM Investment';
      default: return type;
    }
  };

  const formatAccountDisplay = (acc) => {
    const alias = acc.group_alias || getAccountTypeLabel(acc.account_type);
    const balance = acc.balance.toFixed(2);
    const userName = acc.user_name || acc.user_email || '';
    return `${acc.account_id} - ${alias} - ${userName} - $${balance}`;
  };
  const handleFromAccountSelect = (accountId) => {
    setFromAccount(accountId);
    const acc = accounts.find(a => a.account_id === accountId);
    setFromSearch(acc ? `${acc.account_id} - ${acc.user_email || acc.user_name || ''}` : '');
    setShowFromDropdown(false);
  };

  const handleToAccountSelect = (accountId) => {
    setToAccount(accountId);
    const acc = accounts.find(a => a.account_id === accountId);
    setToSearch(acc ? `${acc.account_id} - ${acc.user_email || acc.user_name || ''}` : '');
    setShowToDropdown(false);
  };

  const handleFromSearchChange = (value) => {
    setFromSearch(value);
    setFromAccount('');
    setShowFromDropdown(true);
    
    // Clear previous timeout
    if (fromSearchTimeoutRef.current) {
      clearTimeout(fromSearchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    fromSearchTimeoutRef.current = setTimeout(() => {
      fetchAccounts(value);
    }, 300); // 300ms debounce
  };

  const handleToSearchChange = (value) => {
    setToSearch(value);
    setToAccount('');
    setShowToDropdown(true);
    
    // Clear previous timeout
    if (toSearchTimeoutRef.current) {
      clearTimeout(toSearchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    toSearchTimeoutRef.current = setTimeout(() => {
      fetchAccounts(value);
    }, 300); // 300ms debounce
  };
  const isSuccess = message.type === 'success' || /success/i.test(message.text || '');

  return (
    <div className={`w-full overflow-y-auto p-4 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-400/20'}`}>
              <ArrowLeftRight className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Internal Transfer</h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Transfer funds between user trading accounts
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAccounts()}
            disabled={loading}
            className={`p-2 rounded-lg transition-all ${
              isDarkMode 
                ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-md'}`}>
            <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-yellow-400" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-md'}`}>
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
            <p className={`text-base font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No accounts available
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No eligible accounts found for internal transfers
            </p>
          </div>
        ) : (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-white shadow-md'}`}>
            <form onSubmit={handleTransfer} className="space-y-4">
              {/* From & To - side by side on md+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  From Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fromSearch}
                  onChange={(e) => handleFromSearchChange(e.target.value)}
                  onFocus={() => setShowFromDropdown(true)}
                  onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                  placeholder="Search by account ID or email"
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${fromAccount ? 'border-green-300' : ''} ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500'
                  } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-400/20' : 'focus:ring-yellow-500/20'}`}
                  required
                />
                {showFromDropdown && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}>
                    {filterAccounts(fromSearch, accounts).map(acc => (
                      <div
                        key={acc.account_id}
                        onClick={() => handleFromAccountSelect(acc.account_id)}
                        className={`px-3 py-2 cursor-pointer text-sm hover:bg-yellow-50 ${
                          isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        {formatAccountDisplay(acc)}
                      </div>
                    ))}
                    {filterAccounts(fromSearch, accounts).length === 0 && fromSearch && (
                      <div className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No accounts found
                      </div>
                    )}
                  </div>
                )}
                {selectedFromAccount && (
                  <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Available Balance: <span className="font-semibold text-yellow-400">${selectedFromAccount.balance.toFixed(2)}</span>
                  </p>
                )}
                {/* Visible searchable list of accounts (cards) */}
                <div className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-44 overflow-y-auto">
                    {filterAccounts(fromSearch, accounts).map(acc => (
                      <AccountCard
                        key={acc.account_id}
                        acc={acc}
                        selected={fromAccount === acc.account_id}
                        onClick={() => handleFromAccountSelect(acc.account_id)}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </div>
                </div>
                </div>

                {/* To Account */}
                <div className="relative">
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  To Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={toSearch}
                  onChange={(e) => handleToSearchChange(e.target.value)}
                  onFocus={() => setShowToDropdown(true)}
                  onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                  placeholder="Search by account ID or email"
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${toAccount ? 'border-green-300' : ''} ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500'
                  } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-400/20' : 'focus:ring-yellow-500/20'}`}
                  required
                />
                {showToDropdown && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}>
                    {filterAccounts(toSearch, accounts)
                      .filter(acc => acc.account_id !== fromAccount)
                      .map(acc => (
                        <div
                          key={acc.account_id}
                          onClick={() => handleToAccountSelect(acc.account_id)}
                          className={`px-3 py-2 cursor-pointer text-sm hover:bg-yellow-50 ${
                            isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-900'
                          }`}
                        >
                          {formatAccountDisplay(acc)}
                        </div>
                      ))}
                    {filterAccounts(toSearch, accounts).filter(acc => acc.account_id !== fromAccount).length === 0 && toSearch && (
                      <div className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No accounts found
                      </div>
                    )}
                  </div>
                )}
                {/* Visible searchable list of accounts (cards) */}
                <div className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-44 overflow-y-auto">
                    {filterAccounts(toSearch, accounts)
                      .filter(acc => acc.account_id !== fromAccount)
                      .map(acc => (
                        <AccountCard
                          key={acc.account_id}
                          acc={acc}
                          selected={toAccount === acc.account_id}
                          onClick={() => handleToAccountSelect(acc.account_id)}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                  </div>
                </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500'
                  } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-400/20' : 'focus:ring-yellow-500/20'}`}
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Comment (Optional)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter transfer note or reference"
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500'
                  } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-400/20' : 'focus:ring-yellow-500/20'}`}
                />
              </div>

              {/* Message */}
              {message.text && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  isSuccess
                    ? isDarkMode ? 'bg-green-600/20 border border-green-500/30 text-green-300' : 'bg-green-50 border border-green-300 text-green-700'
                    : isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {isSuccess ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                  )}
                  <p className="text-xs">{message.text}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !fromAccount || !toAccount || !amount || isSuccess}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  isSubmitting || !fromAccount || !toAccount || !amount || isSuccess
                    ? isSuccess
                      ? (isDarkMode ? 'bg-green-500 cursor-default' : 'bg-green-400 cursor-default')
                      : 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing Transfer...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-white" />
                    Transfer Completed
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-5 h-5" />
                    Execute Transfer
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Info Box */}
        <div className={`mt-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            <AlertCircle className="w-4 h-4" />
            Important Information
          </h3>
          <ul className={`text-xs space-y-0.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            <li>• Internal transfers are processed instantly between user accounts</li>
            <li>• Only live, MAM, and investment accounts are eligible</li>
            <li>• CENT and demo accounts cannot be used for internal transfers</li>
            <li>• Ensure sufficient balance before initiating transfer</li>
            <li>• All transfers are logged in the activity history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
