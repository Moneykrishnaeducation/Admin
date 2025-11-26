import React from 'react';
import ModalWrapper from './ModalWrapper';

const PendingWithdrawalModal = ({ visible, onClose, withdrawalData, onApprove, onReject }) => {
  if (!withdrawalData) return null;

  const {
    id,
    created_at,
    username,
    email,
    transaction_account_id,
    amount,
    transaction_type_display,
  } = withdrawalData;

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => onApprove(withdrawalData.id)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Approve
      </button>
      <button
        onClick={() => onReject(withdrawalData.id)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Reject
      </button>
      <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Pending Withdrawal: ${username}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div
        className="max-h-[400px] overflow-y-auto"
        style={{ minWidth: '300px', maxWidth: '600px' }}
      >
        <p><strong>Id:</strong> {id}</p>
        <p><strong>Date/Time:</strong> {created_at}</p>
        <p><strong>Name:</strong> {username}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Account ID:</strong> {transaction_account_id}</p>
        <p><strong>Amount (USD):</strong> ${amount}</p>
        <p><strong>Payment Method:</strong> {transaction_type_display}</p>
      </div>
    </ModalWrapper>
  );
};

export default PendingWithdrawalModal;
