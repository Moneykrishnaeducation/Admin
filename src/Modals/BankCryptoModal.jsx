import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { adminApiClient } from "../utils/fetch-utils.js";

const BankCryptoModal = ({
  visible,
  onClose,
  onSave,
  userId,
  isDarkMode,
}) => {
  const [data, setData] = useState({
    bankName: "",
    accountNumber: "",
    branch: "",
    ifsc: "",
    walletAddress: "",
    exchangeName: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // read user role from cookie (userRole or user_role)
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    const role = (getCookie('userRole') || getCookie('user_role') || '').toString().toLowerCase();
    setUserRole(role || null);
  }, []);

  /* ================= LOAD DETAILS ================= */
  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = `/ib-user/${userId}/bank-details/`;
        // console.log("Fetching bank details from:", endpoint);
        const bankData = await adminApiClient.get(endpoint);

        if (cancelled) return;

        const newData = {
          bankName: String(
            bankData?.['bank-details-name'] ?? bankData?.bank_name ?? ''
          ),
          accountNumber: String(
            bankData?.['bank-details-account'] ?? bankData?.account_number ?? ''
          ),
          branch: String(
            bankData?.['bank-details-branch'] ?? bankData?.branch_name ?? bankData?.branch ?? ''
          ),
          ifsc: String(
            bankData?.['bank-details-ifsc'] ?? bankData?.ifsc_code ?? bankData?.ifsc ?? ''
          ),
          walletAddress: String(
            bankData?.['crypto-wallet'] ?? bankData?.wallet_address ?? ''
          ),
          exchangeName: String(
            bankData?.['crypto-exchange'] ?? bankData?.exchange_name ?? bankData?.currency ?? ''
          ),
        };

        setData(newData);
        setOriginalData(newData);
      } catch {
        // console.error(e);
        const empty = {
          bankName: "",
          accountNumber: "",
          branch: "",
          ifsc: "",
          walletAddress: "",
          exchangeName: "",
        };
        setData(empty);
        setOriginalData(empty);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => (cancelled = true);
  }, [visible, userId]);

  /* ================= HANDLERS ================= */
  const handleChange = (field) => (e) =>
    setData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setData(originalData);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const endpoint = `/ib-user/${userId}/bank-details/`;
      // console.log("Saving bank details to:", endpoint);
      await adminApiClient.post(endpoint, {
        bank_name: data.bankName,
        account_number: data.accountNumber,
        branch_name: data.branch,
        ifsc_code: data.ifsc,
        wallet_address: data.walletAddress,
        exchange_name: data.exchangeName,
      });

      setOriginalData(data);
      setIsEditMode(false);
      onSave?.(data);
    } catch  {
      // console.error(e);
      alert("Error saving details");
    } finally {
      setLoading(false);
    }
  };

  /* ================= THEME CLASSES ================= */
  const cardBg = isDarkMode ? "bg-black" : "bg-white";
  const borderCls = isDarkMode ? "border-yellow-300" : "border-gray-300";
  const textMain = isDarkMode ? "text-yellow-300" : "text-gray-700";
  // const textMuted = isDarkMode ? "text-yellow-500" : "text-gray-500";

  const inputBase = `
    w-full rounded-lg border px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-yellow-400
  `;

  const inputReadOnly = isDarkMode
    ? "bg-gray-900 text-gray-400 cursor-not-allowed"
    : "bg-gray-100 text-gray-600 cursor-not-allowed";

  const inputEditable = isDarkMode
    ? "bg-black text-white border-yellow-400"
    : "bg-white text-black border-yellow-400";

  /* ================= FOOTER ================= */
  // Show footer buttons only to admin role. Managers and other roles see no footer buttons.
  const footer = (userRole && userRole.includes('admin')) ? (
    <div className="flex justify-center gap-4">
      {!isEditMode ? (
        <button
          onClick={handleEdit}
          className="px-6 py-2 rounded-lg bg-yellow-400 text-black font-medium hover:brightness-95 transition"
        >
          Edit Details
        </button>
      ) : (
        <>
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-yellow-400 text-black font-medium hover:brightness-95 transition disabled:opacity-60"
          >
            Save
          </button>
        </>
      )}
    </div>
  ) : null;

  /* ================= RENDER ================= */
  return (
    <ModalWrapper
      title="Bank & Crypto Details"
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-1">
        {/* BANK */}
        <div className={`rounded-xl border-2 ${borderCls} ${cardBg} p-5`}>
          <h4 className={`font-semibold mb-4 ${textMain}`}>
            Bank Details
          </h4>
          <div className="space-y-3">
            {[
              ["bankName", "Bank Name"],
              ["accountNumber", "Account Number"],
              ["branch", "Branch"],
              ["ifsc", "IFSC Code"],
            ].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={data[key]}
                onChange={handleChange(key)}
                readOnly={!isEditMode}
                className={`${inputBase} ${isEditMode ? inputEditable : inputReadOnly} ${isDarkMode ? 'text-yellow-300' : 'text-black'} border ${isDarkMode ? 'border-yellow-600' : 'border-gray-300'} placeholder-${isDarkMode ? 'yellow-500' : 'gray-500'}`}
              />
            ))}
          </div>
        </div>

        {/* CRYPTO */}
        <div className={`rounded-xl border-2 ${borderCls} ${cardBg} p-5`}>
          <h4 className={`font-semibold mb-4 ${textMain}`}>
            Crypto Details
          </h4>
          <div className="space-y-3">
            {[
              ["walletAddress", "Wallet Address"],
              ["exchangeName", "Exchange Name"],
            ].map(([key, label]) => (
              <input
                key={key}
                placeholder={label}
                value={data[key]}
                onChange={handleChange(key)}
                readOnly={!isEditMode}
                className={`${inputBase} ${isEditMode ? inputEditable : inputReadOnly} ${isDarkMode ? 'text-yellow-300' : 'text-black'} border ${isDarkMode ? 'border-yellow-600' : 'border-gray-300'} placeholder-${isDarkMode ? 'yellow-500' : 'gray-500'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default BankCryptoModal;