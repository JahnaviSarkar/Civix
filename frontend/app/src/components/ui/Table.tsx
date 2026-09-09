import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = "No data available" }: TableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-[#31465A] text-sm bg-white rounded-xl border border-[#D9F0FF]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-[#D9F0FF] shadow-xs">
      <table className="w-full text-left text-sm text-[#31465A]">
        <thead className="bg-[#D9F0FF] text-[#31465A] uppercase text-xs font-bold tracking-wider border-b border-[#89B9E6]">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9F0FF]">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-[#FFFDF7] transition-colors">
              {columns.map((col, idx) => (
                <td key={idx} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                  {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
