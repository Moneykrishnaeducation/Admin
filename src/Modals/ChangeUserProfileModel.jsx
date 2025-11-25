import React, { useState } from 'react';
import { X } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

const ChangeUserProfileModal = ({ 
  visible, 
  onClose, 
  groups = [], 
  onSubmit,
  isDarkMode 
}) => {
  const [selectedGroup, setSelectedGroup] = useState('');

  const handleSubmit = () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }
    onSubmit(selectedGroup);
    setSelectedGroup('');
  };

  const handleClose = () => {
    setSelectedGroup('');
    onClose();
  };

  if (!visible) return null;

  const modalBg = isDarkMode 
    ? 'bg-gray-900 text-yellow-300 border border-yellow-700' 
    : 'bg-white text-black border border-gray-200';
  const inputBg = isDarkMode
    ? 'bg-gray-800 text-yellow-200 border border-yellow-600'
    : 'bg-gray-50 text-black border border-gray-300';
  const btnClose = isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600'
    : 'bg-gray-300 text-black hover:bg-gray-400';
  const btnSubmit = 'bg-yellow-500 text-black hover:bg-yellow-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-xl ${modalBg}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" 
             style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Select Trading Group
          </h3>
          <button 
            onClick={handleClose} 
            className="p-1 hover:bg-opacity-80 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="trading-group-select" className="block text-sm font-medium mb-2">
              Approved Groups
            </label>
            <select
              id="trading-group-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`w-full p-2 rounded border ${inputBg} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            >
              <option value="">-- Select a group --</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t"
             style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded font-medium transition ${btnClose}`}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded font-medium transition ${btnSubmit}`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeUserProfileModal;
