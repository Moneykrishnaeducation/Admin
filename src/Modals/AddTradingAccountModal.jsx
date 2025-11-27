import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Play } from 'lucide-react';

const AddTradingAccountModal = ({ visible, onClose, userName, userId, isDarkMode = false }) => {
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

  const [leverageOptions, setLeverageOptions] = useState([]);
  const [tradingGroups, setTradingGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchOptions();
    }
  }, [visible]);

  const fetchOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leverageRes, groupsRes] = await Promise.all([
        fetch('/api/available-leverage/'),
        fetch('/api/available-groups/')
      ]);

      if (!leverageRes.ok || !groupsRes.ok) {
        throw new Error('Failed to fetch options');
      }

      const leverageData = await leverageRes.json();
      const groupsData = await groupsRes.json();

      setLeverageOptions(leverageData.leverage_options.map(opt => opt.value));
      setTradingGroups(groupsData.groups.map(group => ({ value: group.id, label: group.label })));
    } catch (err) {
      setError('Failed to load options. Please try again.');
      console.error('Error fetching options:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveFormChange = (e) => {
    const { name, value } = e.target;
    setLiveForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDemoFormChange = (e) => {
    const { name, value } = e.target;
    setDemoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateLiveAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const leverageNumeric = parseInt(liveForm.leverage.split(':')[1]);
      const payload = {
        userId: userId.toString(),
        accountName: liveForm.accountName || userName,
        leverage: leverageNumeric,
        group: liveForm.tradingGroup,
      };

      const response = await fetch('/api/create-trading-account/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create live trading account');
      }

      const data = await response.json();
      console.log('Live account created:', data);
      setLiveForm({ accountName: '', leverage: '', tradingGroup: '' });
      onClose();
      // Optionally, show success message or refresh data
    } catch (err) {
      setError('Failed to create live trading account. Please try again.');
      console.error('Error creating live account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const leverageNumeric = parseInt(demoForm.leverage.split(':')[1]);
      const payload = {
        userId: userId.toString(),
        accountName: demoForm.accountName || userName,
        leverage: leverageNumeric,
        balance: parseFloat(demoForm.initialDeposit),
      };

      const response = await fetch('/api/create-demo-account/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create demo account');
      }

      const data = await response.json();
      console.log('Demo account created:', data);
      setDemoForm({ accountName: '', leverage: '', initialDeposit: '10000' });
      onClose();
      // Optionally, show success message or refresh data
    } catch (err) {
      setError('Failed to create demo account. Please try again.');
      console.error('Error creating demo account:', err);
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {loading && (
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
              <span className="ml-2">Loading...</span>
            </div>
          )}
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
                    <option key={group.value} value={group.value}>
                      {group.label}
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
