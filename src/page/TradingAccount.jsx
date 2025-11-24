
import React, { useEffect, useState } from "react";
import TableStructure from "../commonComponent/TableStructure";
import Header from "../commonComponent/Header";
import { DepositModal, WithdrawModal } from "../Modals";

const sampleAccounts = [
	{
		id: 1,
		userId: "7001477",
		name: "Thilsath",
		email: "raffiullah2020@gmail.com",
		accountId: "2141713782",
		balance: 0,
		leverage: "1:500",
        group: "Real-ECN",
		status: "Running",
		country: "India",
	},
	{
		id: 2,
		userId: "7001488",
		name: "Aisha",
		email: "aisha@example.com",
		accountId: "2141713800",
		balance: 523.5,
		leverage: "1:200",
        group: "Demo-Standard",
		country: "USA",
	},
];

const currencyFormatter = (v) => {
	if (typeof v !== "number") return v;
	return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
};

const TradingAccountPage = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [expandedId, setExpandedId] = useState(null);

	// modal state
	const [depositVisible, setDepositVisible] = useState(false);
	const [withdrawVisible, setWithdrawVisible] = useState(false);
	const [modalAccountId, setModalAccountId] = useState(null);

	// server-side fetch callback for TableStructure
	const handleFetch = async ({ page, pageSize, query }) => {
		// Build query params expected by backend. Adjust keys if your API differs.
		const params = new URLSearchParams();
		params.set("page", page);
		params.set("page_size", pageSize);
		if (query) {
			params.set("search", query);
			params.set("q", query);
		}

		const urlCandidates = [
			"/api/admin/trading-accounts/",
			"/api/trading-accounts/",
			"/admin-api/trading-accounts/",
		];

		// Try endpoints in order until one succeeds
		for (const base of urlCandidates) {
			try {
				const res = await fetch(base + "?" + params.toString(), {
					credentials: "same-origin",
					headers: {
						"Accept": "application/json",
					},
				});
				if (!res.ok) {
					// try next candidate
					continue;
				}
				const json = await res.json();

				// Normalize response formats
				// Common DRF: { results: [...], count: N }
				if (Array.isArray(json)) {
					return { data: json, total: json.length };
				}
				if (json.results && typeof json.count === "number") {
					return { data: json.results, total: json.count };
				}
				if (json.items && typeof json.total === "number") {
					return { data: json.items, total: json.total };
				}
				if (json.data && typeof json.total === "number") {
					return { data: json.data, total: json.total };
				}

				// Fallback: if object has keys 'rows' and 'total'
				if (json.rows && typeof json.total === "number") {
					return { data: json.rows, total: json.total };
				}

				// If response has 'count' and arbitrary key containing array
				const arrKey = Object.keys(json).find((k) => Array.isArray(json[k]));
				if (arrKey) {
					const total = typeof json.count === "number" ? json.count : json[arrKey].length;
					return { data: json[arrKey], total };
				}

				// If nothing matched, return empty
				return { data: [], total: 0 };
			} catch (err) {
				// try next candidate
				console.debug("tradingaccount.onFetch candidate failed:", base, err.message);
				continue;
			}
		}

		// All endpoints failed
		return { data: [], total: 0 };
	};

	const columns = [
		{ Header: "User ID", accessor: "userId" },
		{ Header: "Name", accessor: "name" },
		{ Header: "Email", accessor: "email" },
		{ Header: "Account ID", accessor: "accountId" },
		{
			Header: "Balance",
			accessor: "balance",
			Cell: (value) => <strong>{currencyFormatter(value)}</strong>,
		},
		{ Header: "Leverage", accessor: "leverage" },
        { Header: "Group", accessor: "group" },
		{
			Header: "Status",
			accessor: "status",
			Cell: (value) => (
				<span
					className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
						value === "Running" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
					}`}
				>
					{value}
				</span>
			),
		},
		{ Header: "Country", accessor: "country" },
	];

	const onRowClick = (row) => {
		setExpandedId((prev) => (prev === row.id ? null : row.id));
	};

	const openDeposit = (accountId) => {
		setModalAccountId(accountId);
		setDepositVisible(true);
	};

	const openWithdraw = (accountId) => {
		setModalAccountId(accountId);
		setWithdrawVisible(true);
	};

	const closeModals = () => {
		setDepositVisible(false);
		setWithdrawVisible(false);
		setModalAccountId(null);
	};

	const handleDepositSubmit = async ({ accountId, amount, comment }) => {
		// TODO: replace with real API call
		console.log('Deposit submit', { accountId, amount, comment });
		closeModals();
	};

	const handleWithdrawSubmit = async ({ accountId, amount, comment }) => {
		// TODO: replace with real API call
		console.log('Withdraw submit', { accountId, amount, comment });
		closeModals();
	};

	const renderRowSubComponent = (row) => {
		if (expandedId !== row.id) return null;

		return (
			<tr>
				<td colSpan={columns.length} className="bg-gray-200/20">
					<div className="p-4 flex flex-wrap gap-3">
						<button type="button" onClick={() => { console.log('deposit clicked', row); openDeposit(row.accountId); }} className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Deposit</button>
						<button type="button" onClick={() => { console.log('withdraw clicked', row); openWithdraw(row.accountId); }} className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Withdrawal</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Bonus</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Credit In</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Credit Out</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Disable</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Enable Algo</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Leverage</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">Profile</button>
						<button type="button" className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded shadow">History</button>
					</div>
				</td>
			</tr>
		);
	};

	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4 text-yellow-400">Trading Accounts</h2>

			{loading && <div className="text-white">Loading accounts…</div>}
			{error && <div className="text-red-400">{error}</div>}

			<TableStructure
				columns={columns}
				data={data}
				serverSide={true}
				onFetch={handleFetch}
				initialPageSize={10}
				topActions={
					<button
						title="Open Internal Transfer"
						aria-label="Internal Transfer"
						className="bg-yellow-400 text-black px-3 py-2 rounded-md font-semibold flex items-center gap-2"
						onClick={() => window.open('/admin/internal-transfer/', '_blank')}
					>
						{/* transfer icon */}
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
						</svg>
						<span>Internal Transfer</span>
					</button>
				}
				renderRowSubComponent={renderRowSubComponent}
				onRowClick={onRowClick}
			/>

			{/* Modals */}
			<DepositModal
				visible={depositVisible}
				onClose={closeModals}
				accountId={modalAccountId}
				onSubmit={handleDepositSubmit}
			/>
			<WithdrawModal
				visible={withdrawVisible}
				onClose={closeModals}
				accountId={modalAccountId}
				onSubmit={handleWithdrawSubmit}
			/>
		</div>
	);
};

export default TradingAccountPage;
