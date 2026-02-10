import React from "react";
import TableStructure from "../commonComponent/TableStructure";
import { useTheme } from "../context/ThemeContext";

const IconWrapper = ({ children }) => (
  <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full mr-3">
    {children}
  </div>
);

const PartnershipModals = ({
  showCommissionModal,
  setShowCommissionModal,
  isCreateMode,
  setIsCreateMode,
  newProfile,
  setNewProfile,
  availableGroups,
  commissionProfiles,
  commissionProfileColumns,
  commissionActionsColumn,
  viewingGroups,
  setViewingGroups,
  setEditRowId,
  setEditedRowData,
  handleCreateProfile,
  showTransferModal,
  setShowTransferModal,
  selectedRow,
  selectedAccount,
  setSelectedAccount,
  withdrawAmount,
  setWithdrawAmount,
  databaseOnly,
  setDatabaseOnly,
  handleTransferSubmit,
  handleZeroBalance,
  tradingAccounts,
  commissionBalance,
  showProfileModal,
  setShowProfileModal,
  ProfileName,
  availableProfiles,
  selectedNewProfile,
  setSelectedNewProfile,
  handleChangeProfile,
  showAddClientModal,
  setShowAddClientModal,
  unassignedClients,
  selectedClient,
  setSelectedClient,
  clientSearchTerm,
  setClientSearchTerm,
  handleAddClientSubmit,
  showHistoryModal,
  setShowHistoryModal,
  historyData,
  clientListData,
  showStatisticsModal,
  setShowStatisticsModal,
  statisticsData,
  statisticsTab,
  setStatisticsTab,
  commissionDetailsData,
  commissionLevelFilter,
  setCommissionLevelFilter,
  commissionDateFrom,
  setCommissionDateFrom,
  commissionDateTo,
  setCommissionDateTo,
  showDisableIBModal,
  setShowDisableIBModal,
  showClientListModal,
  setShowClientListModal,
  selectedId,
  handleDisableIBSubmit,
}) => {
  const theme = useTheme() || {};
  const { isDarkMode = true } = theme;
  const [fetchedGroups, setFetchedGroups] = React.useState([]);
  const [editingGroups, setEditingGroupsLocal] = React.useState([]);
  const [viewingProfileId, setViewingProfileId] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (viewingGroups) {
      let initial = [];
      if (Array.isArray(viewingGroups)) {
        initial = viewingGroups.slice();
        setViewingProfileId(null);
      } else if (typeof viewingGroups === 'object' && viewingGroups !== null) {
        initial = viewingGroups.groups ?? viewingGroups.groupsList ?? viewingGroups.availableGroups ?? [];
        setViewingProfileId(viewingGroups.profileId ?? viewingGroups.profile_id ?? null);
      }
      setEditingGroupsLocal(Array.isArray(initial) ? initial : []);
      fetch('/api/trading-groups-non-demo/')
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;
          setFetchedGroups(data.available_groups || []);
        })
        .catch(() => {
          // console.error('Failed to load trading groups', err);
        });
    }
    return () => {
      mounted = false;
    };
  }, [viewingGroups]);
  return (
    <>
      {showCommissionModal && (
              <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-4`}>
                <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-4xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Commission Profiles
              </h2>
            </div>
            <button
              onClick={() => {
                setShowCommissionModal(false);
                setIsCreateMode(false);
              }}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
            {isCreateMode ? (
              <form
                onSubmit={handleCreateProfile}
                className="h-full flex flex-col gap-2"
              >
                {/* Profile Name */}
                <div className={`py-2 px-3  rounded shadow-sm`}>
                  <label className="block font-semibold mb-1">Profile Name</label>
                  <input
                    type="text"
                    className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                    value={newProfile.profileName}
                    onChange={(e) => setNewProfile({ ...newProfile, profileName: e.target.value })}
                    required
                  />
                </div>

                {/* Commission Type */}
                <div className={`py-2 px-3  rounded shadow-sm`}>
                  <label className="block font-semibold mb-1">Commission Type</label>
                  <div className="flex gap-4 mt-1">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="commissionType"
                        checked={!newProfile.isPercentageBased}
                        onChange={() => setNewProfile({ ...newProfile, isPercentageBased: false })}
                        className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                      />
                      <span className="ml-2">USD per Lot</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="commissionType"
                        checked={newProfile.isPercentageBased}
                        onChange={() => setNewProfile({ ...newProfile, isPercentageBased: true })}
                        className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                      />
                      <span className="ml-2">Percentage-based</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {newProfile.isPercentageBased ? (
                  <div className={`py-2 px-3  rounded shadow-sm`}>
                    <label className="block font-semibold mb-1">Level Percentages (e.g., 50,20,20,10)</label>
                    <input
                      type="text"
                      className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                      value={newProfile.levelPercentages}
                      onChange={(e) => setNewProfile({ ...newProfile, levelPercentages: e.target.value })}
                      placeholder="Comma-separated percentages"
                      pattern="^(?:\d+,)*\d+$"
                    />
                  </div>
                ) : (
                  <div className={`py-2 px-3  rounded shadow-sm`}>
                    <label className="block font-semibold mb-1">USD per Lot</label>
                    <input
                      type="text"
                      className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                      value={newProfile.usdPerLot}
                      onChange={(e) => setNewProfile({ ...newProfile, usdPerLot: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                )}

                {/* Select Groups */}
                <div className={`py-2 px-3  rounded shadow-sm`}>
                  <label className="block font-semibold mb-1">Select Groups</label>
                  <div className={`border rounded ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'} p-2 overflow-auto`} style={{ maxHeight: 150 }}>
                    {availableGroups.length > 0 ? (
                      availableGroups.map((g) => {
                        const checked = newProfile.selectedGroups.includes(g);
                        return (
                          <label key={g} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                              checked={checked}
                              onChange={(e) => {
                                setNewProfile((prev) => {
                                  const set = new Set(prev.selectedGroups || []);
                                  if (e.target.checked) set.add(g);
                                  else set.delete(g);
                                  return { ...prev, selectedGroups: Array.from(set) };
                                });
                              }}
                            />
                            <span className="select-none">{g}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No groups available</div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                        checked={availableGroups.length > 0 && newProfile.selectedGroups.length === availableGroups.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProfile((prev) => ({ ...prev, selectedGroups: Array.from(availableGroups) }));
                          } else {
                            setNewProfile((prev) => ({ ...prev, selectedGroups: [] }));
                          }
                        }}
                      />
                      <span className="ml-2">Select All Groups</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end mt-2">
                  <button
                    type="button"
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                    onClick={() => {
                      setShowCommissionModal(false);
                      setIsCreateMode(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="overflow-auto max-h-[60vh]">
                  <TableStructure
                    columns={commissionProfileColumns}
                    data={commissionProfiles}
                    actionsColumn={commissionActionsColumn}
                  />
                </div>
                {viewingGroups && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md p-2 sm:p-0">
                    <div className="bg-black text-white rounded-lg shadow-lg w-full max-w-2xl p-2 sm:p-4 relative">
                      <h3 className="text-lg font-semibold mb-2 text-yellow-400">Groups</h3>
                      <div style={{ maxHeight: 400, overflowY: 'auto' }} className="text-sm">
                        {fetchedGroups.length === 0 ? (
                          <div className="py-2">Loading groups...</div>
                        ) : (
                          fetchedGroups.map((g) => (
                            <label key={g} className="flex items-center py-1 border-b border-white/10">
                              <input
                                type="checkbox"
                                checked={editingGroups.includes(g)}
                                onChange={() => {
                                  setEditingGroupsLocal((prev) =>
                                    prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                                  );
                                }}
                                className="mr-2"
                              />
                              <span className="truncate">{g}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <div className="flex justify-end mt-3 gap-2">
                        <button
                          onClick={() => setViewingGroups(null)}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            if (typeof setEditedRowData === 'function') {
                              setEditedRowData((prev) => ({ ...prev, groupsList: editingGroups }));
                            }
                            setViewingGroups(null);
                            setViewingProfileId(null);
                          }}
                          className="bg-yellow-500 text-black px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowCommissionModal(false);
                    setEditRowId(null);
                    setEditedRowData({});
                  }}
                  className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={` ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-2xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Transfer Commission - {selectedRow?.ibUserName || "Unknown User"}
              </h2>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-300">Commission Balance: ${commissionBalance}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTransferSubmit();
              }}
              className="space-y-4"
            >
              <div className={`py-2 px-3 ${isDarkMode ? 'bg-black/70 text-white' : 'bg-gray-100 text-black'} rounded shadow-sm`}>
                <label className="block font-semibold mb-1">Select Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                  required
                >
                  <option value="">Select an account</option>
                  {tradingAccounts.map((account) => (
                    <option key={account.account_id} value={account.account_id}>
                      {account.account_name} ({account.account_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className={`py-2 px-3 ${isDarkMode ? 'bg-black/70 text-white' : 'bg-gray-100 text-black'} rounded shadow-sm`}>
                <label className="block font-semibold mb-1">Withdraw Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className={`py-2 px-3 ${isDarkMode ? 'bg-black/70 text-white' : 'bg-gray-100 text-black'} rounded shadow-sm`}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={databaseOnly}
                    onChange={(e) => setDatabaseOnly(e.target.checked)}
                    className={`${isDarkMode ? 'text-white' : 'text-black'}`}
                  />
                  <span className="ml-2">Database Only</span>
                </label>
              </div>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(commissionBalance.toString())}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Withdraw All
                </button>
                <button
                  type="button"
                  onClick={handleZeroBalance}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Zero Balance
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Withdraw
                </button>
              </div>
            </form>
            <button
              onClick={() => setShowTransferModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={` ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-2xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Change Commission Profile - {selectedId}
              </h2>
            </div>
            <div className="mb-6">
              <p className="text-lg text-gray-300">Current Profile: <span className="font-semibold text-white">{ProfileName?.profileName || "None"}</span></p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChangeProfile();
              }}
              className="space-y-6"
            >
              <div className={`py-3 px-4 rounded-lg shadow-sm border ${isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-black border-yellow-400/40'}`}>
                <label className="block font-semibold mb-2 text-yellow-400">Select New Profile</label>
                <select
                  value={selectedNewProfile}
                  onChange={(e) => setSelectedNewProfile(e.target.value)}
                  className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 ${isDarkMode ? 'bg-black text-white border-gray-600' : 'bg-white text-black border-yellow-400/40'}`}
                  required
                >
                  <option value="" className={isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}>Select a profile</option>
                  {availableProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id} className={isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="button"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                >
                  Change Profile
                </button>
              </div>
            </form>
            <button
              onClick={() => setShowProfileModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showAddClientModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={` ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-2xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Add Client - {selectedId}
              </h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddClientSubmit();
              }}
              className="space-y-4"
            >
              <div className={`py-2 px-3 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'} rounded shadow-sm`}>
                <label className="block font-semibold mb-1">Search Clients</label>
                <input
                  type="text"
                  className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Search by name or ID"
                />
              </div>
              <div className={`py-2 px-3 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'} rounded shadow-sm`}>
                <label className="block font-semibold mb-1">Select Client</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                  required
                >
                  <option value="">Select a client</option>
                  {unassignedClients
                    .filter(client =>
                      client.username?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                      client.user_id?.toString().includes(clientSearchTerm) ||
                      client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
                    )
                    .map((client) => (
                      <option key={client.user_id} value={client.user_id}>
                        {client.first_name} {client.last_name} - (ID: {client.user_id}) - {client.email}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end mt-4">
                <button
                  type="button"
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => setShowAddClientModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Add Client
                </button>
              </div>
            </form>
            <button
              onClick={() => setShowAddClientModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-4xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                History - {selectedId}
              </h2>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <TableStructure
                columns={[
                  { Header: "Transaction ID", accessor: "id" },
                  { Header: "Amount", accessor: "amount" },
                  { Header: "Trading Account ID", accessor: "tradingAccount" },
                  { Header: "Status", accessor: "status" },
                  { Header: "Created At", accessor: "created_at" },
                  { Header: "Approved At", accessor: "approved_at" },
                  { Header: "Approved By", accessor: "approved_by_username" },
                ]}
                data={historyData}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Close
              </button>
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showStatisticsModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={` ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-4xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Statistics - {selectedId}
              </h2>
            </div>
            <div className="flex justify-center items-center gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded-md font-semibold ${statisticsTab === "summary" ? "bg-yellow-400 text-black" : "bg-gray-600 text-white"
                  }`}
                onClick={() => setStatisticsTab("summary")}
              >
                Summary
              </button>
              <button
                className={`px-4 py-2 rounded-md font-semibold ${statisticsTab === "commissionStats" ? "bg-yellow-400 text-black" : "bg-gray-600 text-white"
                  }`}
                onClick={() => setStatisticsTab("commissionStats")}
              >
                Commission Stats
              </button>
            </div>
            <div className="text-center">
              {statisticsData ? (
                <div className="space-y-4">
                  {statisticsTab === "summary" && statisticsData ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-yellow-400">Commission Summary</h3>
                      <div className={`space-y-2 mb-6 rounded-lg p-3 ${isDarkMode ? 'bg-gray-900 border border-yellow-400/20 text-white' : 'bg-yellow-50 border border-yellow-400/20 text-black'}`}>
                        <div className="flex justify-between">
                          <span className="font-semibold">Withdrawable Commission:</span>
                          <span>${statisticsData.withdrawable_balance || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Commission Generated:</span>
                          <span>${statisticsData.total_earnings || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Commission Withdrawn:</span>
                          <span>${statisticsData.total_withdrawals || '0.00'}</span>
                        </div>
                      </div>
                      {statisticsData.levels && statisticsData.levels.length > 0 ? (
                        <div>
                          <h4 className="text-md font-semibold mb-2">Client Level Details</h4>
                          <div className="overflow-x-auto">
                            <table className={`w-full text-left border-collapse rounded-lg ${isDarkMode ? 'bg-gray-900 border border-yellow-400/20 text-white' : 'bg-yellow-50 border border-yellow-400/20 text-black'}`}>
                              <thead>
                                <tr className={isDarkMode ? 'bg-gray-800' : 'bg-yellow-100'}>
                                  <th className={`px-4 py-2 font-semibold ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>Client Level</th>
                                  <th className={`px-4 py-2 font-semibold ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>Number of Clients</th>
                                  <th className={`px-4 py-2 font-semibold ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>Total Commission</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statisticsData.levels.map((level, index) => (
                                  <tr key={index} className={isDarkMode ? (index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800') : (index % 2 === 0 ? 'bg-yellow-50' : 'bg-yellow-100')}>
                                    <td className={`px-4 py-2 ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>{level.level}</td>
                                    <td className={`px-4 py-2 ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>{level.client_count}</td>
                                    <td className={`px-4 py-2 ${isDarkMode ? 'border border-yellow-400/20' : 'border border-yellow-400/20'}`}>${level.total_commission}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p>No client level data available.</p>
                      )}
                    </div>
                  ) : statisticsTab === "commissionStats" ? (
                    <div>
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="flex flex-col">
                          <label className="block font-semibold mb-1">Commission Level</label>
                          <select
                            value={commissionLevelFilter}
                            onChange={(e) => setCommissionLevelFilter(e.target.value)}
                            className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-black text-white border-yellow-400' : 'bg-white text-black border-gray-300'}`}
                          >
                            <option value="">All</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="block font-semibold mb-1">Date From</label>
                          <input
                            type="date"
                            value={commissionDateFrom}
                            onChange={(e) => setCommissionDateFrom(e.target.value)}
                            className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-black text-white border-yellow-400' : 'bg-white text-black border-gray-300'}`}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="block font-semibold mb-1">Date To</label>
                          <input
                            type="date"
                            value={commissionDateTo}
                            onChange={(e) => setCommissionDateTo(e.target.value)}
                            className={`border rounded px-2 py-1 w-full ${isDarkMode ? 'bg-black text-white border-yellow-400' : 'bg-white text-black border-gray-300'}`}
                          />
                        </div>
                      </div>
                        {commissionDetailsData && commissionDetailsData.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <div className="overflow-auto max-h-[60vh]">
                            <TableStructure
                              columns={[
                                { Header: "Symbols", accessor: "symbol" },
                                { Header: "Position", accessor: "position_id" },
                                { Header: "Created Date", accessor: "created_at" },
                                { Header: "Volume", accessor: "lot_size" },
                                { Header: "partner Earned", accessor: "commission" },
                                {
                                  Header: "Profit/Loss",
                                  accessor: "profit",
                                  Cell: (cellValue) => {
                                    const num = Number(cellValue);
                                    const isNum = !Number.isNaN(num);
                                    const cls = isNum && num < 0 ? 'text-red-400' : 'text-green-400';
                                    return (
                                      <span className={cls}>
                                        {isNum ? num.toFixed(2) : cellValue}
                                      </span>
                                    );
                                  },
                                },
                                { Header: "Position Type", accessor: "position_type" },
                                { Header: "IB Level", accessor: "level" },
                                { Header: "Client", accessor: "client_email" },
                              ]}
                              data={commissionDetailsData}
                            />
                          </div>
                        </div>
                      ) : (
                        <p>No commission details available.</p>
                      )}
                    </div>
                  ) : (
                    <p>No data available for this tab.</p>
                  )}
                </div>
              ) : (
                <p>Loading statistics data...</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowStatisticsModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Close
              </button>
            </div>
            <button
              onClick={() => setShowStatisticsModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showDisableIBModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70' : 'bg-white/70'} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={` ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-2xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Disable IB - {selectedRow?.email || selectedId}
              </h2>
            </div>
            <div className="text-center mb-6">
              <p className="text-lg text-gray-300">Are you sure you want to disable IB for email: <span className="font-semibold text-white">{selectedRow?.email || selectedId}</span>?</p>
              <p className="text-sm text-red-400 mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button
                onClick={() => setShowDisableIBModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableIBSubmit}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-colors duration-200"
              >
                Disable IB
              </button>
            </div>
            <button
              onClick={() => setShowDisableIBModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {showClientListModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? 'bg-black/70 ' : 'bg-white/70 '} ${isDarkMode ? 'backdrop-blur-md' : 'backdrop-blur-sm'} animate-fadeIn p-2 sm:p-0`}>
          <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} rounded-2xl shadow-2xl w-full max-w-4xl p-2 sm:p-8 relative border border-yellow-400/20 transform transition-all duration-300 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center mb-6">
              <IconWrapper>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </IconWrapper>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Client List - {selectedId}
              </h2>
            </div>
            <div className="overflow-auto max-h-[60vh] space-y-6">
              {clientListData && clientListData.levels && clientListData.levels.length > 0 ? (
                clientListData.levels.map((levelData) => (
                  <div key={levelData.level} className={`border rounded-lg p-4 ${isDarkMode ? 'border-yellow-400/20 bg-gray-900/50' : 'border-yellow-400/40 bg-yellow-50/50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-yellow-400">
                        Level {levelData.level}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-yellow-400/20 text-yellow-400' : 'bg-yellow-400/30 text-yellow-600'}`}>
                        {levelData.clients?.length || 0} {levelData.clients?.length === 1 ? 'Client' : 'Clients'}
                      </span>
                    </div>
                    {levelData.clients && levelData.clients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <TableStructure
                          columns={[
                            { Header: "Name", accessor: "name" },
                            { Header: "Email", accessor: "email" },
                            { Header: "User ID", accessor: "user_id" },
                          ]}
                          data={levelData.clients}
                        />
                      </div>
                    ) : (
                      <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No clients in this level
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No client data available
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowClientListModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
              >
                Close
              </button>
            </div>
            <button
              onClick={() => setShowClientListModal(false)}
              className={`absolute top-3 right-3 ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-yellow hover:text-yellow-500'} font-bold text-2xl`}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PartnershipModals;
