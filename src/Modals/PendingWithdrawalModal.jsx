import React from 'react';
import ModalWrapper from './ModalWrapper';

const PendingWithdrawalModal = ({ visible, onClose, withdrawalData, onApprove, onReject }) => {
  if (!withdrawalData) return null;

  const {
    id,
    created_at,
    username,
    email,
    trading_account_id,
    amount,
    transaction_type_display,
  } = withdrawalData;

  const footer = (
    <div className="flex justify-end gap-3 mt-4">
      <button
        onClick={() => onApprove(id)}
        className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
      >
        Approve
      </button>

      <button
        onClick={() => onReject(id)}
        className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow-md"
      >
        Reject
      </button>

      <button
        onClick={onClose}
        className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all shadow-md"
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Pending Withdrawal - ${username}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div className="max-h-[470px] overflow-y-auto p-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{username}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{email}</p>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Info label="ID" value={id} />
            <Info label="Date/Time" value={created_at} />
            <Info label="Trading Account ID" value={trading_account_id} />
            <Info label="Amount (USD)" value={`$${amount}`} />
            <Info label="Payment Method" value={transaction_type_display} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

const Info = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
    <span className="font-medium text-gray-900 dark:text-gray-200">{value}</span>
  </div>
);

export default PendingWithdrawalModal;
