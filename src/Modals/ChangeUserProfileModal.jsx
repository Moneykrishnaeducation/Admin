import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminAuthenticatedFetch } from "../utils/fetch-utils.js";

const apiClient = new AdminAuthenticatedFetch('');

const ChangeUserProfileModal = ({
  visible,
  onClose,
  onSubmit,
  isDarkMode
}) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) fetchGroups();
  }, [visible]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/available-groups/');
      setGroups(data?.available_groups || data?.groups || []);
    } catch (err) {
      console.error(err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedGroup) return alert('Please select a group');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2">
      <div className={`relative w-[95%] sm:max-w-md rounded-lg shadow-xl ${modalBg} max-h-[90vh] overflow-hidden`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-yellow-500">
            Select Trading Group
          </h3>
          <button onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <label className="block text-sm font-medium">
            Approved Groups
          </label>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={`w-full p-2 rounded ${inputBg} focus:ring-2 focus:ring-yellow-500`}
          >
            <option value="">-- Select a group --</option>

            {loading && (
              <option disabled>Loading groups...</option>
            )}

            {!loading && groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.alias || group.label || group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-400 text-black"
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChangeUserProfileModal;
