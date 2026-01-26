import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const SearchableSelect = ({ accounts, value, onChange, label, searchValue, onSearchChange, inputBg, labelText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // useEffect(() => {
  //   console.log(`🔍 SearchableSelect [${label}]:`, {
  //     accountsCount: accounts.length,
  //     accounts: accounts,
  //     currentValue: value,
  //     searchValue: searchValue
  //   });
  // }, [accounts, label, value, searchValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter accounts based on search value
  const filteredAccounts = accounts.filter((acc) => {
    if (!acc) return false;
    const accountNo = String(acc.account_no || "").toLowerCase();
    const accountName = String(acc.account_name || "").toLowerCase();
    const balance = String(acc.balance || "");
    const search = searchValue.toLowerCase();
    
    return accountNo.includes(search) || accountName.includes(search) || balance.includes(search);
  });

  // console.log(`Filtered ${filteredAccounts.length} accounts for search: "${searchValue}"`);

  const selectedAccount = accounts.find((acc) => String(acc.account_no) === String(value));

  return (
    <div className="mb-3" ref={dropdownRef}>
      <label className={`block mb-1 ${labelText}`}>{label}</label>
      <div className="relative">
        <button
          className={`w-full px-3 py-2 rounded border text-left ${inputBg} flex justify-between items-center cursor-pointer hover:opacity-80`}
          onClick={() => {
            // console.log(`Toggle dropdown for ${label}, currently: ${isOpen}`);
            setIsOpen(!isOpen);
          }}
          type="button"
        >
          <span>
            {selectedAccount 
              ? `${selectedAccount.account_name || selectedAccount.account_no} (${selectedAccount.account_no}) — ₹${selectedAccount.balance}` 
              : "-- Select Account --"}
          </span>
          <span className="text-lg ml-2">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && accounts.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-1 rounded border shadow-lg z-50 ${inputBg} max-w-full`}>
            <input
              type="text"
              placeholder="Search by name or account number..."
              className={`w-full px-3 py-2 rounded-t border-b ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={searchValue}
              onChange={(e) => {
                // console.log(`Search changed: "${e.target.value}"`);
                onSearchChange(e.target.value);
              }}
              autoFocus
            />
            <ul className="max-h-48 overflow-y-auto">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <li key={acc.account_no}>
                    <button
                      type="button"
                      className={`w-full px-3 py-2 text-left hover:bg-blue-500 hover:text-white transition ${
                        String(value) === String(acc.account_no) ? "bg-blue-500 text-white" : ""
                      }`}
                      onClick={() => {
                        // console.log(`Selected account: ${acc.account_no}`);
                        onChange(acc.account_no);
                        setIsOpen(false);
                        onSearchChange("");
                      }}
                    >
                      <div className="font-semibold">{acc.account_name || acc.account_no}</div>
                      <div className="text-sm opacity-80">{acc.account_no} — ₹{acc.balance}</div>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-4 text-gray-500 text-center">
                  {accounts.length === 0 ? "No accounts available" : `No match for "${searchValue}"`}
                </li>
              )}
            </ul>
          </div>
        )}
        
        {isOpen && accounts.length === 0 && (
          <div className={`absolute top-full left-0 right-0 mt-1 rounded border shadow-lg z-50 ${inputBg} p-3 text-center text-gray-500`}>
            Loading accounts...
          </div>
        )}
      </div>
    </div>
  );
};

