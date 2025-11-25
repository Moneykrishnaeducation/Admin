import React, { useState } from "react";
import TableStructure from "../commonComponent/TableStructure";

const Partnership = () => {
  const [activeTab, setActiveTab] = useState("partnerList");
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editedRowData, setEditedRowData] = useState({});

  // New states for create mode and new commission form
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newProfile, setNewProfile] = useState({
    profileName: "",
    usdPerLot: "",
    isPercentageBased: false,
    levelPercentages: "",
    selectedGroups: [],
  });

  const partnerListColumns = [
    { Header: "IB User Name", accessor: "ibUserName" },
    { Header: "User ID", accessor: "userId" },
    { Header: "Commission Profile", accessor: "commissionProfile" },
    { Header: "Total Clients", accessor: "totalClients" },
  ];

  const withdrawalRequestColumns = [
    { Header: "Transaction ID", accessor: "transactionId" },
    { Header: "User Name", accessor: "userName" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Type", accessor: "type" },
    { Header: "Amount", accessor: "amount" },
    { 
      Header: "Status", 
      accessor: "status",
      Cell: (value) => (
        <span className={value === "approved" ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { Header: "Created At", accessor: "createdAt" },
  ];

 const withdrawalRequestActions = () => (
  <div className="flex gap-2">
    {/* Approve Button */}
    <button className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition">
      Approve
    </button>
    
    {/* Reject Button */}
    <button className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition">
      Reject
    </button>
  </div>
);


  const withdrawalPendingColumns = [
    { Header: "Transaction ID", accessor: "transactionId" },
    { Header: "User Name", accessor: "userName" },
    { Header: "E-Mail", accessor: "email" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Date", accessor: "date" },
    { Header: "Amount", accessor: "amount" },
    { Header: "Status", accessor: "status" },
  ];

  // Placeholder sample data for demonstration
  const partnerListData = [
    { ibUserName: "john_doe", userId: "001", commissionProfile: "Gold", totalClients: 15 },
    { ibUserName: "jane_smith", userId: "002", commissionProfile: "Silver", totalClients: 10 },
  ];

  const withdrawalRequestData = [
    {
      transactionId: "TXN1001",
      userName: "john_doe",
      email: "john@example.com",
      tradingAccountId: "TA1234",
      type: "Withdrawal",
      amount: "$500",
      status: "approved",
      createdAt: "2024-06-01 12:00",
    },
    {
      transactionId: "TXN1002",
      userName: "jane_smith",
      email: "jane@example.com",
      tradingAccountId: "TA5678",
      type: "Withdrawal",
      amount: "$250",
      status: "rejected",
      createdAt: "2024-06-02 13:30",
    },
  ];

  const withdrawalPendingData = [
    {
      transactionId: "TXN2001",
      userName: "alice_wonder",
      email: "alice@example.com",
      tradingAccountId: "TA9999",
      date: "2024-06-03",
      amount: "$1000",
      status: "Pending",
    },
    {
      transactionId: "TXN2002",
      userName: "bob_builder",
      email: "bob@example.com",
      tradingAccountId: "TA8888",
      date: "2024-06-04",
      amount: "$300",
      status: "Pending",
    },
  ];

  // Commission profiles data and columns for modal
  const [commissionProfiles, setCommissionProfiles] = useState([
    {
      id: "1",
      profileName: "Gold Plan",
      profileId: "GP001",
      commissionDetails: "15% on sales",
      type: "Fixed",
      groups: "Group A",
    },
    {
      id: "2",
      profileName: "Silver Plan",
      profileId: "SP002",
      commissionDetails: "10% on sales",
      type: "Variable",
      groups: "Group B",
    },
  ]);

  const commissionProfileColumns = [
    {
      Header: "Profile Name",
      accessor: "profileName",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <input
              type="text"
              value={editedRowData.profileName || ""}
              onChange={(e) => handleEditChange("profileName", e.target.value)}
              className="border p-1 rounded w-full"
            />
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Profile ID",
      accessor: "profileId",
      Cell: (cellValue) => <span className="select-none">{cellValue}</span>, // Non-editable
    },
    {
      Header: "Commission Details",
      accessor: "commissionDetails",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <input
              type="text"
              value={editedRowData.commissionDetails || ""}
              onChange={(e) => handleEditChange("commissionDetails", e.target.value)}
              className="border p-1 rounded w-full"
            />
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Type",
      accessor: "type",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <select
              value={editedRowData.type || ""}
              onChange={(e) => handleEditChange("type", e.target.value)}
              className="border p-1 rounded w-full"
            >
              <option value="">Select Type</option>
              <option value="Fixed">Fixed</option>
              <option value="Variable">Variable</option>
            </select>
          );
        }
        return cellValue;
      },
    },
    {
      Header: "Groups",
      accessor: "groups",
      Cell: (cellValue, row) => {
        if (editRowId === row.id) {
          return (
            <input
              type="text"
              value={editedRowData.groups || ""}
              onChange={(e) => handleEditChange("groups", e.target.value)}
              className="border p-1 rounded w-full"
            />
          );
        }
        return cellValue;
      },
    },
  ];

  // Handlers for editing
  const handleEditChange = (field, value) => {
    setEditedRowData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditedRowData(row);
  };

  const handleDeleteClick = (row) => {
    if (window.confirm(`Are you sure you want to delete profile "${row.profileName}"?`)) {
      setCommissionProfiles(prev => prev.filter(item => item.id !== row.id));
      if (editRowId === row.id) {
        setEditRowId(null);
        setEditedRowData({});
      }
    }
  };

  const handleSaveClick = () => {
    setCommissionProfiles(prev =>
      prev.map(item => (item.id === editRowId ? { ...item, ...editedRowData } : item))
    );
    setEditRowId(null);
    setEditedRowData({});
  };

  const handleCancelClick = () => {
    setEditRowId(null);
    setEditedRowData({});
  };


  // Actions column for commission profiles modal table
  const commissionActionsColumn = (row) => {
    if (editRowId === row.id) {
      return (
        <div className="flex gap-2">
          <button
            onClick={handleSaveClick}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={handleCancelClick}
            className="bg-gray-400 text-white px-2 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleEditClick(row)}
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteClick(row)}
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    );
  };

  // Determine columns, data, and actions based on active tab
  let columns = [];
  let data = [];
  let actionsColumn = undefined;

  switch (activeTab) {
    case "partnerList":
      columns = partnerListColumns;
      data = partnerListData;
      actionsColumn = undefined;
      break;
    case "withdrawalRequest":
      columns = withdrawalRequestColumns;
      data = withdrawalRequestData;
      actionsColumn = withdrawalRequestActions;
      break;
    case "withdrawalPending":
      columns = withdrawalPendingColumns;
      data = withdrawalPendingData;
      actionsColumn = undefined;
      break;
    default:
      break;
  }

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === "partnerList" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("partnerList")}
        >
          Partner List
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === "withdrawalRequest" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("withdrawalRequest")}
        >
          Withdrawal Request
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === "withdrawalPending" ? "bg-yellow-400 text-black" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("withdrawalPending")}
        >
          Withdrawal Pending
        </button>
      </div>

      <div className="flex justify-between mb-4">
        <button
          className="bg-gray-300 text-black px-3 py-1 rounded-md"
          onClick={() => setShowCommissionModal(true)}
        >
          View list
        </button>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
          onClick={() => {
            setIsCreateMode(true);
            setShowCommissionModal(true);
            setEditRowId(null);
            setEditedRowData({});
            setNewProfile({
              profileName: "",
              usdPerLot: "",
              isPercentageBased: false,
              levelPercentages: "",
              selectedGroups: [],
            });
          }}
        >
          +Create
        </button>
      </div>

      <TableStructure
        columns={columns}
        data={data}
        actionsColumn={actionsColumn}
      />

      {showCommissionModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
    <div className="bg-black text-white rounded-lg shadow-lg w-11/12 max-w-4xl p-6 relative">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Commission Profiles</h2>
      {isCreateMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProfile.profileName) {
              alert("Profile Name is required");
              return;
            }
            // Add new profile to profiles list
            setCommissionProfiles((prev) => [
              ...prev,
              {
                id: (prev.length + 1).toString(),
                profileName: newProfile.profileName,
                profileId: "CP" + (prev.length + 1).toString().padStart(3, "0"),
                commissionDetails: newProfile.isPercentageBased
                  ? `${newProfile.levelPercentages} %`
                  : `$${newProfile.usdPerLot} per Lot`,
                type: newProfile.isPercentageBased ? "Variable" : "Fixed",
                groups: newProfile.selectedGroups.join(", ") || "All Groups",
              },
            ]);
            // Reset modal state
            setShowCommissionModal(false);
            setIsCreateMode(false);
            setNewProfile({
              profileName: "",
              usdPerLot: "",
              isPercentageBased: false,
              levelPercentages: "",
              selectedGroups: [],
            });
          }}
          className="space-y-4"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm">
            <label className="block font-semibold mb-1">Profile Name</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-black text-white"
              value={newProfile.profileName}
              onChange={(e) => setNewProfile({ ...newProfile, profileName: e.target.value })}
              required
            />
          </div>
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Commission Type</label>
            <div className="flex gap-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={!newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: false })}
                  className="text-white"
                />
                <span className="ml-2">USD per Lot</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: true })}
                  className="text-white"
                />
                <span className="ml-2">Percentage-based</span>
              </label>
            </div>
          </div>
          {newProfile.isPercentageBased ? (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">Level Percentages (e.g., 50,20,20,10)</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.levelPercentages}
                onChange={(e) => setNewProfile({ ...newProfile, levelPercentages: e.target.value })}
                placeholder="Comma-separated percentages"
                pattern="^(?:\d+,)*\d+$"
              />
            </div>
          ) : (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">USD per Lot</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.usdPerLot}
                onChange={(e) => setNewProfile({ ...newProfile, usdPerLot: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>
          )}
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Select Groups</label>
            <select
              multiple
              value={newProfile.selectedGroups}
              onChange={(e) => {
                const options = e.target.options;
                const selected = [];
                for (let i = 0; i < options.length; i++) {
                  if (options[i].selected) {
                    selected.push(options[i].value);
                  }
                }
                setNewProfile({ ...newProfile, selectedGroups: selected });
              }}
              className="border rounded px-2 py-1 w-full bg-black text-white"
            >
              <option value="Group A">Group A</option>
              <option value="Group B">Group B</option>
              <option value="Group C">Group C</option>
              <option value="Group D">Group D</option>
            </select>
            <div className="mt-1">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={newProfile.selectedGroups.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewProfile({ ...newProfile, selectedGroups: [] });
                    }
                  }}
                  className="text-white"
                />
                <span className="ml-2">Select All Groups</span>
              </label>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-4">
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
          <TableStructure
            columns={commissionProfileColumns}
            data={commissionProfiles}
            actionsColumn={commissionActionsColumn}
          />
          <button
            onClick={() => {
              setShowCommissionModal(false);
              setEditRowId(null);
              setEditedRowData({});
            }}
            className="absolute top-3 right-3 text-white hover:text-gray-300 font-bold text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </>
      )}
        {showCommissionModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
    <div className="bg-black text-white rounded-lg shadow-lg w-11/12 max-w-4xl p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => {
          setShowCommissionModal(false);
          setIsCreateMode(false);
        }}
        className="absolute top-3 right-3 text-white hover:text-gray-300 font-bold text-2xl"
        aria-label="Close modal"
      >
        &times;
      </button>

      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Commission Profiles</h2>
      {isCreateMode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProfile.profileName) {
              alert("Profile Name is required");
              return;
            }
            // Add new profile to profiles list
            setCommissionProfiles((prev) => [
              ...prev,
              {
                id: (prev.length + 1).toString(),
                profileName: newProfile.profileName,
                profileId: "CP" + (prev.length + 1).toString().padStart(3, "0"),
                commissionDetails: newProfile.isPercentageBased
                  ? `${newProfile.levelPercentages} %`
                  : `$${newProfile.usdPerLot} per Lot`,
                type: newProfile.isPercentageBased ? "Variable" : "Fixed",
                groups: newProfile.selectedGroups.join(", ") || "All Groups",
              },
            ]);
            // Reset modal state
            setShowCommissionModal(false);
            setIsCreateMode(false);
            setNewProfile({
              profileName: "",
              usdPerLot: "",
              isPercentageBased: false,
              levelPercentages: "",
              selectedGroups: [],
            });
          }}
          className="space-y-4"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm">
            <label className="block font-semibold mb-1">Profile Name</label>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-black text-white"
              value={newProfile.profileName}
              onChange={(e) => setNewProfile({ ...newProfile, profileName: e.target.value })}
              required
            />
          </div>
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Commission Type</label>
            <div className="flex gap-4 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={!newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: false })}
                  className="text-white"
                />
                <span className="ml-2">USD per Lot</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="commissionType"
                  checked={newProfile.isPercentageBased}
                  onChange={() => setNewProfile({ ...newProfile, isPercentageBased: true })}
                  className="text-white"
                />
                <span className="ml-2">Percentage-based</span>
              </label>
            </div>
          </div>
          {newProfile.isPercentageBased ? (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">Level Percentages (e.g., 50,20,20,10)</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.levelPercentages}
                onChange={(e) => setNewProfile({ ...newProfile, levelPercentages: e.target.value })}
                placeholder="Comma-separated percentages"
                pattern="^(?:\d+,)*\d+$"
              />
            </div>
          ) : (
            <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
              <label className="block font-semibold mb-1">USD per Lot</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full bg-black text-white"
                value={newProfile.usdPerLot}
                onChange={(e) => setNewProfile({ ...newProfile, usdPerLot: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>
          )}
          <div className="py-2 px-3 bg-black text-white rounded shadow-sm mt-3">
            <label className="block font-semibold mb-1">Select Groups</label>
            <select
              multiple
              value={newProfile.selectedGroups}
              onChange={(e) => {
                const options = e.target.options;
                const selected = [];
                for (let i = 0; i < options.length; i++) {
                  if (options[i].selected) {
                    selected.push(options[i].value);
                  }
                }
                setNewProfile({ ...newProfile, selectedGroups: selected });
              }}
              className="border rounded px-2 py-1 w-full bg-black text-white"
            >
              <option value="Group A">Group A</option>
              <option value="Group B">Group B</option>
              <option value="Group C">Group C</option>
              <option value="Group D">Group D</option>
            </select>
            <div className="mt-1">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={newProfile.selectedGroups.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewProfile({ ...newProfile, selectedGroups: [] });
                    }
                  }}
                  className="text-white"
                />
                <span className="ml-2">Select All Groups</span>
              </label>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-4">
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
          <TableStructure
            columns={commissionProfileColumns}
            data={commissionProfiles}
            actionsColumn={commissionActionsColumn}
          />
          {/* Close button to close modal */}
        </>
      )}
    </div>
  </div>
)}


          </div>
        </div>
      )}
    </div>
  );
};

export default Partnership;
