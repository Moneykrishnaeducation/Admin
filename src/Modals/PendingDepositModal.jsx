import React from 'react';
import ModalWrapper from './ModalWrapper';

const PendingDepositModal = ({ visible, onClose, depositData, onApprove, onReject }) => {
  if (!depositData) return null;

  const {
    id,
    created_at,
    username,
    email,
    trading_account_id,
    amount,
    transaction_type,
    status,
    description,
    fileUrl,
    source,
  } = depositData;

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
      title={`Pending Request - ${username}`}
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
            <Info label="Transaction Type" value={transaction_type} />
            <Info label="Source" value={source} />

            <div className="flex flex-col">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
              <span
                className={`px-3 py-1 mt-1 rounded-full w-fit text-sm font-semibold
                ${status === "Approved" ? "bg-green-100 text-green-700" :
                  status === "Rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"}`}
              >
                {status}
              </span>
            </div>

          </div>

          {/* Description */}
          <div className="mt-6">
            <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Description</p>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-700 text-sm">
              {description || "No description provided"}
            </p>
          </div>

          {/* File Preview */}
          {fileUrl && (
            <div className="mt-6">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Attached File</p>
              <div className="mt-2 border dark:border-gray-700 rounded-lg p-2 shadow-sm bg-gray-50 dark:bg-gray-900">
                <iframe
                  src={fileUrl}
                  title="Deposit File"
                  width="100%"
                  height="260"
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
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

export default PendingDepositModal;
