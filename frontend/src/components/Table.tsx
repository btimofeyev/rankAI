import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, Search, Filter } from './icons.tsx';
import classNames from 'classnames';
import Button from './Button.tsx';
import Popover from './Popover.tsx';

type SortDirection = 'asc' | 'desc' | null;

type Column<T = any> = {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
};

type FilterValue = {
  value: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
};

type TableProps<T = any> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: {
    title?: string;
    description?: string;
    icon?: string;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
  };
  selection?: {
    selectedRows: T[];
    onSelectionChange: (selectedRows: T[]) => void;
    getRowId: (row: T) => string;
  };
  actions?: {
    label: string;
    onClick: (row: T) => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'ghost' | 'danger';
  }[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  hoverable?: boolean;
};

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  empty = {},
  pagination,
  selection,
  actions = [],
  className,
  size = 'md',
  striped = true,
  hoverable = true
}: TableProps<T>) => {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sort]);

  // Apply filters
  const filteredData = useMemo(() => {
    return sortedData.filter(row => {
      // Global filter
      if (globalFilter) {
        const searchValue = globalFilter.toLowerCase();
        const matchesGlobal = Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchValue)
        );
        if (!matchesGlobal) return false;
      }

      // Column filters
      return Object.entries(filters).every(([key, filter]) => {
        const value = String(row[key] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case 'contains':
            return value.includes(filterValue);
          case 'equals':
            return value === filterValue;
          case 'startsWith':
            return value.startsWith(filterValue);
          case 'endsWith':
            return value.endsWith(filterValue);
          default:
            return true;
        }
      });
    });
  }, [sortedData, filters, globalFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;

    const startIndex = (pagination.currentPage - 1) * (pagination.pageSize || 10);
    const endIndex = startIndex + (pagination.pageSize || 10);
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: null };
    });
  };

  const handleFilter = (key: string, value: FilterValue) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    if (checked) {
      selection.onSelectionChange(paginatedData);
    } else {
      selection.onSelectionChange([]);
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    if (!selection) return;
    const rowId = selection.getRowId(row);
    const isSelected = selection.selectedRows.some(r => selection.getRowId(r) === rowId);

    if (checked && !isSelected) {
      selection.onSelectionChange([...selection.selectedRows, row]);
    } else if (!checked && isSelected) {
      selection.onSelectionChange(selection.selectedRows.filter(r => selection.getRowId(r) !== rowId));
    }
  };

  const isRowSelected = (row: T) => {
    if (!selection) return false;
    const rowId = selection.getRowId(row);
    return selection.selectedRows.some(r => selection.getRowId(r) === rowId);
  };

  const isAllSelected = selection && paginatedData.length > 0 && paginatedData.every(isRowSelected);
  const isSomeSelected = selection && paginatedData.some(isRowSelected);

  const renderCellValue = (column: Column<T>, row: T) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value;
  };

  const emptyState = {
    title: empty.title || 'No data available',
    description: empty.description || 'Try adjusting your filters or add some data to see results.',
    icon: empty.icon || '📊'
  };

  if (loading) {
    return (
      <div className={classNames('table-container', className)}>
        <div className="table__loading">
          <div className="table__loading-spinner" />
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('table-container', className)}>
      {/* Table Header with Search and Filters */}
      <div className="table__header">
        <div className="table__search">
          <Search size={16} className="table__search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="table__search-input"
          />
        </div>

        <div className="table__actions">
          {Object.entries(filters).map(([key, filter]) => (
            <div key={key} className="table__filter-tag">
              <span>{columns.find(c => c.key === key)?.title}: {filter.value}</span>
              <button
                type="button"
                onClick={() => clearFilter(key)}
                className="table__filter-clear"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table__wrapper">
        <table className={classNames('table', `table--${size}`, { 'table--striped': striped, 'table--hoverable': hoverable })}>
          <thead>
            <tr>
              {selection && (
                <th className="table__cell table__cell--header table__cell--selection">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el && isSomeSelected && !isAllSelected) {
                        el.indeterminate = true;
                      }
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="table__checkbox"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={classNames('table__cell table__cell--header', {
                    'table__cell--sortable': column.sortable,
                    'table__cell--sorted': sort.key === column.key,
                    [`table__cell--${column.align}`]: column.align
                  })}
                  style={{ width: column.width }}
                >
                  <div className="table__header-content">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <button
                        type="button"
                        className="table__sort-button"
                        onClick={() => handleSort(column.key)}
                      >
                        <ChevronUp
                          size={14}
                          className={classNames('table__sort-icon', {
                            'table__sort-icon--active': sort.key === column.key && sort.direction === 'asc'
                          })}
                        />
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {actions.length > 0 && (
                <th className="table__cell table__cell--header table__cell--actions">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="table__cell">
                  <div className="table__empty">
                    <div className="table__empty-icon">{emptyState.icon}</div>
                    <h4 className="table__empty-title">{emptyState.title}</h4>
                    <p className="table__empty-description">{emptyState.description}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className={classNames({ 'table__row--selected': isRowSelected(row) })}>
                  {selection && (
                    <td className="table__cell table__cell--selection">
                      <input
                        type="checkbox"
                        checked={isRowSelected(row)}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        className="table__checkbox"
                      />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={classNames('table__cell', {
                        [`table__cell--${column.align}`]: column.align
                      })}
                    >
                      {renderCellValue(column, row)}
                    </td>
                  ))}

                  {actions.length > 0 && (
                    <td className="table__cell table__cell--actions">
                      <Popover
                        trigger={
                          <button type="button" className="table__action-button">
                            <MoreHorizontal size={16} />
                          </button>
                        }
                        placement="bottom"
                        content={
                          <div className="table__action-menu">
                            {actions.map((action, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => action.onClick(row)}
                                className={classNames('table__action-menu-item', `table__action-menu-item--${action.variant || 'ghost'}`)}
                              >
                                {action.icon && <span className="table__action-icon">{action.icon}</span>}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        }
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="table__pagination">
          <div className="table__pagination-info">
            Showing {paginatedData.length} of {filteredData.length} results
            {filteredData.length !== data.length && ` (from ${data.length} total)`}
          </div>

          <div className="table__pagination-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              Previous
            </Button>

            <div className="table__pagination-pages">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={classNames('table__pagination-page', {
                      'table__pagination-page--active': pageNum === pagination.currentPage
                    })}
                    onClick={() => pagination.onPageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;