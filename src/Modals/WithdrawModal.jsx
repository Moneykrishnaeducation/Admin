import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";

const apiClient = new AdminAuthenticatedFetch("/api");
const client = new AdminAuthenticatedFetch("");

const WithdrawModal = ({ visible, onClose, accountId, onSubmit, withdrawContext }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* ---------------- THEME CLASSES ---------------- */
  const cardBg = isDarkMode
    ? "bg-black border-gray-700 text-white"
    : "bg-white border-gray-200 text-black";

  const labelText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const inputBg = isDarkMode
    ? "bg-gray-900 border-gray-700 text-white"
    : "bg-white border-gray-300 text-black";

  const buttonPrimary = "bg-yellow-400 hover:bg-yellow-500 text-black";
  const buttonSecondary = isDarkMode
    ? "bg-gray-800 text-white hover:bg-gray-700"
    : "bg-gray-200 text-black hover:bg-gray-300";

  /* ---------------- SUBMIT HANDLER ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      showToast("Missing account ID", "error");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast("Enter a valid withdraw amount", "error");
      return;
    }

    try {
      setLoading(true);

      // STEP 1 → CSRF TOKEN
      let csrfToken = null;
      try {
        const csrfRes = await client.get("/api/csrf/");
        csrfToken = csrfRes?.csrfToken;
      } catch {
        // console.error("CSRF Token Error:", csrfError);
        showToast("Failed to get CSRF token", "error");
        return;
      }

      if (!csrfToken) {
        showToast("Failed to get CSRF token", "error");
        return;
      }

      // STEP 2 → WITHDRAW API CALL
      // Route as investor or manager withdrawal based on withdrawContext.
      const isInvestorWithdrawal = withdrawContext && withdrawContext.type === 'investor';
      const payload = {
        account_id: accountId,
        amount: Number(amount),
        comment: comment || "",
      };
      if (isInvestorWithdrawal && withdrawContext.investmentId) {
        payload.investment_id = withdrawContext.investmentId;
      } else {
        payload.debit_manager = true;
      }

      let withdrawRes;
      try {
        withdrawRes = await apiClient.post("/admin/withdraw/", payload, {
          headers: { "X-CSRFToken": csrfToken },
        });
      } catch (postError) {
        // console.error("POST Request Error:", postError);
        showToast(postError?.message || "Withdraw failed. Please try again.", "error");
        return;
      }

      // Parse response if it's a string
      let parsedRes = withdrawRes;
      if (typeof withdrawRes === 'string') {
        try {
          parsedRes = JSON.parse(withdrawRes);
        } catch {
          // console.error("Failed to parse response:", e);
          parsedRes = withdrawRes;
        }
      }

      if (parsedRes && (parsedRes.status === "approved" || parsedRes.message || parsedRes.amount)) {
        showToast(`✅ Withdraw Successful: $${parsedRes?.amount}`, "success");
        
        try {
          if (onSubmit) onSubmit(parsedRes);
        } catch  {
          // console.error("Submit callback error:", submitError);
        }

        setAmount("");
        setComment("");
        setTimeout(onClose, 1500);
      } else {
        showToast("Withdraw failed. Please try again.", "error");
      }
    } catch (err) {
      // console.error("WITHDRAW ERROR:", err);
      showToast(typeof err?.message === 'string' ? err.message : "Withdraw failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FOOTER ---------------- */
  const footer = (
    <div className="flex flex-col sm:flex-row justify-end gap-3">
      <button
        disabled={loading}
        onClick={handleSubmit}
        className={`px-4 py-2 rounded shadow disabled:opacity-50 ${buttonPrimary}`}
      >
        {loading ? "Processing..." : "Withdraw"}
      </button>

      <button
        onClick={onClose}
        className={`px-4 py-2 rounded ${buttonSecondary}`}
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Withdraw from Account ${accountId || ""}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
      className={`${cardBg}`}
    >
      {/* Toast - positioned at page top-right */}
      {toast && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-md text-white shadow-lg z-50 ${
            toast.type === "error" ? "bg-red-600" : toast.type === "warning" ? "bg-yellow-600" : "bg-green-600"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Account ID */}
        <div>
          <label className={`block text-sm font-medium ${labelText}`}>
            Account ID
          </label>
          <input
            readOnly
            value={accountId || ""}
            className={`mt-1 w-full rounded px-3 py-2 ${inputBg} opacity-80`}
          />
        </div>

        {/* Withdraw Amount */}
        <div>
          <label className={`block text-sm font-medium ${labelText}`}>
            * Withdraw Amount ($)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className={`mt-1 w-full rounded px-3 py-2 ${inputBg}`}
          />
        </div>

        {/* Withdrawals from PAM accounts will automatically debit manager capital on server side */}

        {/* Comment */}
        <div>
          <label className={`block text-sm font-medium ${labelText}`}>
            Comment
          </label>
          <textarea
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className={`mt-1 w-full rounded px-3 py-2 resize-none ${inputBg}`}
          />
        </div>

      </form>
    </ModalWrapper>
  );
};

export default WithdrawModal;
