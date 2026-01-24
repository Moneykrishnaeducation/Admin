import React from 'react';
import ModalWrapper from './ModalWrapper';
import { useTheme } from '../context/ThemeContext';

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
    document_url,
    document,
  } = withdrawalData;
  
  // Use document_url or document, whichever is available
  const fileUrl = document_url || document;
  
  const { isDarkMode } = useTheme();

  const cardBg = isDarkMode
    ? "bg-black border-gray-700 text-white"
    : "bg-white border-gray-200 text-black";

  const labelText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const valueText = isDarkMode ? "text-gray-200" : "text-gray-900";
  const divider = isDarkMode ? "border-gray-700" : "border-gray-300";
  const descBg = isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200";
  const iframeBg = isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200";

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
        <div className={`rounded-xl shadow-lg p-6 border ${cardBg}`}>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className={`text-sm ${labelText}`}>{email}</p>
          </div>

            <div className={`border-t my-4 ${divider}`} />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Info label="ID" value={id} labelText={labelText} valueText={valueText} />
            <Info label="Date/Time" value={created_at} labelText={labelText} valueText={valueText} />
            <Info label="Trading Account ID" value={trading_account_id} labelText={labelText} valueText={valueText} />
            <Info label="Amount (USD)" value={`$${amount}`} labelText={labelText} valueText={valueText} />
            <Info label="Payment Method" value={transaction_type_display} labelText={labelText} valueText={valueText} />
          </div>

          {/* File Preview */}
          {fileUrl && (
            <div className="mt-6">
              <p className={`font-semibold ${labelText}`}>Attached Document</p>
              <div className={`mt-2 rounded-lg p-2 shadow-sm border ${iframeBg}`}>
                {/* Check if URL is an image */}
                {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={fileUrl}
                    alt="Document"
                    className="w-full rounded-lg max-h-96 object-contain"
                    onError={(e) => {
                      e.target.src = '';
                      e.target.alt = 'Image failed to load';
                    }}
                  />
                ) : (
                  <iframe
                    src={fileUrl}
                    title="Withdrawal File"
                    width="100%"
                    height="260"
                    className="rounded-lg"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

const Info = ({ label, value, labelText, valueText }) => (
  <div className="flex flex-col break-words">
    <span className={`text-sm ${labelText}`}>{label}</span>
    <span className={`font-medium ${valueText}`}>{value}</span>
  </div>
);


export default PendingWithdrawalModal;
