import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch("");

const BankCryptoModal = ({
  visible,
  onClose,
  userRow,
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

  /* ================= LOAD DETAILS ================= */
  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const bankData = await apiClient.get(
          `/ib-user/${userId}/bank-details/`
        );

        if (cancelled) return;

        const newData = {
          bankName: String(bankData?.bank_name || ""),
          accountNumber: String(bankData?.account_number || ""),
          branch: String(bankData?.branch_name || ""),
          ifsc: String(bankData?.ifsc_code || ""),
          walletAddress: String(bankData?.wallet_address || ""),
          exchangeName: String(bankData?.exchange_name || ""),
        };

        setData(newData);
        setOriginalData(newData);
      } catch (e) {
        console.error(e);
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
      await apiClient.patch(`/ib-user/${userId}/bank-details/`, {
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
    } catch (e) {
      console.error(e);
      alert("Error saving details");
    } finally {
      setLoading(false);
    }
  };

  /* ================= THEME CLASSES ================= */
  const cardBg = isDarkMode ? "bg-black" : "bg-white";
  const borderCls = isDarkMode ? "border-gray-700" : "border-gray-200";
  const textMain = isDarkMode ? "text-white" : "text-black";
  const textMuted = isDarkMode ? "text-gray-400" : "text-gray-500";

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
  const footer = (
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
  );

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
        <div className={`rounded-xl border ${borderCls} ${cardBg} p-5`}>
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
                className={`${inputBase} ${
                  isEditMode ? inputEditable : inputReadOnly
                }`}
              />
            ))}
          </div>
        </div>

        {/* CRYPTO */}
        <div className={`rounded-xl border ${borderCls} ${cardBg} p-5`}>
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
                className={`${inputBase} ${
                  isEditMode ? inputEditable : inputReadOnly
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default BankCryptoModal;
