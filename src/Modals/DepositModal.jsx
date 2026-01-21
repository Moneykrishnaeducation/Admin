import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch("/api");
const client = new AdminAuthenticatedFetch("");

const DepositModal = ({ visible, onClose, accountId, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // -------------------------------
  // HANDLE DEPOSIT SUBMISSION
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      showToast("Missing account ID", "error");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast("Enter a valid deposit amount", "error");
      return;
    }

    try {
      setLoading(true);

      // STEP 1 → FETCH CSRF TOKEN
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

      // STEP 2 → DEPOSIT API CALL
      const payload = {
        account_id: accountId,
        amount: Number(amount),
        comment: comment || "",
        transaction_type: "deposit",
      };

      let depositRes;
      try {
        depositRes = await apiClient.post(
          "/admin/deposit/",
          payload,
          {
            headers: {
              "X-CSRFToken": csrfToken,
            },
          }
        );
      } catch (postError) {
        // console.error("POST Request Error:", postError);
        showToast(postError?.message || "Deposit failed. Please try again.", "error");
        return;
      }

      // console.log("Deposit Response:", depositRes, "Type:", typeof depositRes);

      // Parse response if it's a string
      let parsedRes = depositRes;
      if (typeof depositRes === 'string') {
        try {
          parsedRes = JSON.parse(depositRes);
        } catch {
          // console.error("Failed to parse response:", e);
          parsedRes = depositRes;
        }
      }

      // CHECK IF DEPOSIT WAS SUCCESSFUL
      if (parsedRes && (parsedRes.status === "approved" || parsedRes.message)) {
        showToast(`✅ Deposit Successful: $${parsedRes?.amount}`, "success");
        
        // SEND RESULT TO PARENT COMPONENT
        try {
          if (onSubmit) onSubmit(parsedRes);
        } catch  {
          // console.error("Submit callback error:", submitError);
          // Still show success even if callback fails
        }

        // RESET FORM
        setAmount("");
        setComment("");
        setTimeout(onClose, 1500);
      } else {
        showToast("Deposit failed. Please try again.", "error");
      }
    } catch (err) {
      // console.error("DEPOSIT ERROR:", err);
      showToast(typeof err?.message === 'string' ? err.message : "Deposit failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // MODAL FOOTER
  // -------------------------------
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
        className="
          bg-yellow-400 text-black font-semibold
          px-5 py-2 rounded-lg shadow
          hover:opacity-95 transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading ? "Processing..." : "Deposit"}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="
          bg-gray-200 text-gray-800
          px-5 py-2 rounded-lg
          hover:bg-gray-300 transition
        "
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Deposit to Account ${accountId || ""}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ACCOUNT ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Account ID
          </label>
          <input
            readOnly
            value={accountId || ""}
            className="
              w-full rounded-lg px-3 py-2
              bg-gray-800 text-gray-300
              border border-gray-700
              cursor-not-allowed
            "
          />
        </div>

        {/* DEPOSIT AMOUNT */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            * Deposit Amount ($)
          </label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter deposit amount"
            className="
              w-full rounded-lg px-3 py-2
              bg-gray-900 text-white
              border border-gray-700
              focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400
              outline-none transition
            "
          />
        </div>

        {/* COMMENT */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Comment (Optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add an optional note for this deposit"
            className="
              w-full rounded-lg px-3 py-2
              bg-gray-900 text-white
              border border-gray-700
              focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400
              outline-none transition resize-none
            "
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default DepositModal;