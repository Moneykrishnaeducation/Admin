import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('/api');
const client = new AdminAuthenticatedFetch('');   // for CSRF

const BankCryptoModal = ({ visible, onClose, userRow, onSave,userId, isDarkMode }) => {


  const [data, setData] = useState({
    bankName: '',
    accountNumber: '',
    branch: '',
    ifsc: '',
    walletAddress: '',
    exchangeName: '',
  });

  const [originalData, setOriginalData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      try {
        const bankData = await client.get(`/ib-user/${userId}/bank-details/`);

        const newData = {
          bankName: String(bankData?.bank_name || ''),
          accountNumber: String(bankData?.account_number || ''),
          branch: String(bankData?.branch_name || ''),
          ifsc: String(bankData?.ifsc_code || ''),
          walletAddress: String(bankData?.wallet_address || ''),
          exchangeName: String(bankData?.exchange_name || ''),
        };

        setData(newData);
        setOriginalData(newData);

      } catch (e) {
        console.error('Error fetching bank/crypto details:', e);

        const empty = {
          bankName: '',
          accountNumber: '',
          branch: '',
          ifsc: '',
          walletAddress: '',
          exchangeName: '',
        };

        setData(empty);
        setOriginalData(empty);

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visible, userId]);


  const handleChange = (field) => (e) => {
    setData({ ...data, [field]: e.target.value });
  };

  const handleEdit = () => setIsEditMode(true);

  // ------------------------------------------------
  // 🔥 FIXED: CSRF TOKEN ADDED WITHOUT CHANGING LOGIC
  // ------------------------------------------------
  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // STEP 1 — GET CSRF
      const csrfRes = await client.get('/api/csrf/');
      const csrfToken = csrfRes?.csrfToken;

      if (!csrfToken) {
        alert("CSRF token missing");
        return;
      }

      // STEP 2 — PATCH request with CSRF
      await client.post(
        `/ib-user/${userId}/bank-details/`,
        {
          bank_name: data.bankName,
          account_number: data.accountNumber,
          branch_name: data.branch,
          ifsc_code: data.ifsc,
          wallet_address: data.walletAddress,
          exchange_name: data.exchangeName,
        },
        {
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      setOriginalData(data);
      setIsEditMode(false);
      onSave && onSave(data);

    } catch (e) {
      alert("Error saving details");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setData(originalData);
    setIsEditMode(false);
  };


  const footer = (
    <div className="flex justify-center space-x-4">
      {!isEditMode ? (
        <button onClick={handleEdit} className="bg-yellow-400 text-white px-6 py-2 rounded">
          Edit Details
        </button>
      ) : (
        <>
          <button onClick={handleCancel} className="bg-gray-400 text-white px-6 py-2 rounded">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-yellow-400 text-white px-6 py-2 rounded">
            Save
          </button>
        </>
      )}
    </div>
  );

  return (
    <ModalWrapper title="Bank & Crypto Details" visible={visible} onClose={onClose} footer={footer}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BANK */}
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Bank Details</h4>

          <div className="space-y-3">
            <input
              placeholder="Bank Name"
              value={data.bankName}
              onChange={handleChange('bankName')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />

            <input
              placeholder="Account Number"
              value={data.accountNumber}
              onChange={handleChange('accountNumber')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />

            <input
              placeholder="Branch"
              value={data.branch}
              onChange={handleChange('branch')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />

            <input
              placeholder="IFSC Code"
              value={data.ifsc}
              onChange={handleChange('ifsc')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />
          </div>
        </div>

        {/* CRYPTO */}
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Crypto Details</h4>

          <div className="space-y-3">
            <input
              placeholder="Wallet Address"
              value={data.walletAddress}
              onChange={handleChange('walletAddress')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />

            <input
              placeholder="Exchange Name"
              value={data.exchangeName}
              onChange={handleChange('exchangeName')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />
          </div>
        </div>

      </div>
    </ModalWrapper>
  );
};

export default BankCryptoModal;
