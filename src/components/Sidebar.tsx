'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, IconButton, Text, Badge } from '@vapor-ui/core';
import {
  FolderOutlineIcon,
  ImageOutlineIcon,
  DashboardOutlineIcon,
  BookmarkOutlineIcon,
  SettingOutlineIcon,
  GroupOutlineIcon,
  ChevronLeftOutlineIcon,
  ChevronRightOutlineIcon,
  OutOutlineIcon,
} from '@vapor-ui/icons';
import { useAuth } from '@/contexts/AuthContext';

export interface MenuCounts {
  projects: number;
  photos: number;
  items: number;
  brands: number;
  categories: number;
  managers: number;
}

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  counts?: Partial<MenuCounts>;
}

const NAV = [
  { key: 'projects', href: '/projects', label: '프로젝트', Icon: FolderOutlineIcon },
  { key: 'items', href: '/items', label: '아이템', Icon: DashboardOutlineIcon },
  { key: 'brands', href: '/brands', label: '브랜드', Icon: BookmarkOutlineIcon },
  { key: 'photos', href: '/photos', label: '사진', Icon: ImageOutlineIcon },
  { key: 'categories', href: '/categories', label: '카테고리 설정', Icon: SettingOutlineIcon },
] as const;

export default function Sidebar({ collapsed, onToggle, counts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isMaster } = useAuth();

  const items = isMaster
    ? [
        ...NAV,
        { key: 'managers', href: '/managers', label: '사용자관리', Icon: GroupOutlineIcon } as const,
      ]
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
    <aside
      className={`fixed left-0 top-0 z-10 flex h-screen flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ${
        collapsed ? 'w-[72px]' : 'w-[280px]'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-5">
        {collapsed ? (
          <span className="flex-1 text-center text-lg font-bold text-v-primary-100">D4P</span>
        ) : (
          <div className="min-w-0 flex-1 px-2">
            <Text typography="heading4" render={<h1 />} className="text-v-primary-100">
              Design4Public
            </Text>
            <Text typography="body3" className="text-gray-500">
              콘텐츠관리자
            </Text>
          </div>
        )}
        <IconButton
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          size="sm"
          variant="ghost"
          colorPalette="secondary"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRightOutlineIcon size={18} /> : <ChevronLeftOutlineIcon size={18} />}
        </IconButton>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ key, href, label, Icon }) => {
          const active = isActive(href);
          const count = counts?.[key as keyof MenuCounts];
          return (
            <Link
              key={key}
              href={href}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={`flex items-center rounded-md text-sm transition-colors ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${active ? 'bg-v-primary-100 font-semibold text-v-primary-200' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon size={18} />
              {!collapsed ? <span className="flex-1">{label}</span> : null}
              {!collapsed && count ? (
                <Badge colorPalette="hint" size="sm">
                  {count}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-v-primary-200 text-sm font-medium text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <IconButton
              aria-label="로그아웃"
              size="sm"
              variant="ghost"
              colorPalette="secondary"
              onClick={handleLogout}
            >
              <OutOutlineIcon size={18} />
            </IconButton>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-v-primary-200 text-sm font-medium text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">{user?.name || '사용자'}</div>
                <div className="text-xs text-gray-500">{roleLabel}</div>
              </div>
            </div>
            <Button variant="outline" colorPalette="secondary" onClick={handleLogout} className="w-full">
              로그아웃
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
