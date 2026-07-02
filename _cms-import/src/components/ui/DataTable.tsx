'use client';

import React from 'react';
import { Skeleton, Table, Text } from '@vapor-ui/core';
import { ChevronDownOutlineIcon, ChevronUpOutlineIcon } from '@vapor-ui/icons';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Tailwind width utility class, e.g. 'w-32' | 'w-[120px]' | 'w-[30%]'. */
  width?: string;
  /** Renders a clickable sortable header for this column. */
  sortable?: boolean;
  /** Prevents wrapping in the header + cells (use for Badge / short status cells). */
  nowrap?: boolean;
  /** Clamps cell content to a single line with ellipsis (Korean wraps at word boundaries). */
  truncate?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Key of the currently sorted column. */
  sortKey?: string;
  /** Direction of the current sort. */
  sortDir?: 'asc' | 'desc';
  /** Called with the column key when a sortable header is clicked. */
  onSortChange?: (key: string) => void;
}

const SKELETON_ROWS = 5;

const ALIGN_CLASS = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

const JUSTIFY_CLASS = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
} as const;

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function SortIcon({ state }: { state: 'asc' | 'desc' | false }) {
  if (state === 'asc') return <ChevronUpOutlineIcon size={14} className="text-gray-700" />;
  if (state === 'desc') return <ChevronDownOutlineIcon size={14} className="text-gray-700" />;
  return <ChevronDownOutlineIcon size={14} className="text-gray-300" />;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty = '데이터가 없습니다.',
  onRowClick,
  sortKey,
  sortDir,
  onSortChange,
}: DataTableProps<T>) {
  const align = (a?: DataTableColumn<T>['align']) => ALIGN_CLASS[a ?? 'left'];
  const justify = (a?: DataTableColumn<T>['align']) => JUSTIFY_CLASS[a ?? 'left'];
  const hasWidths = columns.some((col) => col.width);

  return (
    <div className="w-full overflow-x-auto">
    <Table.Root className="w-full min-w-[48rem]">
      {hasWidths ? (
        <Table.ColumnGroup>
          {columns.map((col) => (
            <Table.Column key={col.key} className={col.width || undefined} />
          ))}
        </Table.ColumnGroup>
      ) : null}
      <Table.Header>
        <Table.Row>
          {columns.map((col) => {
            const state = sortKey === col.key ? sortDir ?? false : false;
            return (
              <Table.Heading
                key={col.key}
                className={cx('bg-gray-50 whitespace-nowrap break-keep', align(col.align))}
              >
                {col.sortable && onSortChange ? (
                  <button
                    type="button"
                    onClick={() => onSortChange(col.key)}
                    aria-label={`${col.header} 정렬`}
                    className={cx(
                      'inline-flex w-full items-center gap-1 hover:text-gray-700',
                      justify(col.align),
                    )}
                  >
                    <span>{col.header}</span>
                    <SortIcon state={state} />
                  </button>
                ) : (
                  col.header
                )}
              </Table.Heading>
            );
          })}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {loading ? (
          Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
            <Table.Row key={`skeleton-${rowIndex}`}>
              {columns.map((col) => (
                <Table.Cell
                  key={col.key}
                  className={cx(align(col.align), col.nowrap && 'whitespace-nowrap')}
                >
                  <Skeleton className="h-4 w-3/4 rounded" />
                </Table.Cell>
              ))}
            </Table.Row>
          ))
        ) : rows.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={columns.length} className="py-10 text-center">
              {typeof empty === 'string' ? (
                <Text typography="body2" className="text-gray-400">
                  {empty}
                </Text>
              ) : (
                empty
              )}
            </Table.Cell>
          </Table.Row>
        ) : (
          rows.map((row) => (
            <Table.Row
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : undefined}
            >
              {columns.map((col) => {
                const content = col.render
                  ? col.render(row)
                  : (row as unknown as Record<string, React.ReactNode>)[col.key];
                return (
                  <Table.Cell
                    key={col.key}
                    className={cx(align(col.align), 'break-keep', col.nowrap && 'whitespace-nowrap')}
                  >
                    {col.truncate ? <div className="line-clamp-1 break-keep">{content}</div> : content}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table.Root>
    </div>
  );
}
