import React, { useState, useMemo, useEffect, useCallback } from "react";
import TableStructure from "../commonComponent/TableStructure";
import { useTheme } from "../context/ThemeContext";

const ManagerActivities = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Server-side fetch handler for TableStructure
  const handleFetch = useCallback(async (paginationParams = {}) => {
    setError(null);
    setLoading(true);
    const endpoint = "/api/activity/ib-clients/";

    // Use pagination params if provided, otherwise use state
    const currentPage = paginationParams.page || page;
    const currentPageSize = paginationParams.pageSize || pageSize;
    const query = paginationParams.query !== undefined ? paginationParams.query : searchQuery;

    try {
      const client = window && window.adminApiClient ? window.adminApiClient : null;
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('page_size', String(currentPageSize));
      if (query) params.set('query', String(query));

      let resJson;
      if (client && typeof client.get === 'function') {
        resJson = await client.get(`${endpoint}?${params.toString()}`);
      } else {
        // Tokens are now in HttpOnly cookies - no need to manually add Authorization header
        const headers = {
          'Content-Type': 'application/json',
        };
        const res = await fetch(`${endpoint}?${params.toString()}`, { credentials: 'include', headers });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}: ${res.status}`);
        resJson = await res.json();
      }

      // Expect backend to return { data: [...], total: N } OR just the array
      let items = [];
      let totalCount = 0;

      // Check if response has data property or is directly an array
      if (resJson && resJson.data && Array.isArray(resJson.data)) {
        items = resJson.data;
        totalCount = resJson.total || resJson.data.length;
      } else if (Array.isArray(resJson)) {
        items = resJson;
        totalCount = resJson.length;
      } else if (resJson && Array.isArray(resJson.results)) {
        items = resJson.results;
        totalCount = resJson.count || resJson.results.length;
      }

      console.log("Mapped items:", items.length, "Total:", totalCount);

      const mapped = items.map((item, idx) => ({
        id: item.id ?? item.pk ?? idx,
        time: item.time ?? item.created_at ?? item.timestamp ?? item.date ?? null,
        user: item.user ?? item.username ?? item.email ?? item.name ?? "Unknown",
        activity: item.activity ?? item.action ?? item.event ?? "",
        ipAddress: item.ip_address ?? item.ip ?? item.ipAddress ?? "",
        userAgent: item.user_agent ?? item.userAgent ?? "",
      }));

      // Update state with fetched data
      setTableData(mapped);
      setTotal(totalCount);
      setPage(currentPage);
      setPageSize(currentPageSize);
      setLoading(false);

      return { data: mapped, total: totalCount };
    } catch (err) {
      setError(err.message || String(err));
      setTableData([]);
      setTotal(0);
      setLoading(false);
      return { data: [], total: 0 };
    }
  }, [page, pageSize, searchQuery]);

  // Fetch data on component mount
  useEffect(() => {
    handleFetch({ page: 1, pageSize: 10, query: "" });
  }, [handleFetch]);

  // Fetch data when page or pageSize changes
  useEffect(() => {
    if (page > 0 && pageSize > 0) {
      handleFetch({ page, pageSize, query: searchQuery });
    }
  }, [page, pageSize, searchQuery, handleFetch]);

  const columns = [
    {
      Header: "Time",
      accessor: "time",
      // TableStructure calls Cell as Cell(cellValue, row)
      Cell: (value) => {
        if (!value) return "-";
        const date = new Date(value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      },
    },
    { Header: "User", accessor: "user" },
    { Header: "Activity", accessor: "activity" },
    { Header: "IP Address", accessor: "ipAddress" },
    { Header: "User Agent", accessor: "userAgent" },
  ];

  const handlePageChange = (newPage) => {
    console.log("Page changed to:", newPage);
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log("Page size changed to:", newPageSize);
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {loading && <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading logs...</div>}
      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <TableStructure
        columns={columns}
        data={tableData}
        serverSide={true}
        onFetch={handleFetch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
      />
    </div>
  );
};

export default ManagerActivities;