const InternalTransferModal = ({ visible, onClose, accounts = [] }) => {
  const modalRef = useRef(null);
  const themeContext = useTheme() || {};
  const { theme = "dark" } = themeContext; // "light" | "dark"

  // form state
  const [fromAcc, setFromAcc] = useState("");
  const [toAcc, setToAcc] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");

  // Debug log accounts
  // useEffect(() => {
  //   console.log("InternalTransferModal received accounts:", accounts);
  // }, [accounts]);

  // toast state
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Close if clicked outside modal content
  useEffect(() => {
    const handler = (e) => {
      if (visible && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, onClose]);

  const handleSubmit = () => {
    const fromAccount = accounts.find(
      (a) => String(a.account_no) === String(fromAcc)
    );

    const toAccount = accounts.find(
      (a) => String(a.account_no) === String(toAcc)
    );

    if (!fromAccount) {
      return showToast("❌ Please select a valid 'From Account'.", "error");
    }

    if (!toAccount) {
      return showToast("❌ Please select a valid 'To Account'.", "error");
    }

    const availableBalance = parseFloat(fromAccount.balance || 0);

    if (!fromAcc || !toAcc || Number(amount) <= 0 || fromAcc === toAcc) {
      return showToast("❌ Transfer failed! Please check inputs.", "error");
    }

    if (Number(amount) > availableBalance) {
      return showToast(
        `❌ Insufficient balance. Available: ${availableBalance}`,
        "error"
      );
    }

    showToast("Processing transfer...", "success");

    // Prepare email recipients based on whether accounts belong to same or different users
    const emailRecipients = [];
    const fromEmail = fromAccount.email;
    const toEmail = toAccount.email;

    if (fromEmail) emailRecipients.push(fromEmail);
    if (toEmail && toEmail !== fromEmail) {
      emailRecipients.push(toEmail);
    }

    // console.log("Email recipients:", emailRecipients);

    // Create email data
    const emailData = {
      recipients: emailRecipients,
      from_account: fromAccount.account_name || fromAccount.account_no,
      from_account_number: fromAcc,
      to_account: toAccount.account_name || toAccount.account_no,
      to_account_number: toAcc,
      amount: Number(amount),
      note: comment,
    };

    // First, send the internal transfer API request
    fetch("/api/accounts/internal-transfer/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        from_account_no: fromAcc,
        to_account_no: toAcc,
        amount: Number(amount),
        note: comment,
      }),
    })
      .then((res) => res.json().then((body) => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status === 200 && body.success) {
          // Send notification emails
          if (emailRecipients.length > 0) {
            sendTransferEmails(emailData);
          }
          showToast("✅ Transfer successful!", "success");
          setTimeout(onClose, 1500);
        } else {
          showToast(body.error || "Transfer failed!", "error");
        }
      })
      .catch(() => showToast("Transfer failed! Please try again.", "error"));
  };

  // Function to send transfer notification emails
  const sendTransferEmails = (emailData) => {
    fetch("/api/admin/send-transfer-notification/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(emailData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("✅ Transfer notification emails sent", "success");
        } else {
          showToast("⚠️ Failed to send notification emails", "error");
        }
      })
      .catch(() => showToast("Error sending emails", "error"));
  };

  if (!visible) return null;

  /* ================= THEME CLASSES ================= */
   const { isDarkMode } = useTheme();

  const overlayBg = "bg-black/50";

  const modalBg = isDarkMode
    ? "bg-black text-white"
    : "bg-white text-black";

  const inputBg = isDarkMode
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-300 text-black";

  const labelText = isDarkMode ? "text-gray-300" : "text-gray-700";

  const cancelBtn = isDarkMode
    ? "bg-gray-700 hover:bg-gray-600 text-white"
    : "bg-gray-300 hover:bg-gray-400 text-black";

  const actionBtn =
    "bg-yellow-500 hover:bg-yellow-600 text-black font-semibold";

  /* ================================================= */

  return (
    <div className={`fixed inset-0 ${overlayBg} flex justify-center items-center z-50`}>
      
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 px-4 py-2 rounded-md text-white shadow-lg ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div
        ref={modalRef}
        className={`rounded-lg w-full relative max-w-md p-6 shadow-2xl ${modalBg} border border-gray-200 dark:border-gray-700`}
      >
        <div className="absolute right-5 top-2">
          <button className={`p-4 ${cancelBtn} bg-transparent text-xl`} onClick={onClose}>
            &times;
          </button>
        </div>
        <h2 className="text-xl font-semibold mb-4">Internal Transfer</h2>

        {/* From Account */}
        <SearchableSelect
          accounts={accounts}
          value={fromAcc}
          onChange={setFromAcc}
          label="From Account"
          searchValue={searchFrom}
          onSearchChange={setSearchFrom}
          inputBg={inputBg}
          labelText={labelText}
        />

        {/* To Account */}
        <SearchableSelect
          accounts={accounts}
          value={toAcc}
          onChange={setToAcc}
          label="To Account"
          searchValue={searchTo}
          onSearchChange={setSearchTo}
          inputBg={inputBg}
          labelText={labelText}
        />

        {/* Amount */}
        <div className="mb-3">
          <label className={`block mb-1 ${labelText}`}>Amount</label>
          <input
            type="number"
            className={`w-full px-3 py-2 rounded border ${inputBg}`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setShowComment(Number(e.target.value) > 0);
            }}
          />
        </div>

        {/* Comment */}
        {showComment && (
          <div className="mb-3">
            <label className={`block mb-1 ${labelText}`}>Comment</label>
            <textarea
              className={`w-full px-3 py-2 rounded border ${inputBg}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button className={`px-4 py-2 rounded ${cancelBtn}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`px-4 py-2 rounded ${actionBtn}`} onClick={handleSubmit}>
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternalTransferModal;
