import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Search } from "lucide-react";

const TableStructure = ({
  columns = [],
  data = [],
  renderRowSubComponent,
  actionsColumn,
  onRowClick,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  serverSide = false,
  onFetch, // async ({ page, pageSize, query }) => ({ data: [], total: number })
  topActions = null, // React node to render at top-left of table controls
}) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [expandedRow, setExpandedRow] = useState(null);

  // server-side state
  const [serverData, setServerData] = useState([]);
  const [total, setTotal] = useState((data && data.length) || 0);
  const [loading, setLoading] = useState(false);

  // debounce timer for query
  useEffect(() => {
    if (!serverSide) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!onFetch) {
        console.warn("TableStructure: serverSide=true but no onFetch provided. Falling back to client-side behavior.");
        return;
      }
      setLoading(true);
      try {
        const res = await onFetch({ page, pageSize, query });
        if (cancelled) return;
        setServerData(Array.isArray(res.data) ? res.data : []);
        setTotal(typeof res.total === "number" ? res.total : 0);
      } catch (err) {
        console.error("Error fetching server-side data for TableStructure:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [serverSide, onFetch, page, pageSize, query]);

  const filteredData = useMemo(() => {
    if (serverSide) return data || [];
    if (!query) return data || [];
    const q = query.toString().toLowerCase();
    return (data || []).filter((row) => {
      return columns.some((col) => {
        const val = row[col.accessor];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, query, columns, serverSide]);

  const totalCount = serverSide ? total : filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  const paginatedData = serverSide
    ? serverData
    : filteredData.slice(startIndex, endIndex);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const { isDarkMode } = useTheme();

  const tableBg = isDarkMode ? "bg-black" : "bg-white";
  const tdText = isDarkMode ? "text-white" : "text-black";
  const rowHover = isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100";
  const borderClass = isDarkMode ? "border-white/20" : "border-gray-200";
  const inputClass = isDarkMode
    ? "pl-10 pr-4 py-2 w-full rounded border border-yellow-400 text-white placeholder-gray-400 px-3 py-2 rounded-md text-sm"
    : "pl-10 pr-4 py-2 w-full rounded border border-yellow-400 text-black placeholder-gray-500 px-3 py-2 rounded-md text-sm";
  const selectClass = isDarkMode
    ? "bg-gray-800 text-white px-2 py-1 rounded-md"
    : "bg-gray-100 text-black px-2 py-1 rounded-md";
  const pageTextClass = isDarkMode ? "text-white" : "text-black";

  return (
    <div className="w-full overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 ">
          {topActions && <div className="mr-2">{topActions}</div>}
          <span className="flex items-center relative min-w-80"><Search className="text-yellow-600 absolute left-1" size={18} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className={inputClass}
          /></span>
        </div>

        <div className="flex items-center gap-2">&nbsp;</div>
      </div>

      <div className="w-full lg:w-[calc(100vw-20vw)] overflow-x-auto overflow-y-auto rounded-lg">
        <table className={`w-full text-left text-sm md:text-base ${tableBg}`}>
          <thead>
            <tr className="border-b-2 border-yellow-400">
              {columns.map((col) => (
                <th key={col.accessor} className="p-3 text-yellow-400 font-semibold">
                  {col.Header}
                </th>
              ))}
              {actionsColumn && (
                <th className="p-3 text-yellow-400 font-semibold">Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center text-yellow-400" colSpan={columns.length + (actionsColumn ? 1 : 0)}>
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <React.Fragment key={row.id || startIndex + rowIndex}>
                  <tr
                    className={`border-b ${borderClass} ${rowHover} transition cursor-pointer`}
                    onClick={() => {
                      if (renderRowSubComponent) {
                        setExpandedRow(expandedRow === (row.id || startIndex + rowIndex) ? null : (row.id || startIndex + rowIndex));
                      }
                      if (onRowClick) onRowClick(row);
                    }}
                  >
                    {columns.map((col) => {
                      const cellValue = row[col.accessor];
                      return (
                        <td key={col.accessor} className={`p-3 ${tdText}`}>
                          {col.Cell ? col.Cell(cellValue, row) : cellValue}
                        </td>
                      );
                    })}
                    {actionsColumn && (
                      <td className="p-3">{actionsColumn(row)}</td>
                    )}
                  </tr>
                  {renderRowSubComponent && expandedRow === (row.id || startIndex + rowIndex) && renderRowSubComponent(row, startIndex + rowIndex)}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  className="p-4 text-center text-yellow-400"
                  colSpan={columns.length + (actionsColumn ? 1 : 0)}
                >
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`mt-3 flex items-center justify-between text-sm ${pageTextClass}`}>
        <div>
          Showing {totalCount === 0 ? 0 : startIndex + 1} to {endIndex} of {totalCount}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className={`px-3 py-1 rounded-md ${page <= 1 ? "opacity-50 cursor-not-allowed" : "bg-yellow-400 text-black"}`}
            >
              Prev
            </button>

            <div className="px-2">Page</div>

            <select
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className={selectClass}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className={`px-3 py-1 rounded-md ${page >= totalPages ? "opacity-50 cursor-not-allowed" : "bg-yellow-400 text-black"}`}
            >
              Next
            </button>
          </div>

            <div className="flex items-center gap-2">
            <label className="text-sm text-yellow-400">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className={selectClass + " text-sm"}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableStructure;