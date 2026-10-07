import React from 'react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left border-collapse text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '' }) => {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>{children}</tbody>;
};

export const TableRow = ({ children, className = '', hover = true, onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`${hover ? 'hover:bg-slate-50/80 transition-colors' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHeaderCell = ({ children, className = '' }) => {
  return <th scope="col" className={`py-3.5 px-4 sm:px-6 ${className}`}>{children}</th>;
};

export const TableCell = ({ children, className = '' }) => {
  return <td className={`py-4 px-4 sm:px-6 text-slate-700 align-middle ${className}`}>{children}</td>;
};

export default Table;
