import React from 'react';
import ModalWrapper from './ModalWrapper';

const CommissionWithdrawalModal = ({ visible, onClose, commissiondata, onApprove, onReject }) => {
  if (!commissiondata) return null;

  const {
    id,
    created_at,
    username,
    email,
    trading_account_id,
    transaction_type,
    amount,
    status,
  } = commissiondata;

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => onApprove(commissiondata.id)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Approve
      </button>
      <button
        onClick={() => onReject(commissiondata.id)}
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
      title={`Commission Withdrawal: ${username}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div
        className="max-h-[400px] overflow-y-auto"
        style={{ minWidth: '300px', maxWidth: '600px' }}
      >
        <p><strong>Transaction I:</strong> {id}</p>
        <p><strong>Date/Time:</strong> {created_at}</p>
        <p><strong>User Name:</strong> {username}</p>
        <p><strong>E-Mail:</strong> {email}</p>
        <p><strong>Trading Account ID:</strong> {trading_account_id}</p>
        <p><strong>Type:</strong> {transaction_type}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Status:</strong> {status}</p>
      </div>
    </ModalWrapper>
  );
};

export default CommissionWithdrawalModal;
