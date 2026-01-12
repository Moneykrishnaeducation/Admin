import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";
import { useTheme } from "../context/ThemeContext";

const apiClient = new AdminAuthenticatedFetch("/api");
const client = new AdminAuthenticatedFetch("");

const WithdrawModal = ({ visible, onClose, accountId, onSubmit }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;

  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (!accountId) return alert("Missing account ID");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount");

    try {
      setLoading(true);

      const csrfRes = await client.get("/api/csrf/");
      const csrfToken = csrfRes?.csrfToken;
      if (!csrfToken) return alert("CSRF failed");

      const payload = {
        account_id: accountId,
        amount: Number(amount),
        comment: comment || "",
      };

      const withdrawRes = await apiClient.post("/admin/withdraw/", payload, {
        headers: { "X-CSRFToken": csrfToken },
      });

      onSubmit?.(withdrawRes);
      alert(`Withdraw Success: $${withdrawRes.amount}`);

      setAmount("");
      setComment("");
      onClose();
    } catch (err) {
      console.error("WITHDRAW ERROR:", err);
      alert("Withdrawal failed");
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
