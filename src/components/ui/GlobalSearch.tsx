'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Callout, Spinner, TextInput } from '@vapor-ui/core';
import { SearchOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { Brand, Item, Photo, Project, Tag } from '@/types';

interface SearchResults {
  projects: Project[];
  items: Item[];
  brands: Brand[];
  photos: Photo[];
  tags: Tag[];
  total: number;
}

interface ResultRow {
  id: string;
  label: string;
  href: string;
}

export interface GlobalSearchProps {
  placeholder?: string;
}

export default function GlobalSearch({ placeholder = '통합 검색' }: GlobalSearchProps) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = () => {
    setQ('');
    setResults(null);
    setOpen(false);
  };

  const groups: { key: string; label: string; rows: ResultRow[] }[] = results
    ? [
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
          rows: results.brands.map((b) => ({
            id: b.id,
            label: b.nameKo || b.name,
            href: `/brands/${b.id}`,
          })),
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
          key: 'tags',
          label: '태그',
          rows: results.tags.map((t) => ({ id: t.id, label: t.name, href: '/tags' })),
        },
      ].filter((g) => g.rows.length > 0)
    : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <SearchOutlineIcon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400"
      />
      <TextInput
        type="search"
        value={q}
        onValueChange={setQ}
        placeholder={placeholder}
        className="pl-9"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        onFocus={() => {
          if (q.trim()) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
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
                {group.rows.map((row) => (
                  <Link
                    key={`${group.key}-${row.id}`}
                    href={row.href}
                    role="option"
                    onClick={handleSelect}
                    className="block truncate rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {row.label}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
