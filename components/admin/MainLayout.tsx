'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar, { MenuCounts } from './Sidebar';
import { api } from '@/lib/admin-api';

const EMPTY: MenuCounts = { projects: 0, photos: 0, items: 0, brands: 0, categories: 0, managers: 0 };
const COLLAPSE_KEY = 'd4p:sidebar-collapsed';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<MenuCounts>(EMPTY);
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted collapse state (client-only, avoids hydration mismatch).
  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

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
          api.get<{ items: unknown[]; total: number }>('/categories'),
          api.get<{ items: unknown[]; total: number }>('/managers').catch(() => ({ data: { items: [], total: 0 } })),
        ]);
        setCounts({
          projects: total(p),
          photos: total(ph),
          items: total(i),
          brands: total(b),
          categories: total(t),
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
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} counts={counts} />
      <main
        className={`min-h-screen p-6 transition-[margin] duration-200 ${
          collapsed ? 'ml-[72px]' : 'ml-[280px]'
        }`}
      >
        <div className="min-h-[calc(100vh-48px)] rounded-lg bg-white p-6 shadow-sm">{children}</div>
      </main>
    </div>
  );
}
