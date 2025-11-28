import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('/api');
const client = new AdminAuthenticatedFetch('');

const CreditOutModal = ({ visible, onClose, accountId, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // HANDLE CREDIT OUT SUBMISSION
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId) return alert("Missing account ID");
    if (!amount || Number(amount) <= 0) return alert("Enter a valid amount");

    try {
      setLoading(true);

      // STEP 1 → GET CSRF TOKEN
      const csrfRes = await client.get('/api/csrf/');
      const csrfToken = csrfRes?.csrfToken;

      if (!csrfToken) {
        alert("Failed to load CSRF token");
        return;
      }

      // STEP 2 → CALL CREDIT OUT API
      const payload = {
        accountId: accountId,
        amount: Number(amount),
        comment: comment || ""
      };


      const response = await apiClient.post('/admin/credit-out/', payload, {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      if (response.error) {
        alert(response.error);
        return;
      }

      // Pass result to parent
      if (onSubmit) onSubmit(response);

      alert(`Credit Out Successful: $${payload.amount}`);

      setAmount('');
      setComment('');
      onClose();

    } catch (err) {
      console.error("CREDIT OUT ERROR:", err);
      alert("Credit Out Failed");
    } finally {
      setLoading(false);
    }
  };

  // FOOTER BUTTONS
  const footer = (
    <div className="flex justify-end gap-3">
      <button
        disabled={loading}
        onClick={handleSubmit}
        className="bg-yellow-400 text-white px-4 py-2 rounded shadow hover:opacity-95 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Credit Out"}
      </button>

      <button
        onClick={onClose}
        className="bg-gray-200 px-4 py-2 rounded"
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Credit Out from Account ${accountId || ''}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ACCOUNT ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Account ID</label>
          <input
            readOnly
            value={accountId || ''}
            className="mt-1 w-full rounded border px-3 py-2 bg-gray-100"
          />
        </div>

        {/* AMOUNT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">* Credit Out Amount ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        {/* COMMENT */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

      </form>
    </ModalWrapper>
  );
};

export default CreditOutModal;
