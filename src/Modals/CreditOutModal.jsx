import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";

const apiClient = new AdminAuthenticatedFetch("/api");
const client = new AdminAuthenticatedFetch("");

const CreditOutModal = ({ visible, onClose, accountId, onSubmit }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===============================
     HANDLE CREDIT OUT
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) return alert("Missing account ID");
    if (!amount || Number(amount) <= 0)
      return alert("Enter a valid amount");

    try {
      setLoading(true);

      // STEP 1 → CSRF
      const csrfRes = await client.get("/api/csrf/");
      const csrfToken = csrfRes?.csrfToken;

      if (!csrfToken) {
        alert("Failed to load CSRF token");
        return;
      }

      // STEP 2 → CREDIT OUT
      const payload = {
        accountId,
        amount: Number(amount),
        comment: comment || "",
      };

      const response = await apiClient.post(
        "/admin/credit-out/",
        payload,
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      if (response?.error) {
        alert(response.error);
        return;
      }

      if (onSubmit) onSubmit(response);

      alert(`Credit Out Successful: $${payload.amount}`);

      setAmount("");
      setComment("");
      onClose();
    } catch (err) {
      console.error("CREDIT OUT ERROR:", err);
      alert("Credit Out Failed");
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
    ? "bg-gray-900 text-yellow-200 border border-yellow-700 placeholder-gray-500"
    : "bg-white text-black border border-gray-300";

  const readOnlyCls = isDarkMode
    ? "bg-gray-800 text-yellow-400 cursor-not-allowed"
    : "bg-gray-100 text-gray-600 cursor-not-allowed";

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
          px-4 py-2 rounded
          shadow disabled:opacity-50
        "
      >
        {loading ? "Processing..." : "Credit Out"}
      </button>

      <button
        onClick={onClose}
        className="
          px-4 py-2 rounded
          bg-gray-400 hover:bg-gray-500
          text-black
        "
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Credit Out from Account ${accountId || ""}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ACCOUNT ID */}
        <div>
          <label className={`block text-sm font-medium ${labelCls}`}>
            Account ID
          </label>
          <input
            readOnly
            value={accountId || ""}
            className={`mt-1 w-full rounded px-3 py-2 ${readOnlyCls}`}
          />
        </div>

        {/* AMOUNT */}
        <div>
          <label className={`block text-sm font-medium ${labelCls}`}>
            * Credit Out Amount ($)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className={`mt-1 w-full rounded px-3 py-2 ${inputCls}`}
          />
        </div>

        {/* COMMENT */}
        <div>
          <label className={`block text-sm font-medium ${labelCls}`}>
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className={`mt-1 w-full rounded px-3 py-2 ${inputCls}`}
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default CreditOutModal;
