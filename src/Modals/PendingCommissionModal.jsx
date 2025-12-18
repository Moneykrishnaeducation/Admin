import React from "react";
import ModalWrapper from "./ModalWrapper";
import { useTheme } from "../context/ThemeContext";

const CommissionWithdrawalModal = ({
  visible,
  onClose,
  commissiondata,
  onApprove,
  onReject,
}) => {
  const {isDarkMode} =useTheme();

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

  /* ================= THEME CLASSES ================= */


  const labelText = isDarkMode ? "text-gray-400" : "text-gray-600";
  const valueText = isDarkMode ? "text-gray-200" : "text-gray-800";

  const divider = isDarkMode ? "border-gray-700" : "border-gray-300";

  const footer = (
    <div className="flex flex-wrap justify-end gap-3 mt-4">
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
        className={`px-5 py-2 rounded-lg transition-all shadow-md ${
          isDarkMode
            ? "bg-gray-700 text-white hover:bg-gray-600"
            : "bg-gray-300 text-gray-800 hover:bg-gray-400"
        }`}
      >
        Close
      </button>
    </div>
  );

  return (
    <ModalWrapper
      title={`Commission Withdrawal - ${username}`}
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div className="max-h-[470px] overflow-y-auto p-2">
        <div
          className={`rounded-xl shadow-lg p-6 border ${isDarkMode? "bg-black border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`}
        >
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className="text-yellow-500 text-sm break-all">{email}</p>
          </div>

          <div className={`border-t my-4 ${divider}`}></div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Info label="Transaction ID" value={id} labelText={labelText} valueText={valueText} />
            <Info label="Date / Time" value={created_at} labelText={labelText} valueText={valueText} />
            <Info label="Trading Account ID" value={trading_account_id} labelText={labelText} valueText={valueText} />
            <Info label="Type" value={transaction_type} labelText={labelText} valueText={valueText} />
            <Info label="Amount" value={`$${amount}`} labelText={labelText} valueText={valueText} />
            <Info label="Status" value={status} labelText={labelText} valueText={valueText} />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

/* ================= INFO BLOCK ================= */
const Info = ({ label, value, labelText, valueText }) => (
  <div className="flex flex-col break-words">
    <span className={`text-sm text-yellow-500 ${labelText}`}>
      {label}
    </span>
    <span className={`font-medium ${valueText}`}>
      {value}
    </span>
  </div>
);

export default CommissionWithdrawalModal;
