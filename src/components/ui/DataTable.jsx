import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { LoadingCard } from './loading-states';
import { EmptyState } from './loading-states';

// Table components
const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      role="table"
      {...props}
    />
  </div>
));

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-gray-900/5 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
));

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50',
      className
    )}
    {...props}
  />
));

const TableHead = React.forwardRef(({ className, sortable, sorted, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0',
      sortable && 'cursor-pointer select-none hover:text-gray-900',
      className
    )}
    onClick={sortable && onSort ? onSort : undefined}
    role="columnheader"
    aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : 'none'}
    {...props}
  >
    <div className="flex items-center space-x-2">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp
            className={cn(
              'h-3 w-3',
              sorted === 'asc' ? 'text-purple-600' : 'text-gray-400'
            )}
          />
          <ChevronDown
            className={cn(
              'h-3 w-3 -mt-1',
              sorted === 'desc' ? 'text-purple-600' : 'text-gray-400'
            )}
          />
        </div>
      )}
    </div>
  </th>
));

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));

// Main DataTable component
const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination = true,
  sorting = true,
  filtering = true,
  selection = false,
  actions = [],
  emptyMessage = 'No data available',
  pageSize = 10,
  className,
  onRowClick,
  onSelectionChange,
  searchable = true,
  exportable = false,
  onExport,
  ...props
}) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  );

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return String(value || '').toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter(row => {
          const column = columns.find(col => col.key === key);
          const value = column?.accessor ? column.accessor(row) : row[key];

          if (column?.filterType === 'select') {
            return value === filterValue;
          } else {
            return String(value || '').toLowerCase().includes(filterValue.toLowerCase());
          }
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const column = columns.find(col => col.key === sortConfig.key);
        const aVal = column?.accessor ? column.accessor(a) : a[sortConfig.key];
        const bVal = column?.accessor ? column.accessor(b) : b[sortConfig.key];

        if (column?.sortType === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        } else if (column?.sortType === 'date') {
          const aDate = new Date(aVal);
          const bDate = new Date(bVal);
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        } else {
          const aStr = String(aVal || '').toLowerCase();
          const bStr = String(bVal || '').toLowerCase();
          if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }

    return result;
  }, [data, searchQuery, columnFilters, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSizeState);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSizeState;
    return filteredAndSortedData.slice(start, start + pageSizeState);
  }, [filteredAndSortedData, currentPage, pageSizeState]);

  // Event handlers
  const handleSort = useCallback((columnKey) => {
    if (!sorting) return;

    setSortConfig(prev => ({
      key: columnKey,
      direction: prev?.key === columnKey && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, [sorting]);

  const handleSelectRow = useCallback((rowId, checked) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  }, [selectedRows, onSelectionChange]);

  const handleSelectAll = useCallback((checked) => {
    const newSelection = checked
      ? new Set(paginatedData.map(row => row.id || row.key))
      : new Set();
    setSelectedRows(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  }, [paginatedData, onSelectionChange]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setColumnFilters({});
    setSortConfig(null);
    setCurrentPage(1);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: pageSizeState }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-red-600 mb-2">Error loading data</div>
        <div className="text-sm text-gray-600">{error}</div>
      </div>
    );
  }

  const visibleColumnsList = columns.filter(col => visibleColumns[col.key]);

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          {filtering && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Open filter modal */}}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}

          {(searchQuery || Object.keys(columnFilters).length > 0 || sortConfig) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {/* Column visibility toggle */}
          <Select
            value=""
            onValueChange={(columnKey) => {
              setVisibleColumns(prev => ({
                ...prev,
                [columnKey]: !prev[columnKey]
              }));
            }}
          >
            <SelectTrigger className="w-auto">
              <EyeOff className="h-4 w-4 mr-2" />
              Columns
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col.key} value={col.key}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleColumns[col.key]}
                      onChange={() => {}}
                    />
                    <span>{col.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedData.length > 0 && paginatedData.every(row =>
                      selectedRows.has(row.id || row.key)
                    )}
                    indeterminate={
                      paginatedData.some(row => selectedRows.has(row.id || row.key)) &&
                      !paginatedData.every(row => selectedRows.has(row.id || row.key))
                    }
                    onChange={(checked) => handleSelectAll(checked)}
                  />
                </TableHead>
              )}
              {visibleColumnsList.map((column) => (
                <TableHead
                  key={column.key}
                  sortable={column.sortable && sorting}
                  sorted={sortConfig?.key === column.key ? sortConfig.direction : null}
                  onSort={() => handleSort(column.key)}
                  className={cn(column.headerClassName)}
                >
                  {column.title}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-12">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsList.length + (selection ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <EmptyState
                    title="No data found"
                    description={emptyMessage}
                    className="py-8"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const rowKey = row.id || row.key || index;
                const isSelected = selectedRows.has(rowKey);

                return (
                  <TableRow
                    key={rowKey}
                    className={cn(
                      isSelected && 'bg-purple-50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                    data-state={isSelected ? 'selected' : undefined}
                  >
                    {selection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => handleSelectRow(rowKey, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}

                    {visibleColumnsList.map((column) => {
                      const value = column.accessor ? column.accessor(row) : row[column.key];
                      const cellContent = column.render ? column.render(value, row) : value;

                      return (
                        <TableCell
                          key={column.key}
                          className={cn(column.cellClassName)}
                        >
                          {cellContent}
                        </TableCell>
                      );
                    })}

                    {actions.length > 0 && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              disabled={action.disabled?.(row)}
                            >
                              {action.icon && <action.icon className="h-4 w-4" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && filteredAndSortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSizeState) + 1} to{' '}
              {Math.min(currentPage * pageSizeState, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Select
              value={pageSizeState.toString()}
              onValueChange={(value) => {
                setPageSizeState(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection info */}
      {selection && selectedRows.size > 0 && (
        <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
          <span className="text-sm text-purple-700">
            {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedRows(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
};

export { DataTable, Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };