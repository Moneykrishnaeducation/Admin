import React from 'react';
import ModalWrapper from './ModalWrapper';

const PendingDepositModal = ({ visible, onClose, depositData, onApprove, onReject }) => {
  if (!depositData) return null;

  const {
    dateTime,
    name,
    email,
    accountId,
    amount,
    paymentMethod,
    fileUrl, // Optional file URL if any
  } = depositData;

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={() => onApprove(depositData.id)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Approve
      </button>
      <button
        onClick={() => onReject(depositData.id)}
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
      title={`Pending Deposit: ${name}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div
        className="max-h-[400px] overflow-y-auto"
        style={{ minWidth: '300px', maxWidth: '600px' }}
      >
        <p><strong>Date/Time:</strong> {dateTime}</p>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Account ID:</strong> {accountId}</p>
        <p><strong>Amount (USD):</strong> ${amount}</p>
        <p><strong>Payment Method:</strong> {paymentMethod}</p>

        {fileUrl && (
          <div className="mt-4">
            <strong>File:</strong>
            <div className="mt-2 border rounded p-2" style={{ maxHeight: '250px' }}>
              <iframe
                src={fileUrl}
                title="Deposit File"
                width="100%"
                height="240px"
                frameBorder="0"
              />
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default PendingDepositModal;
