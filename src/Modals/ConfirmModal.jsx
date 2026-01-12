import React from 'react';
import ModalWrapper from './ModalWrapper';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ConfirmModal = ({ visible, title = 'Confirm', message = '', onCancel, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
  const { isDarkMode } = useTheme();
  const textMain = isDarkMode ? 'text-white' : 'text-black';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-gray-900' : 'bg-white';

  const footer = (
    <div className="flex justify-center gap-3">
      <button
        onClick={onCancel}
        className={`px-4 py-2 rounded-md border ${isDarkMode ? 'text-white border-gray-700' : 'text-black border-gray-300'}`}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        className="px-4 py-2 rounded-md bg-red-600 text-white"
      >
        {confirmLabel}
      </button>
    </div>
  );

  return (
    <ModalWrapper title={title} visible={visible} onClose={onCancel} footer={footer} maxWidthClass="max-w-md">
      <div className={`p-4 ${cardBg} rounded-md`}>
        <p className={`text-sm ${textMuted}`}>{message}</p>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmModal;
