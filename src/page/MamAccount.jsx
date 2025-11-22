import React, { useState, useMemo } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const sampleMamAccounts = [
  {
    id: 1,
    name: "John Manager",
    managerEmail: "john.manager@example.com",
    mamAccountId: "MAM001",
    accountBalance: 50000,
    totalProfit: 12000,
    profitShare: 25,
    riskLevel: "Medium",
    payoutFrequency: "Monthly",
  },
  {
    id: 2,
    name: "Lisa Manager",
    managerEmail: "lisa.manager@example.com",
    mamAccountId: "MAM002",
    accountBalance: 75000,
    totalProfit: 18000,
    profitShare: 30,
    riskLevel: "High",
    payoutFrequency: "Quarterly",
  },
];

const sampleInvestorAccounts = [
  {
    id: 1,
    investorEmail: "investor1@example.com",
    mamAccountName: "John Manager",
    tradingAccountId: "TA1001",
    amountInvested: 10000,
    profit: 2500,
  },
  {
    id: 2,
    investorEmail: "investor2@example.com",
    mamAccountName: "Lisa Manager",
    tradingAccountId: "TA1002",
    amountInvested: 15000,
    profit: 4000,
  },
];

const MamAccount = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("mam"); // "mam" or "investor"
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpanded = (row) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(row.id)) {
        newSet.delete(row.id);
      } else {
        newSet.add(row.id);
      }
      return newSet;
    });
  };

  const columnsMam = [
    { Header: "Name", accessor: "name" },
    { Header: "Manager Email", accessor: "managerEmail" },
    { Header: "MAM Account ID", accessor: "mamAccountId" },
    { Header: "Account Balance", accessor: "accountBalance" },
    { Header: "Total Profit", accessor: "totalProfit" },
    { Header: "Profit Share (%)", accessor: "profitShare" },
    { Header: "Risk Level", accessor: "riskLevel" },
    { Header: "Payout Frequency", accessor: "payoutFrequency" },
  ];

  const columnsInvestor = [
    { Header: "Investor Email", accessor: "investorEmail" },
    { Header: "MAM Account Name", accessor: "mamAccountName" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Amount Invested", accessor: "amountInvested" },
    { Header: "Profit", accessor: "profit" },
  ];

  const data = useMemo(() => {
    const sourceData = activeTab === "mam" ? sampleMamAccounts : sampleInvestorAccounts;
    if (!searchText.trim()) {
      return sourceData;
    }
    const lowerSearch = searchText.toLowerCase();
    return sourceData.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [activeTab, searchText]);

  const columns = activeTab === "mam" ? columnsMam : columnsInvestor;

  const renderRowSubComponent = (row) => {
    const isExpanded = expandedRows.has(row.id);
    const actionItems = [
      { icon: "💰", label: "Deposit" },
      { icon: "💸", label: "Withdrawal" },
      { icon: "➕", label: "Credit In" },
      { icon: "➖", label: "Credit Out" },
      { icon: "🛑", label: "Disable" },
      { icon: "🕒", label: "History" },
    ];

    return (
      <tr style={{ height: isExpanded ? "auto" : 0, overflow: "hidden" }}>
        <td colSpan={columns.length} className="p-3">
          <div
            style={{
              maxHeight: isExpanded ? 100 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease',
              opacity: isExpanded ? 1 : 0,
            }}
            className={`bg-gray-800 text-yellow-400 rounded p-2 flex gap-4 flex-wrap`}
          >
            {actionItems.map(({ icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`${label} clicked for ${row.name || row.investorEmail}`);
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "mam"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => setActiveTab("mam")}
        >
          MAM Account
        </button>
        <button
          className={`px-5 py-2 rounded-full font-semibold ${
            activeTab === "investor"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => setActiveTab("investor")}
        >
          Investor Account
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <div
          className={`flex items-center gap-2 border border-yellow-500 rounded-md px-3 py-2 w-full sm:w-72 ${
            isDarkMode ? "bg-black" : "bg-white"
          } hover:bg-gray-900 transition`}
        >
          <Search size={18} className="text-yellow-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "mam" ? "MAM" : "Investor"} accounts...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`bg-transparent w-full focus:outline-none ${
              isDarkMode
                ? "text-yellow-300 placeholder-yellow-400"
                : "text-black placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      <TableStructure
        columns={columns}
        data={data}
        onRowClick={toggleRowExpanded}
        renderRowSubComponent={renderRowSubComponent}
      />
    </div>
  );
};

export default MamAccount;
