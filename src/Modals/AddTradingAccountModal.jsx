import React, { useState } from 'react';
import { X, TrendingUp, Play } from 'lucide-react';

const AddTradingAccountModal = ({ visible, onClose, userName, isDarkMode = false }) => {
  const [activeTab, setActiveTab] = useState('Live');
  const [liveForm, setLiveForm] = useState({
    accountName: '',
    leverage: '',
    tradingGroup: '',
  });
  const [demoForm, setDemoForm] = useState({
    accountName: '',
    leverage: '',
    initialDeposit: '10000',
  });

  // Sample data for dropdowns
  const leverageOptions = ['1:10', '1:50', '1:100', '1:200', '1:500', '1:1000'];
  const tradingGroups = ['Standard Group', 'Premium Group', 'Elite Group', 'VIP Group'];

  const handleLiveFormChange = (e) => {
    const { name, value } = e.target;
    setLiveForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDemoFormChange = (e) => {
    const { name, value } = e.target;
    setDemoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateLiveAccount = (e) => {
    e.preventDefault();
    console.log('Creating live trading account:', {
      ...liveForm,
      userName,
    });
    // TODO: Call API to create live trading account
    setLiveForm({ accountName: '', leverage: '', tradingGroup: '' });
    onClose();
  };

  const handleCreateDemoAccount = (e) => {
    e.preventDefault();
    console.log('Creating demo account:', {
      ...demoForm,
      userName,
    });
    // TODO: Call API to create demo account
    setDemoForm({ accountName: '', leverage: '', initialDeposit: '10000' });
    onClose();
  };

  if (!visible) return null;

  const bgColor = isDarkMode ? 'bg-gray-900 text-yellow-300' : 'bg-white text-black';
  const borderColor = isDarkMode ? 'border-yellow-700' : 'border-gray-200';
  const inputBg = isDarkMode
    ? 'bg-gray-800 text-yellow-200 border border-yellow-600 placeholder-yellow-500'
    : 'bg-gray-50 text-black border border-gray-300 placeholder-gray-500';
  const labelColor = isDarkMode ? 'text-yellow-300' : 'text-gray-700';
  const tabActiveColor = 'bg-yellow-500 text-black';
  const tabInactiveColor = isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  const btnSubmit = 'bg-yellow-500 text-black hover:bg-yellow-400 transition';
  const btnCancel = isDarkMode
    ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700'
    : 'bg-gray-200 text-black border border-gray-300 hover:bg-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-xl ${bgColor} border ${borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Add Trading Account
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-opacity-80 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b" style={{ borderColor: isDarkMode ? '#b8860b33' : '#e5e7eb' }}>
          {['Live', 'Demo'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded font-medium transition flex items-center gap-2 ${
                activeTab === tab ? tabActiveColor : tabInactiveColor
              }`}
            >
              {tab === 'Live' ? <TrendingUp size={16} /> : <Play size={16} />}
              {tab} {tab === 'Live' ? 'Account' : 'Trading Group'}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Live Account Tab */}
          {activeTab === 'Live' && (
            <form onSubmit={handleCreateLiveAccount} className="space-y-4">
              <div>
                <label htmlFor="account_name" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Account Name (Optional):
                </label>
                <input
                  type="text"
                  id="account_name"
                  name="accountName"
                  placeholder="Leave empty to use username"
                  value={liveForm.accountName}
                  onChange={handleLiveFormChange}
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                />
              </div>

              <div>
                <label htmlFor="leverage" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Leverage:
                </label>
                <select
                  id="leverage"
                  name="leverage"
                  value={liveForm.leverage}
                  onChange={handleLiveFormChange}
                  required
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                >
                  <option value="">Select Leverage</option>
                  {leverageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tradingGroup" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Trading Group:
                </label>
                <select
                  id="tradingGroup"
                  name="tradingGroup"
                  value={liveForm.tradingGroup}
                  onChange={handleLiveFormChange}
                  required
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                >
                  <option value="">Select Trading Group</option>
                  {tradingGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-2 rounded font-medium transition ${btnCancel}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded font-medium flex items-center gap-2 transition ${btnSubmit}`}
                >
                  <TrendingUp size={16} />
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Demo Account Tab */}
          {activeTab === 'Demo' && (
            <form onSubmit={handleCreateDemoAccount} className="space-y-4">
              <div>
                <label htmlFor="demoAccountName" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Account Name (Optional):
                </label>
                <input
                  type="text"
                  id="demoAccountName"
                  name="accountName"
                  placeholder="Leave empty to use username"
                  value={demoForm.accountName}
                  onChange={handleDemoFormChange}
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                />
              </div>

              <div>
                <label htmlFor="demoLeverage" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Demo Leverage:
                </label>
                <select
                  id="demoLeverage"
                  name="leverage"
                  value={demoForm.leverage}
                  onChange={handleDemoFormChange}
                  required
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                >
                  <option value="">Select Leverage</option>
                  {leverageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="initialDeposit" className={`block text-sm font-medium mb-2 ${labelColor}`}>
                  Initial Deposit ($):
                </label>
                <input
                  type="number"
                  id="initialDeposit"
                  name="initialDeposit"
                  min="100"
                  step="0.01"
                  value={demoForm.initialDeposit}
                  onChange={handleDemoFormChange}
                  required
                  className={`w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-2 rounded font-medium transition ${btnCancel}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded font-medium flex items-center gap-2 transition ${btnSubmit}`}
                >
                  <Play size={16} />
                  Create Demo Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTradingAccountModal;
