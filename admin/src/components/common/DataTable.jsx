import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  loading,
  searchable = true,
  pageSize = 10,
  emptyMessage = 'No data found',
  emptyIcon = '📭',
  toolbar,
  // Server-side pagination props
  serverSide = false,
  total = 0,
  page: externalPage = 1,
  onPageChange,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (key === 'actions') return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (serverSide) return data;
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const v = row[col.key];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns, serverSide]);

  const sorted = useMemo(() => {
    if (serverSide || !sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, serverSide]);

  const totalRecords = serverSide ? total : sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = serverSide ? externalPage : page;
  const safePages = Math.min(currentPage, totalPages);
  const paged = serverSide ? data : sorted.slice((safePages - 1) * pageSize, safePages * pageSize);

  const handlePageChange = (newPage) => {
    if (serverSide) {
      onPageChange && onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="table-skeleton-row">
                {columns.map(col => (
                  <td key={col.key}>
                    <div className="table-skeleton-cell" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      {(searchable || toolbar) && (
        <div className="data-table-toolbar">
          {searchable && (
            <div className="data-table-search">
              <Search size={15} className="data-table-search-icon" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          )}
          {toolbar && <div className="data-table-filters">{toolbar}</div>}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={sortKey === col.key ? 'sorted' : ''}
                onClick={() => handleSort(col.key)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {col.label}
                  {sortKey === col.key && (
                    sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="data-table-empty">
                  <div className="data-table-empty-icon">{emptyIcon}</div>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            paged.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalRecords > pageSize && (
        <div className="data-table-footer">
          <span>
            Showing {(safePages - 1) * pageSize + 1}–{Math.min(safePages * pageSize, totalRecords)} of {totalRecords}
          </span>
          <div className="data-table-pagination">
            <button disabled={safePages <= 1} onClick={() => handlePageChange(safePages - 1)}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  className={safePages === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button disabled={safePages >= totalPages} onClick={() => handlePageChange(safePages + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
