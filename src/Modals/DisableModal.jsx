import React from 'react';
import ModalWrapper from './ModalWrapper';

const DisableModal = ({ visible, onClose, accountId, action, onActionChange, onConfirm }) => {
  if (!visible) return null;

  return (
    <ModalWrapper title={`Account ${accountId}`} visible={visible} onClose={onClose}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300">Status:</span>
          <button
            onClick={onActionChange}
            className={`relative w-16 h-8 rounded-full transition ${
              action === "Enable" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <div
              className={`absolute top-1 h-6 w-6 bg-white rounded-full transition ${
                action === "Enable" ? "left-1" : "right-1"
              }`}
            ></div>
          </button>
        </div>
        <p className="mb-6">
          Are you sure you want to{" "}
          <span className="text-yellow-400 font-medium">{action}</span> this account?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-black transition ${
              action === "Enable"
                ? "bg-green-400 hover:bg-green-500"
                : "bg-red-400 hover:bg-red-500"
            }`}
          >
            {action}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DisableModal;
