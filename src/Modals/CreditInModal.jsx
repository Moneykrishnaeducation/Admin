import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";

const apiClient = new AdminAuthenticatedFetch("/api");
const client = new AdminAuthenticatedFetch("");

const CreditInModal = ({ visible, onClose, accountId, onSubmit }) => {
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

  /* ===============================
     HANDLE CREDIT-IN ACTION
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      showToast("Missing account ID", "error");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast("Enter a valid credit amount", "error");
      return;
    }

    try {
      setLoading(true);

      /* STEP 1 → GET CSRF TOKEN */
      let csrfToken = null;
      try {
        const csrfRes = await client.get("/api/csrf/");
        csrfToken = csrfRes?.csrfToken;
      } catch (csrfError) {
        console.error("CSRF Token Error:", csrfError);
        showToast("Failed to get CSRF token", "error");
        return;
      }

      if (!csrfToken) {
        showToast("Failed to get CSRF token", "error");
        return;
      }

      /* STEP 2 → SEND CREDIT-IN REQUEST */
      const payload = {
        accountId,
        amount: Number(amount),
        comment: comment || "",
      };

      let creditRes;
      try {
        creditRes = await apiClient.post(
          "/admin/credit-in/",
          payload,
          {
            headers: { "X-CSRFToken": csrfToken },
          }
        );
      } catch (postError) {
        console.error("POST Request Error:", postError);
        showToast(postError?.message || "Credit In failed. Please try again.", "error");
        return;
      }

      if (creditRes?.error) {
        showToast(creditRes.error, "error");
        return;
      }

      // Parse response if it's a string
      let parsedRes = creditRes;
      if (typeof creditRes === 'string') {
        try {
          parsedRes = JSON.parse(creditRes);
        } catch (e) {
          console.error("Failed to parse response:", e);
          parsedRes = creditRes;
        }
      }

      if (parsedRes && (parsedRes.status === "approved" || parsedRes.message || parsedRes.transaction)) {
        showToast(`✅ Credit In Successful: $${parsedRes?.transaction?.amount || parsedRes?.amount}`, "success");
        
        try {
          if (onSubmit) onSubmit(parsedRes);
        } catch (submitError) {
          console.error("Submit callback error:", submitError);
        }

        setAmount("");
        setComment("");
        setTimeout(onClose, 1500);
      } else {
        showToast("Credit In failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("CREDIT-IN ERROR:", err);
      showToast(typeof err?.message === 'string' ? err.message : "Credit In failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     THEME CLASSES
  =============================== */
  const labelCls = isDarkMode
    ? "text-yellow-300"
    : "text-gray-700";

  const inputCls = isDarkMode
    ? "bg-[#111] text-yellow-200 border border-yellow-600 focus:ring-yellow-500"
    : "bg-white text-black border border-gray-300 focus:ring-yellow-400";

  const readOnlyCls = isDarkMode
    ? "bg-[#0b0b0b] text-yellow-300 border border-yellow-700"
    : "bg-gray-100 text-gray-700 border border-gray-300";

  /* ===============================
     FOOTER
  =============================== */
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        disabled={loading}
        onClick={handleSubmit}
        className="
          bg-yellow-500 hover:bg-yellow-400
          text-black font-medium
          px-5 py-2 rounded-lg
          shadow transition
          disabled:opacity-60
        "
      >
        {loading ? "Processing..." : "Credit In"}
      </button>

      <button
        onClick={onClose}
        className="
          bg-gray-300 hover:bg-gray-400
          px-5 py-2 rounded-lg
          transition
        "
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Credit In to Account ${accountId || ""}`}
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

      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-h-[60vh] overflow-y-auto pr-1"
      >
        {/* ACCOUNT ID */}
        <div className="space-y-1">
          <label className={`text-sm font-medium ${labelCls}`}>
            Account ID
          </label>
          <input
            readOnly
            value={accountId || ""}
            className={`
              w-full rounded-lg px-3 py-2
              ${readOnlyCls}
            `}
          />
        </div>

        {/* CREDIT AMOUNT */}
        <div className="space-y-1">
          <label className={`text-sm font-medium ${labelCls}`}>
            * Credit In Amount ($)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className={`
              w-full rounded-lg px-3 py-2
              ${inputCls}
              focus:outline-none focus:ring-2
            `}
          />
        </div>

        {/* COMMENT */}
        <div className="space-y-1">
          <label className={`text-sm font-medium ${labelCls}`}>
            Comment (Optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional transaction note"
            className={`
              w-full rounded-lg px-3 py-2 resize-none
              ${inputCls}
              focus:outline-none focus:ring-2
            `}
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CreditInModal;