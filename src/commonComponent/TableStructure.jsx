import React from "react";

const TableStructure = ({
  columns = [],
  data = [],
  renderRowSubComponent,
  actionsColumn,
  onRowClick,
}) => {

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="min-w-full text-left text-sm md:text-base bg-black">
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
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <React.Fragment key={row.id || rowIndex}>
                <tr
                  className="border-b border-white/20 hover:bg-white/5 transition cursor-pointer"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => {
                    const cellValue = row[col.accessor];
                    return (
                      <td key={col.accessor} className="p-3 text-white">
                        {col.Cell ? col.Cell(cellValue, row) : cellValue}
                      </td>
                    );
                  })}
                  {actionsColumn && (
                    <td className="p-3">
                      {actionsColumn(row)}
                    </td>
                  )}
                </tr>
                {renderRowSubComponent && renderRowSubComponent(row, rowIndex)}
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
  );
};

export default TableStructure;
