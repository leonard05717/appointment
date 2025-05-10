import {
  ActionIcon,
  ActionIconGroup,
  Checkbox,
  LoadingOverlay,
  Pagination,
  ScrollAreaAutosize,
  Table,
  Tooltip
} from '@mantine/core';
import {
  IconChevronRight,
  IconEdit,
  IconSortDescending,
  IconTrash
} from '@tabler/icons-react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { chunk } from '../helpers/methods';
import { useDidUpdate } from '@mantine/hooks';

export interface ColumnProps<T> {
  label: string;
  width?: number | string;
  field: keyof T | string;
  sortable?: boolean;
  format?: (result: T) => ReactNode;
  emptyText?: ReactNode;
  nowrap?: boolean;
  truncated?: boolean;
  hidden?: boolean;
  checked?: boolean;
  searchExact?: boolean;
}

interface CustomTableProps {
  columns: ColumnProps<any>[];
  rows: any[] | null;
  loading?: boolean;
  withNumbering?: boolean;
  onDelete?: (data: any) => void;
  onEdit?: (data: any) => void;
  onOthers?: (data: any) => void;
  onRowSelect?: (data: any) => void;
  othersButtonLabel?: string;
  search?: string | null | string[];
  error?: boolean;
  errorText?: string;
  fullHeight?: boolean;
  fullHeightSize?: string | number;
  width?: string;
  height?: string | number;
  rowSize?: number;
  checkable?: boolean;
  setTemporaryRowsData?: any;
}

