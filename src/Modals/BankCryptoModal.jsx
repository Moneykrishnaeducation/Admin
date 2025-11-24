import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';

const BankCryptoModal = ({ visible, onClose, initialData = {}, onSave }) => {
  const [data, setData] = useState({
    bankName: '',
    accountNumber: '',
    branch: '',
    ifsc: '',
    walletAddress: '',
    exchangeName: '',
  });

  useEffect(() => setData({ ...data, ...initialData }), [initialData]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => setData({ ...data, [field]: e.target.value });
  const handleSave = () => onSave && onSave(data);

  const footer = (
    <div className="flex justify-center">
      <button onClick={handleSave} className="bg-yellow-400 text-white px-6 py-2 rounded">Edit Details</button>
    </div>
  );

  return (
    <ModalWrapper title="Bank & Crypto Details" visible={visible} onClose={onClose} footer={footer}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Bank Details</h4>
          <div className="space-y-3">
            <input placeholder="Bank Name" value={data.bankName} onChange={handleChange('bankName')} className="w-full rounded border px-3 py-2" />
            <input placeholder="Account Number" value={data.accountNumber} onChange={handleChange('accountNumber')} className="w-full rounded border px-3 py-2" />
            <input placeholder="Branch" value={data.branch} onChange={handleChange('branch')} className="w-full rounded border px-3 py-2" />
            <input placeholder="IFSC Code" value={data.ifsc} onChange={handleChange('ifsc')} className="w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div className="border rounded p-4">
          <h4 className="font-semibold mb-3">Crypto Details</h4>
          <div className="space-y-3">
            <input placeholder="Wallet Address" value={data.walletAddress} onChange={handleChange('walletAddress')} className="w-full rounded border px-3 py-2" />
            <input placeholder="Exchange Name" value={data.exchangeName} onChange={handleChange('exchangeName')} className="w-full rounded border px-3 py-2" />
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default BankCryptoModal;
