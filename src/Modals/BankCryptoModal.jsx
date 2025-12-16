import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

/**
 * IMPORTANT:
 * IB endpoints are under /api
 * Root ("") returns React index.html
 */
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

  /* ===================== LOAD DATAETAILS ===================== */
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
        console.error("Error fetching bank/crypto details:", e);

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

    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  /* ===================== HANDLERS ===================== */
  const handleChange = (field) => (e) => {
    setData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setData(originalData);
    setIsEditMode(false);
  };

  /* ===================== SAVE ===================== */
  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await apiClient.patch(
        `/ib-user/${userId}/bank-details/`,
        {
          bank_name: data.bankName,
          account_number: data.accountNumber,
          branch_name: data.branch,
          ifsc_code: data.ifsc,
          wallet_address: data.walletAddress,
          exchange_name: data.exchangeName,
        }
      );

      setOriginalData(data);
      setIsEditMode(false);
      onSave && onSave(data);
    } catch (e) {
      console.error(e);
      alert("Error saving details");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== FOOTER ===================== */
  const footer = (
    <div className="flex justify-center space-x-4">
      {!isEditMode ? (
        <button
          onClick={handleEdit}
          className="bg-yellow-400 text-white px-6 py-2 rounded"
        >
          Edit Details
        </button>
      ) : (
        <>
          <button
            onClick={handleCancel}
            className="bg-gray-400 text-white px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-400 text-white px-6 py-2 rounded"
          >
            Save
          </button>
        </>
      )}
    </div>
  );

  /* ===================== RENDER ===================== */
  return (
    <ModalWrapper
      title="Bank & Crypto Details"
      visible={visible}
      onClose={onClose}
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BANK */}
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Bank Details</h4>
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
                className={`w-full rounded border px-3 py-2 ${
                  !isEditMode
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CRYPTO */}
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Crypto Details</h4>
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
                className={`w-full rounded border px-3 py-2 ${
                  !isEditMode
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
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
