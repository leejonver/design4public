'use client';

import type { ReactNode } from 'react';
import SearchInput from './SearchInput';

export interface ListToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  /** Filter controls (e.g. FilterSelect) rendered on the left after the search box. */
  filters?: ReactNode;
  /** Sort controls rendered on the left after the filters. */
  sort?: ReactNode;
}

export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  sort,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="max-w-sm flex-1">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          debounceMs={0}
        />
      </div>
      {filters}
      {sort}
    </div>
  );
}
