import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TableStructure from "../commonComponent/TableStructure";
import HistoryModal from "../Modals/HistoryModal";
// Removed unused sample data to satisfy linter warnings



const MamAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mam"); // "mam" or "investor"
  // For expanded manager rows (showing clients)
  const [expandedManagers, setExpandedManagers] = useState({}); // { mamAccountId: { loading, error, clients: [] } }
  // Fetch clients for a manager (investors under a MAM account)
  const fetchClientsForManager = async (mamAccountId) => {
    setExpandedManagers((prev) => ({
      ...prev,
      [mamAccountId]: { loading: true, error: null, clients: [] },
    }));
    try {
      const endpoint = `/api/investor-accounts/?mam_id=${encodeURIComponent(mamAccountId)}`;
      const headers = { 'Content-Type': 'application/json' };
      let resJson;
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(endpoint);
      } else {
        const res = await fetch(endpoint, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch clients: ${res.status}`);
        resJson = await res.json();
      }
      const items = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : (resJson.results || []));
      setExpandedManagers((prev) => ({
        ...prev,
        [mamAccountId]: { loading: false, error: null, clients: items },
      }));
    } catch (err) {
      setExpandedManagers((prev) => ({
        ...prev,
        [mamAccountId]: { loading: false, error: err.message, clients: [] },
      }));
    }
  };


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && (tab === "mam" || tab === "investor")) {
      setActiveTab(tab);
    }
  }, [location.search]);



  
  // State for HistoryModal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [historyActiveTab, setHistoryActiveTab] = useState("transactions");

  // Handler for View button
  // Use mamAccountId for the trading account ID
  const handleViewHistory = (mamAccountId) => {
    // console.log('View button clicked with mamAccountId:', mamAccountId);
    setSelectedAccountId(mamAccountId);
    setHistoryActiveTab("transactions");
    setHistoryModalVisible(true);
  };

  const columnsMam = [
    {
      Header: "",
      accessor: "expand",
      Cell: (cellValue, row) => {
        const mamAccountId = row.mamAccountId;
        const expanded = expandedManagers[mamAccountId];
        return (
          <button
            className="px-2 py-1 mr-2 bg-gray-200 rounded hover:bg-gray-300 text-xs"
            onClick={() => {
              if (!expanded) fetchClientsForManager(mamAccountId);
              setExpandedManagers((prev) =>
                prev[mamAccountId]
                  ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== mamAccountId))
                  : { ...prev, [mamAccountId]: { loading: true, error: null, clients: [] } }
              );
              if (!expanded) fetchClientsForManager(mamAccountId);
            }}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "-" : "+"}
          </button>
        );
      },
    },
    { Header: "User ID", accessor: "userId" },
    { Header: "Name", accessor: "name" },
    { Header: "Manager Email", accessor: "managerEmail" },
    { Header: "MAM Account ID", accessor: "mamAccountId" },
    { Header: "Account Balance", accessor: "accountBalance" },
    { Header: "Total Profit", accessor: "totalProfit" },
    { Header: "Profit Share (%)", accessor: "profitShare" },
    { Header: "Risk Level", accessor: "riskLevel" },
    { Header: "Payout Frequency", accessor: "payoutFrequency" },
    {
      Header: "Action",
      accessor: "mamAccountId",
      Cell: (cellValue, row) => {
        const mamAccountId = cellValue;
        return (
          <button
            className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition text-xs font-semibold"
            onClick={() => {
              if (mamAccountId) {
                handleViewHistory(mamAccountId);
              }
            }}
          >
            View
          </button>
        );
      },
    },
  ];

  const columnsInvestor = [
    { Header: "User ID", accessor: "userId" },
    { Header: "Investor Name", accessor: "investorName" },
    { Header: "Investor Email", accessor: "investorEmail" },
    { Header: "Manager Name", accessor: "managerName" },
    { Header: "Trading Account ID", accessor: "tradingAccountId" },
    { Header: "Amount Invested", accessor: "amountInvested" },
    { Header: "Profit", accessor: "profit" },
    {
      Header: "Action",
      accessor: "tradingAccountId",
      Cell: (cellValue, row) => {
        // cellValue is the tradingAccountId, row is the full row data
        const tradingAccountId = cellValue;
        return (
          <button
            className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition text-xs font-semibold"
            onClick={() => {
              if (tradingAccountId) {
                handleViewHistory(tradingAccountId);
              } else {
                // console.warn('No tradingAccountId found');
              }
            }}
          >
            View
          </button>
        );
      },
    },
  ];

  const columns = activeTab === "mam" ? columnsMam : columnsInvestor;



  

  // Server-side fetch handler for MAM tables
  // Wrapped in useCallback so its identity is stable and TableStructure's
  // effect doesn't re-run on every render.
  const handleFetch = useCallback(async ({ page, pageSize, query }) => {
    // Use new backend endpoints added for MAM and Investor listings
    const endpoint = activeTab === 'mam' ? '/api/mam-accounts/' : '/api/investor-accounts/';
    const params = new URLSearchParams();
    params.set('page', String(page || 1));
    params.set('page_size', String(pageSize || 10));
    if (query) params.set('query', String(query));

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      let resJson;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        const headers = { 'Content-Type': 'application/json' };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      // Expect { data: [...], total: N } or fallback to array
      const items = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : (resJson.results || []));
      const total = typeof resJson.total === 'number' ? resJson.total : (typeof resJson.count === 'number' ? resJson.count : items.length);

      const mapped = items.map((item, idx) => {
        if (activeTab === 'mam') {
          const mappedItem = {
            id: item.id ?? item.pk ?? idx,
            userId: item.user_id ?? item.user ?? item.userId ?? '',
            // Prefer username, fall back to account_name or existing name
            name: (item.username ?? item.account_name ?? item.name) || `${(item.first_name || '')} ${(item.last_name || '')}`.trim() || 'Unknown',
            // Email field from API is `email`
            managerEmail: item.email ?? item.managerEmail ?? item.manager_email ?? '',
            // account id fields
            mamAccountId: item.account_id ?? item.accountId ?? item.mamAccountId ?? '',
            // balance can be under `balance` or `equity` (string) — normalize to number when possible
            accountBalance: item.balance ?? item.accountBalance ?? (item.equity ? Number(item.equity) : 0) ?? 0,
            // profit comes from `profit`
            totalProfit: item.profit ?? item.totalProfit ?? item.total_profit ?? 0,
            // profit sharing percentage from backend
            profitShare: item.profit_sharing_percentage ?? item.profitShare ?? item.profit_share ?? 0,
            riskLevel: item.risk_level ?? item.riskLevel ?? '',
            payoutFrequency: item.payout_frequency ?? item.payoutFrequency ?? '',
            accountId: item.account_id ?? item.accountId ?? '',
          };
          // console.log('Mapped MAM item:', mappedItem);
          return mappedItem;
        }

        // investor mapping
        return {
          id: item.id ?? item.pk ?? idx,
          // user id for first column
          userId: item.user_id ?? item.user ?? item.userId ?? '',
          // investor's displayed name
          investorName: item.username ?? item.investorName ?? `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() ?? '',
          investorEmail: item.investorEmail ?? item.email ?? item.investor_email ?? '',
          // manager/master name for this investor's MAM account
          managerName: item.mam_master_account_name ?? item.mam_master_account?.user?.username ?? item.managerName ?? '',
          tradingAccountId: item.tradingAccountId ?? item.trading_account_id ?? item.accountId ?? item.account_id ?? '',
          // amountInvested: prefer explicit invested fields, otherwise fall back to balance/equity
          amountInvested: (
            Number(item.amountInvested ?? item.amount_invested ?? item.invested_amount ?? null) ||
            Number(item.balance ?? item.equity ?? 0)
          ),
          profit: item.profit ?? item.total_profit ?? 0,
        };
      });

      // console.log('Returning data from handleFetch:', { data: mapped, total });
      return { data: mapped, total };
    } catch  {
      // console.error('MAM fetch error', err);
      return { data: [], total: 0 };
    }
  }, [activeTab]);

  return (
    <div className="p-6 max-w-9xl mx-auto relative">
      {/* Background blur for table when modal is open */}
      <div className="flex gap-4 mb-4  relative">
        <button
          className={`px-5 py-2 rounded-md font-semibold ${
            activeTab === "mam"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => {
            setActiveTab("mam");
            const params = new URLSearchParams(location.search);
            params.set("tab", "mam");
            navigate(`/manager/managermam?${params.toString()}`, { replace: true });
          }}
        >
          MAM Account
        </button>
        <button
          className={`px-5 py-2 rounded-md font-semibold ${
            activeTab === "investor"
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-yellow-300"
          }`}
          onClick={() => {
            setActiveTab("investor");
            const params = new URLSearchParams(location.search);
            params.set("tab", "investor");
            navigate(`/manager/managermam?${params.toString()}`, { replace: true });
          }}
        >
          Investor Account
        </button>
      </div>

      <div>
        {/* Custom rendering for expandable MAM rows */}
        {activeTab === "mam" ? (
          <TableStructure
            key={activeTab}
            columns={columns}
            data={[]}
            serverSide={true}
            onFetch={async (params) => {
              const result = await handleFetch(params);
              // Attach expanded state to each row for rendering
              result.data = result.data.map((row) => ({ ...row, _isManager: true }));
              return result;
            }}
            rowRenderer={(row, rowIndex) => {
              const mamAccountId = row.mamAccountId;
              const expanded = expandedManagers[mamAccountId];
              return (
                <React.Fragment key={mamAccountId}>
                  {/* Manager row */}
                  <tr>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="border px-2 py-1">{col.Cell ? col.Cell(row[col.accessor], row) : row[col.accessor]}</td>
                    ))}
                  </tr>
                  {/* Expanded client rows */}
                  {expanded && (
                    <tr>
                      <td colSpan={columns.length} className="bg-gray-50 px-4 py-2">
                        {expanded.loading && <div>Loading clients...</div>}
                        {expanded.error && <div className="text-red-500">Error: {expanded.error}</div>}
                        {!expanded.loading && !expanded.error && expanded.clients.length === 0 && (
                          <div>No clients found for this manager.</div>
                        )}
                        {!expanded.loading && !expanded.error && expanded.clients.length > 0 && (
                          <table className="w-full text-xs mt-2 border">
                            <thead>
                              <tr className="bg-gray-200">
                                <th>Investor Name</th>
                                <th>Investor Email</th>
                                <th>Trading Account ID</th>
                                <th>Amount Invested</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expanded.clients.map((client, idx) => (
                                <tr key={client.id || idx} className="border-b">
                                  <td>{client.username || client.investorName || `${client.first_name || ''} ${client.last_name || ''}`}</td>
                                  <td>{client.email || client.investorEmail || client.investor_email}</td>
                                  <td>{client.account_id || client.tradingAccountId || client.trading_account_id}</td>
                                  <td>{client.amount_invested || client.amountInvested || client.balance || client.equity || 0}</td>
                                  <td>{client.profit || client.total_profit || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }}
          />
        ) : (
          <TableStructure
            key={activeTab}
            columns={columns}
            data={[]}
            serverSide={true}
            onFetch={handleFetch}
          />
        )}
      </div>

      {/* History Modal rendered outside the TableStructure for proper state updates */}
      <HistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        accountId={selectedAccountId}
        activeTab={historyActiveTab}
        setActiveTab={setHistoryActiveTab}
      />
    </div>
  );
};

export default MamAccount;