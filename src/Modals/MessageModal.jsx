import React from 'react';
import ModalWrapper from './ModalWrapper';
import { useTheme } from '../context/ThemeContext';

const MessageModal = ({ visible, title = 'Message', message = '', onClose, okLabel = 'OK' }) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;
  const textMain = isDarkMode ? 'text-white' : 'text-black';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = isDarkMode ? 'bg-gray-900' : 'bg-white';

  const footer = (
    <div className="flex justify-center">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-md bg-yellow-500 text-black"
      >
        {okLabel}
      </button>
    </div>
  );

  return (
    <ModalWrapper title={title} visible={visible} onClose={onClose} footer={footer} maxWidthClass="max-w-sm">
      <div className={`p-4 ${cardBg} rounded-md`}>
        <p className={`text-sm ${textMuted}`}>{message}</p>
      </div>
    </ModalWrapper>
  );
};

export default MessageModal;
