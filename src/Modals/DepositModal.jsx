import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';

const DepositModal = ({ visible, onClose, accountId, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ accountId, amount, comment });
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={handleSubmit}
        className="bg-yellow-400 text-white px-4 py-2 rounded shadow hover:opacity-95"
      >
        Deposit
      </button>
      <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded">Close</button>
    </div>
  );

  return (
    <ModalWrapper title={`Deposit to Account ${accountId || ''}`} visible={visible} onClose={onClose} footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account ID</label>
          <input readOnly value={accountId || ''} className="mt-1 w-full rounded border px-3 py-2 bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">* Deposit Amount ($)</label>
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

export default DepositModal;
