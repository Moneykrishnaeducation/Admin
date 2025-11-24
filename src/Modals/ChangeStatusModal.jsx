import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';

const ChangeStatusModal = ({ visible, onClose, userName = '', currentStatus = '', onUpdate }) => {
  const [status, setStatus] = useState(currentStatus || 'client');

  const handleUpdate = () => {
    if (onUpdate) onUpdate(status);
  };

  const footer = (
    <div className="flex justify-center">
      <button onClick={handleUpdate} className="bg-yellow-400 text-white px-6 py-2 rounded">Update Status</button>
    </div>
  );

  return (
    <ModalWrapper title={`Change Status for ${userName}`} visible={visible} onClose={onClose} footer={footer}>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Current Status: <strong>{currentStatus}</strong></p>
        <p className="text-sm">Select a new status for <strong>{userName}</strong></p>

        <div className="flex items-center gap-6 mt-4">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="status" value="admin" checked={status==='admin'} onChange={() => setStatus('admin')} />
            <span className="text-blue-600">Admin</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input type="radio" name="status" value="manager" checked={status==='manager'} onChange={() => setStatus('manager')} />
            <span className="text-green-600">Manager</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input type="radio" name="status" value="client" checked={status==='client'} onChange={() => setStatus('client')} />
            <span className="text-gray-800">Client</span>
          </label>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ChangeStatusModal;
