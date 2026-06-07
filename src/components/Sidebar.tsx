'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Text, Badge } from '@vapor-ui/core';
import {
  FolderOutlineIcon,
  ImageOutlineIcon,
  DashboardOutlineIcon,
  BookmarkOutlineIcon,
  PriceOutlineIcon,
  GroupOutlineIcon,
} from '@vapor-ui/icons';
import { useAuth } from '@/contexts/AuthContext';

export interface MenuCounts {
  projects: number;
  photos: number;
  items: number;
  brands: number;
  tags: number;
  managers: number;
}

const NAV = [
  { key: 'projects', href: '/projects', label: '프로젝트', Icon: FolderOutlineIcon },
  { key: 'photos', href: '/photos', label: '사진', Icon: ImageOutlineIcon },
  { key: 'items', href: '/items', label: '아이템', Icon: DashboardOutlineIcon },
  { key: 'brands', href: '/brands', label: '브랜드', Icon: BookmarkOutlineIcon },
  { key: 'tags', href: '/tags', label: '태그', Icon: PriceOutlineIcon },
] as const;

export default function Sidebar({ counts }: { counts?: Partial<MenuCounts> }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isMaster } = useAuth();

  const items = isMaster
    ? [...NAV, { key: 'managers', href: '/managers', label: '관리자', Icon: GroupOutlineIcon } as const]
    : NAV;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) || (href === '/projects' && pathname === '/');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const roleLabel =
    user?.role === 'master' ? '마스터' : user?.role === 'admin' ? '관리자' : '콘텐츠매니저';

  return (
    <aside className="fixed left-0 top-0 z-10 flex h-screen w-[280px] flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-6">
        <Text typography="heading4" render={<h1 />} className="text-blue-600">
          Design4Public
        </Text>
        <Text typography="body3" className="text-gray-500">
          콘텐츠관리자
        </Text>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ key, href, label, Icon }) => {
          const active = isActive(href);
          const count = counts?.[key as keyof MenuCounts];
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-blue-50 font-semibold text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {count ? (
                <Badge colorPalette="hint" size="sm">
                  {count}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900">{user?.name || '사용자'}</div>
            <div className="text-xs text-gray-500">{roleLabel}</div>
          </div>
        </div>
        <Button variant="outline" color="secondary" onClick={handleLogout} className="w-full">
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
