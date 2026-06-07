'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Callout, Spinner, TextInput } from '@vapor-ui/core';
import { SearchOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { Brand, Category, Item, Photo, Project, Tag } from '@/types';

interface SearchResults {
  projects: Project[];
  items: Item[];
  brands: Brand[];
  photos: Photo[];
  categories: Category[];
  tags: Tag[];
  total: number;
}

interface ResultRow {
  id: string;
  label: string;
  href: string;
}

interface IndexedRow extends ResultRow {
  index: number;
}

export interface GlobalSearchProps {
  placeholder?: string;
}

export default function GlobalSearch({ placeholder = '통합 검색' }: GlobalSearchProps) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  // Debounced search.
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setOpen(true);
    setActiveIndex(-1);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<SearchResults>('/search', { q: term });
        if (!active) return;
        if (res.success && res.data) {
          setResults(res.data);
          setError(null);
        } else {
          setResults(null);
          setError(res.error ?? '검색에 실패했습니다.');
        }
      } catch {
        if (active) {
          setResults(null);
          setError('검색에 실패했습니다.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Keep the active option scrolled into view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const groups = useMemo<{ key: string; label: string; rows: IndexedRow[] }[]>(() => {
    if (!results) return [];
    const raw: { key: string; label: string; rows: ResultRow[] }[] = [
      {
        key: 'projects',
        label: '프로젝트',
        rows: results.projects.map((p) => ({ id: p.id, label: p.name, href: `/projects/${p.id}` })),
      },
      {
        key: 'items',
        label: '아이템',
        rows: results.items.map((i) => ({ id: i.id, label: i.name, href: `/items/${i.id}` })),
      },
      {
        key: 'brands',
        label: '브랜드',
        rows: results.brands.map((b) => ({ id: b.id, label: b.nameKo || b.name, href: `/brands/${b.id}` })),
      },
      {
        key: 'photos',
        label: '사진',
        rows: results.photos.map((ph) => ({
          id: ph.id,
          label: ph.title || ph.altText || '제목 없음',
          href: `/photos/${ph.id}`,
        })),
      },
      {
        key: 'categories',
        label: '카테고리',
        rows: results.categories.map((c) => ({ id: c.id, label: c.name, href: '/categories' })),
      },
      {
        key: 'tags',
        label: '태그',
        // free tags have no detail page — shown as matches but not navigable
        rows: results.tags.map((t) => ({ id: t.id, label: t.name, href: '' })),
      },
    ];
    let cursor = 0;
    return raw
      .filter((g) => g.rows.length > 0)
      .map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r, index: cursor++ })) }));
  }, [results]);

  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);

  const close = () => {
    setQ('');
    setResults(null);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      if (flatRows.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % flatRows.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      if (flatRows.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatRows.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Enter') {
      const row = activeIndex >= 0 ? flatRows[activeIndex] : undefined;
      if (row && row.href) {
        e.preventDefault();
        router.push(row.href);
        close();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchOutlineIcon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
      />
      <TextInput
        type="search"
        value={q}
        onValueChange={setQ}
        placeholder={placeholder}
        className="w-full pl-9"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        aria-activedescendant={activeIndex >= 0 ? `gs-option-${activeIndex}` : undefined}
        onFocus={() => {
          if (q.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {open ? (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute z-50 mt-1 max-h-[420px] w-full overflow-y-auto rounded-md border border-gray-200 bg-white p-2 shadow-lg"
        >
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : error ? (
            <Callout.Root colorPalette="danger">{error}</Callout.Root>
          ) : !results || results.total === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">검색 결과가 없습니다.</p>
          ) : (
            groups.map((group) => (
              <div key={group.key} role="group" aria-label={group.label}>
                <p className="px-2 pb-1 pt-2 text-xs font-semibold text-gray-400">{group.label}</p>
                {group.rows.map((row) => {
                  const isActive = row.index === activeIndex;
                  const cls = `block truncate rounded-md px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v-primary ${
                    isActive ? 'bg-v-primary-100 text-v-primary' : 'text-gray-700 hover:bg-gray-50'
                  }`;
                  if (!row.href) {
                    return (
                      <div
                        key={`${group.key}-${row.id}`}
                        id={`gs-option-${row.index}`}
                        ref={isActive ? (el) => { activeRef.current = el } : undefined}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveIndex(row.index)}
                        className={`${cls} cursor-default`}
                      >
                        {row.label}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={`${group.key}-${row.id}`}
                      id={`gs-option-${row.index}`}
                      ref={isActive ? (el) => { activeRef.current = el } : undefined}
                      href={row.href}
                      role="option"
                      aria-selected={isActive}
                      onClick={close}
                      onMouseEnter={() => setActiveIndex(row.index)}
                      className={cls}
                    >
                      {row.label}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
