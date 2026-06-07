'use client';

import React from 'react';
import { Spinner, Table, Text } from '@vapor-ui/core';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}

const ALIGN_CLASS: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty = '데이터가 없습니다.',
  onRowClick,
}: DataTableProps<T>) {
  const alignClass = (align?: DataTableColumn<T>['align']) => (align ? ALIGN_CLASS[align] : ALIGN_CLASS.left);

  return (
    <Table.Root className="w-full">
      <Table.Header>
        <Table.Row>
          {columns.map((col) => (
            <Table.Heading key={col.key} className={alignClass(col.align)}>
              {col.header}
            </Table.Heading>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {loading ? (
          <Table.Row>
            <Table.Cell colSpan={columns.length} className="py-10 text-center">
              <Spinner size="md" />
            </Table.Cell>
          </Table.Row>
        ) : rows.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={columns.length} className="py-10 text-center">
              <Text typography="body2" className="text-gray-400">
                {empty}
              </Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          rows.map((row) => (
            <Table.Row
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : undefined}
            >
              {columns.map((col) => (
                <Table.Cell key={col.key} className={alignClass(col.align)}>
                  {col.render
                    ? col.render(row)
                    : (row as unknown as Record<string, React.ReactNode>)[col.key]}
                </Table.Cell>
              ))}
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}
