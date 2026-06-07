'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar, { MenuCounts } from './Sidebar';
import { GlobalSearch } from './ui';
import { api } from '@/lib/api';

const EMPTY: MenuCounts = { projects: 0, photos: 0, items: 0, brands: 0, tags: 0, managers: 0 };

export default function MainLayout({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<MenuCounts>(EMPTY);

  useEffect(() => {
    const fetchCounts = async () => {
      const total = (r: { data?: { total?: number; items?: unknown[] } }) =>
        r.data?.total ?? r.data?.items?.length ?? 0;
      try {
        const [p, ph, i, b, t, m] = await Promise.all([
          api.get<{ items: unknown[]; total: number }>('/projects'),
          api.get<{ items: unknown[]; total: number }>('/photos'),
          api.get<{ items: unknown[]; total: number }>('/items'),
          api.get<{ items: unknown[]; total: number }>('/brands'),
          api.get<{ items: unknown[]; total: number }>('/tags'),
          api.get<{ items: unknown[]; total: number }>('/managers').catch(() => ({ data: { items: [], total: 0 } })),
        ]);
        setCounts({
          projects: total(p),
          photos: total(ph),
          items: total(i),
          brands: total(b),
          tags: total(t),
          managers: total(m),
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar counts={counts} />
      <main className="ml-[280px] min-h-screen p-6">
        <header className="mb-4 flex justify-end">
          <GlobalSearch />
        </header>
        <div className="min-h-[calc(100vh-48px)] rounded-lg bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}