function CustomTable({
  columns,
  rows: _rows,
  loading,
  withNumbering,
  onDelete,
  onEdit,
  onOthers,
  onRowSelect,
  othersButtonLabel = 'Others',
  search,
  error,
  checkable,
  width = 'auto',
  height = 'auto',
  errorText = 'Something Error, Please try again later.',
  fullHeight = false,
  fullHeightSize = '72vh',
  rowSize = 50,
  setTemporaryRowsData
}: CustomTableProps) {
  const [activePage, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null
  );

  const [rows, setRows] = useState<any[]>(_rows ? _rows : []);

  const [sortField, setSortField] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  function filterSearch(searchText: string | null | string[], rows: any[]) {
    if (!searchText) return [];

    const searchableColumns = columns.filter(
      column => !column.hidden || column.hidden
    );

    const searchValidator = (data: string, search: string, exact?: boolean) => {
      const d = data.toLowerCase();
      const s = search.toLowerCase();
      const len = s.length;
      return exact ? d.substring(0, len) == s : d.includes(s);
    };

    if (typeof searchText === 'string') {
      return rows.filter(row => {
        if (searchText === 'all') return true;
        return searchableColumns.some(column => {
          const cell = column.format
            ? String(column.format(row))
            : String(row[column.field]);
          return searchValidator(cell, searchText, column.searchExact);
        });
      });
    }

    if (Array.isArray(searchText)) {
      return rows.filter(row => {
        return searchText.every(searchTerm => {
          if (searchTerm === 'all') return true;
          return searchableColumns.some(column => {
            const cellData = column.format
              ? String(column.format(row))
              : String(row[column.field]);
            return searchValidator(cellData, searchTerm, column.searchExact);
          });
        });
      });
    }

    return rows;
  }

  const filteredRows = search ? filterSearch(search, rows) : rows;

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortField) return 0;
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    const newSortDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newSortDirection);
    setSortField(field);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredRows.length || !onRowSelect) return;

      if (e.key === 'ArrowDown') {
        if (selectedIndex === null) {
          // If no row is selected, select the first row from the filtered data
          setSelectedIndex(0);
          setSelectedId(filteredRows[0].id);
          onRowSelect(filteredRows[0]);
        } else {
          // Otherwise, move to the next row in the filtered data
          const newIndex = Math.min(selectedIndex + 1, filteredRows.length - 1);
          setSelectedIndex(newIndex);
          setSelectedId(filteredRows[newIndex].id);
          onRowSelect(filteredRows[newIndex]);
        }
      }

      if (e.key === 'ArrowUp') {
        if (selectedIndex === null) {
          // If no row is selected, select the last row from the filtered data
          setSelectedIndex(filteredRows.length - 1);
          setSelectedId(filteredRows[filteredRows.length - 1].id);
          onRowSelect(filteredRows[filteredRows.length - 1]);
        } else {
          // Otherwise, move to the previous row in the filtered data
          const newIndex = Math.max(selectedIndex - 1, 0);
          setSelectedIndex(newIndex);
          setSelectedId(filteredRows[newIndex].id);
          onRowSelect(filteredRows[newIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredRows, selectedIndex, onRowSelect]);

  useEffect(() => {
    if (_rows) {
      let newRows = _rows;

      if (
        newRows.length > 0 &&
        !Object.getOwnPropertyNames(newRows[0]).includes('id')
      ) {
        newRows = newRows.map((r, i) => ({ ...r, id: i + 1 }));
      }

      if (checkable) {
        newRows = newRows.map(r => ({ ...r, checked: false }));
      }

      setRows(newRows);
    }
  }, [_rows]);

  useDidUpdate(() => {
    if (setTemporaryRowsData) {
      setTemporaryRowsData(rows);
    }
  }, [rows, setTemporaryRowsData]);

  const data = chunk(sortedRows, rowSize);
  const currentData = (data[activePage - 1] || []).map((row, i) => {
    if (row.id) return row;
    return {
      ...row,
      id: i + 1 + (activePage - 1) * rowSize
    };
  });

  return (
    <div
      tabIndex={-1}
      ref={tableRef}
      style={{ width: width, height: height, outline: 'none' }}
      className={`relative w-full h-full ${rows.length > rowSize ? 'pb-[3rem]' : ''
        }`}
    >
      <LoadingOverlay
        loaderProps={{
          type: 'bars'
        }}
        zIndex={10}
        visible={loading}
      />
      <ScrollAreaAutosize h={fullHeight ? fullHeightSize : '100%'}>
        <Table
          className="w-full"
          stickyHeader
          highlightOnHover
          highlightOnHoverColor="#ddd"
          withColumnBorders
        >
          <Table.Thead
            style={{
              borderBottom: '2px solid #0002'
            }}
          >
            <Table.Tr>
              {checkable && (
                <Table.Th className="px-3 py-2 w-12" w={10}>
                  <Checkbox
                    color="blue"
                    checked={rows.every(d => d.checked)}
                    onChange={e => {
                      setRows(curr =>
                        curr.map(row => ({
                          ...row,
                          checked: e.target.checked
                        }))
                      );
                    }}
                  />
                </Table.Th>
              )}
              {withNumbering && (
                <Table.Th className="px-3 py-2 w-12">#</Table.Th>
              )}
              {columns
                .filter(column => !column.hidden)
                .map((column, index) => (
                  <Table.Th
                    w={column.width || 'auto'}
                    maw={column.width || 'auto'}
                    className="px-3 py-2"
                    key={index}
                  >
                    <div className="flex items-center gap-x-2 text-nowrap">
                      {column.label}
                      {column.sortable && (
                        <ActionIcon
                          onClick={() => handleSort(column.field as string)}
                          variant="subtle"
                          color="gray"
                        >
                          <IconSortDescending
                            size={20}
                            style={{
                              transform:
                                sortField === column.field
                                  ? sortDirection === 'asc'
                                    ? 'none'
                                    : 'rotate(180deg)'
                                  : 'none',
                              opacity: sortField === column.field ? 1 : 0.5
                            }}
                          />
                        </ActionIcon>
                      )}
                    </div>
                  </Table.Th>
                ))}
              {(onDelete || onEdit || onOthers) && (
                <Table.Th w={50}>Actions</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {currentData.map((row, _i) => (
              <Table.Tr
                key={row.id}
                className={
                  onRowSelect || checkable
                    ? `cursor-pointer select-none active:bg-slate-300`
                    : ''
                }
                style={
                  onRowSelect
                    ? {
                      cursor: 'pointer',
                      userSelect: 'none',
                      backgroundColor:
                        row.id === selectedId ? '#bbb' : 'inherit'
                    }
                    : {}
                }
                onClick={e => {
                  if (onRowSelect) {
                    setSelectedIndex(_i);
                    setSelectedId(row.id);
                    onRowSelect(row);
                  }
                  if (checkable) {
                    const lastCell = e.currentTarget.lastElementChild;
                    const firstCell = e.currentTarget.firstElementChild;

                    if (
                      lastCell?.contains(e.target as Node) ||
                      firstCell?.contains(e.target as Node)
                    )
                      return;

                    setRows(curr =>
                      curr.map(d => {
                        if (d.id === row.id)
                          return {
                            ...d,
                            checked: !d.checked
                          };
                        return d;
                      })
                    );
                  }
                }}
              >
                {checkable && (
                  <Table.Td className="border-l border-l-slate-200">
                    <Checkbox
                      color="blue"
                      checked={row.checked}
                      onChange={() => {
                        setRows(curr =>
                          curr.map(d => {
                            if (d.id === row.id)
                              return {
                                ...d,
                                checked: !d.checked
                              };
                            return d;
                          })
                        );
                      }}
                    />
                  </Table.Td>
                )}
                {withNumbering && (
                  <Table.Td>{_i + 1 + (activePage - 1) * rowSize}</Table.Td>
                )}
                {columns
                  .filter(column => !column.hidden)
                  .map((column, index) => {
                    const text = row[column.field]
                      ? column.format
                        ? column.format(row)
                        : row[column.field]
                      : column.emptyText
                        ? column.emptyText
                        : 'None';

                    return (
                      <Table.Td
                        key={index}
                        title={text}
                        maw={column.truncated ? column.width : ''}
                        className={column.truncated ? 'truncate' : ''}
                        style={{
                          textWrap: column.nowrap ? 'nowrap' : 'wrap'
                        }}
                      >
                        {text}
                      </Table.Td>
                    );
                  })}
                {(onDelete || onEdit || onOthers) && (
                  <Table.Td className="px-3 py-2 ">
                    <ActionIconGroup>
                      {onEdit && (
                        <ActionIcon
                          onClick={() => onEdit(row)}
                          color="blue"
                          variant="outline"
                        >
                          <IconEdit size={15} />
                        </ActionIcon>
                      )}
                      {onDelete && (
                        <ActionIcon
                          onClick={() => onDelete(row)}
                          color="red"
                          variant="outline"
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      )}
                      {onOthers && (
                        <Tooltip
                          fz={12}
                          color="white"
                          c="dark"
                          style={{
                            boxShadow: '2px 3px 5px #0005',
                            border: '1px solid #0005'
                          }}
                          withArrow
                          position="top"
                          label={othersButtonLabel}
                        >
                          <ActionIcon
                            variant="outline"
                            onClick={() => onOthers(row)}
                          >
                            <IconChevronRight size={15} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </ActionIconGroup>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {rows.length === 0 && !error && (
          <div className="text-center pt-5">
            {loading ? 'Loading...' : 'No Record Found'}
          </div>
        )}
        {filteredRows.length === 0 && rows.length > 0 && search && (
          <div className="text-center pt-5">No Record Found</div>
        )}
        {error && errorText && (
          <div className="text-center pt-5 text-red-500">{errorText}</div>
        )}
      </ScrollAreaAutosize>
      {rows.length > rowSize && filteredRows.length > 0 && (
        <div className="w-full px-2 h-12 bg-dark absolute bottom-0 left-0 flex justify-end items-center">
          <Pagination
            styles={{
              dots: {
                color: 'white'
              }
            }}
            total={data.length}
            value={activePage}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

export default CustomTable;
