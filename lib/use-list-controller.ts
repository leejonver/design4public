'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface ListSort {
  key: string;
  dir: SortDir;
}

/**
 * Shape passed to `opts.fetch`. Active filters are spread in as top-level keys
 * alongside search / sort / dir / page / limit.
 */
export type ListFetchParams = {
  search: string;
  sort?: string;
  dir?: SortDir;
  page: number;
  limit: number;
} & Record<string, string | number | undefined>;

export interface ListResult<T> {
  items: T[];
  total: number;
}

export interface UseListControllerOptions<T> {
  fetch: (params: ListFetchParams) => Promise<ListResult<T>>;
  initialSearch?: string;
  initialFilters?: Record<string, string>;
  initialSort?: ListSort | null;
  limit?: number;
}

export interface UseListController<T> {
  items: T[];
  total: number;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  sort: ListSort | null;
  setSort: (sort: ListSort | null) => void;
  toggleSort: (key: string) => void;
  page: number;
  setPage: (page: number) => void;
  refetch: () => void;
}

const DEBOUNCE_MS = 300;

export function useListController<T>(options: UseListControllerOptions<T>): UseListController<T> {
  const { initialSearch = '', initialFilters = {}, initialSort = null, limit = 20 } = options;

  const [search, setSearchState] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [sort, setSortState] = useState<ListSort | null>(initialSort);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  // Keep the latest fetch fn without re-triggering the effect on identity changes.
  const fetchRef = useRef(options.fetch);
  fetchRef.current = options.fetch;

  // Debounce the search term before it drives a fetch.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch whenever the effective query changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params: ListFetchParams = {
      search: debouncedSearch,
      ...filters,
      sort: sort?.key,
      dir: sort?.dir,
      page,
      limit,
    };

    fetchRef
      .current(params)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, filters, sort, page, limit, refetchToken]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setSort = useCallback((next: ListSort | null) => {
    setSortState(next);
    setPage(1);
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
    setPage(1);
  }, []);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  return {
    items,
    total,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    toggleSort,
    page,
    setPage,
    refetch,
  };
}

export default useListController;
