import React from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table
        ref={ref}
        className={clsx('w-full divide-y divide-slate-200', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);

Table.displayName = 'Table';

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHead = React.forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={clsx('bg-slate-50', className)} {...props}>
      {children}
    </thead>
  )
);

TableHead.displayName = 'TableHead';

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody
      ref={ref}
      className={clsx('divide-y divide-slate-200 bg-white', className)}
      {...props}
    >
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={clsx(
        clickable && 'cursor-pointer hover:bg-slate-50 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);

TableRow.displayName = 'TableRow';

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHeader = React.forwardRef<HTMLTableCellElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

TableHeader.displayName = 'TableHeader';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx('px-4 py-3 text-sm text-slate-900', className)}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 20,
}) => {
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems || 0);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
      <div className="text-sm text-slate-500">
        {totalItems ? (
          <span>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </span>
        ) : (
          <span>No results</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, Pagination };
