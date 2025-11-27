import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

const BankCryptoModal = ({ visible, onClose, userRow, onSave, isDarkMode = false }) => {
  const userId = userRow ? userRow.userId || userRow.id : null;

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
    if (!visible) {
      setIsEditMode(false);
      return;
    }

    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = typeof window !== "undefined"
          ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token")
          : null;

        const res = await fetch(`/api/user/${userId}/bank-details/`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch bank details: ${res.status}`);
        }

        const bankData = await res.json();

        const newData = {
          bankName: bankData?.bank_name || '',
          accountNumber: bankData?.account_number || '',
          branch: bankData?.branch_name || '',
          ifsc: bankData?.ifsc_code || '',
          walletAddress: bankData?.wallet_address || '',
          exchangeName: bankData?.exchange_name || '',
        };

        setData(newData);
        setOriginalData(newData);
      } catch (e) {
        console.error('Error fetching bank/crypto details:', e);
        // Don't show alert for missing data, just set empty
        const emptyData = {
          bankName: '',
          accountNumber: '',
          branch: '',
          ifsc: '',
          walletAddress: '',
          exchangeName: '',
        };
        setData(emptyData);
        setOriginalData(emptyData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [visible, userId]);

  const handleChange = (field) => (e) => setData({ ...data, [field]: e.target.value });

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("jwt_token") || localStorage.getItem("access_token")
        : null;

      const res = await fetch(`/api/user/${userId}/bank-details/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bank_name: data.bankName,
          account_number: data.accountNumber,
          branch_name: data.branch,
          ifsc_code: data.ifsc,
          wallet_address: data.walletAddress,
          exchange_name: data.exchangeName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save bank details: ${res.status}`);
      }

      setOriginalData(data);
      setIsEditMode(false);
      onSave && onSave(data);
    } catch (e) {
      console.error('Error saving bank/crypto details:', e);
      alert('Error saving details');
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
        <button onClick={handleEdit} className="bg-yellow-400 text-white px-6 py-2 rounded">Edit Details</button>
      ) : (
        <>
          <button onClick={handleCancel} className="bg-gray-400 text-white px-6 py-2 rounded">Cancel</button>
          <button onClick={handleSave} className="bg-yellow-400 text-white px-6 py-2 rounded">Save</button>
        </>
      )}
    </div>
  );

  return (
    <ModalWrapper title="Bank & Crypto Details" visible={visible} onClose={onClose} footer={footer}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Bank Details</h4>
          <div className="space-y-3">
            <input
              placeholder="Bank Name"
              value={data.bankName}
              onChange={handleChange('bankName')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : (isDarkMode ? 'bg-gray-800 text-yellow-200 border-yellow-600' : 'bg-white')}`}
            />
            <input
              placeholder="Account Number"
              value={data.accountNumber}
              onChange={handleChange('accountNumber')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : (isDarkMode ? 'bg-gray-800 text-yellow-200 border-yellow-600' : 'bg-white')}`}
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

        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Crypto Details</h4>
          <div className="space-y-3">
            <input
              placeholder="Wallet Address"
              value={data.walletAddress}
              onChange={handleChange('walletAddress')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : (isDarkMode ? 'bg-gray-800 text-yellow-200 border-yellow-600' : 'bg-white')}`}
            />
            <input
              placeholder="Exchange Name"
              value={data.exchangeName}
              onChange={handleChange('exchangeName')}
              readOnly={!isEditMode}
              className={`w-full rounded border px-3 py-2 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : (isDarkMode ? 'bg-gray-800 text-yellow-200 border-yellow-600' : 'bg-white')}`}
            />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default BankCryptoModal;
