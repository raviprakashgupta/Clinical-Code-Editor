import React, { useState, useMemo } from 'react';

interface DataTableProps {
  data: any[];
}

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
} | null;

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const headers = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);
  
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  if (data.length === 0) {
    return <div className="p-4 text-center text-slate-500">No data to display.</div>;
  }

  return (
    <div className="p-4 animate-fade-in bg-slate-50 h-full">
      <div className="overflow-x-auto rounded-lg border border-slate-300">
        <table className="min-w-full divide-y divide-slate-300">
          <thead className="bg-slate-200">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort(header)}
                >
                  {header}
                  {sortConfig?.key === header && (
                    <span className="ml-1">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-100/50">
                {headers.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-slate-600">
            Page {currentPage} of {totalPages} ({sortedData.length} total rows)
        </span>
        <div className="space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 rounded text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
            </button>
        </div>
      </div>
    </div>
  );
};