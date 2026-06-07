// Design4Public CMS - 브랜드 리스트 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, IconButton } from '@vapor-ui/core';
import {
  PlusOutlineIcon,
  ViewOnOutlineIcon,
  EditOutlineIcon,
  TrashOutlineIcon,
  LinkOutlineIcon,
  BookmarkOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  PageHeader,
  ListToolbar,
  FilterSelect,
  StatusBadge,
  ConfirmDialog,
  DataTable,
  Pagination,
  EmptyState,
  Thumbnail,
  SuccessCallout,
  type DataTableColumn,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useListController, type ListSort } from '@/lib/use-list-controller';
import type { Brand } from '@/types';

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'visible', label: '노출' },
  { value: 'hidden', label: '숨김' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'name', label: '이름순' },
];

const SORT_MAP: Record<string, ListSort> = {
  latest: { key: 'created_at', dir: 'desc' },
  name: { key: 'name_ko', dir: 'asc' },
};

// 이미지 URL에 캐시 무효화를 위한 타임스탬프 추가
function addCacheBuster(url: string | null | undefined, updatedAt?: string): string | undefined {
  if (!url) return undefined;
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
}

export default function BrandsPage() {
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const controller = useListController<Brand>({
    limit: LIMIT,
    initialFilters: { status: 'all' },
    initialSort: SORT_MAP.latest,
    fetch: async (params) => {
      const query: {
        status?: string;
        search?: string;
        sort?: string;
        dir?: 'asc' | 'desc';
        page?: number;
        limit?: number;
      } = { page: params.page, limit: params.limit };
      if (params.search) query.search = params.search;
      if (typeof params.status === 'string' && params.status !== 'all') query.status = params.status;
      if (params.sort) query.sort = params.sort;
      if (params.dir) query.dir = params.dir;

      const response = await api.brands.getList(query);
      if (!response.success || !response.data) {
        throw new Error(response.error || '브랜드 목록을 불러오는데 실패했습니다.');
      }
      const data = response.data as { items: Brand[]; total: number };
      return { items: data.items, total: data.total };
    },
  });

  const sortValue = controller.sort?.key === 'name_ko' ? 'name' : 'latest';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      const response = await api.brands.delete(deleteTarget.id);
      if (response.success) {
        setDeleteTarget(null);
        setSuccess('브랜드가 삭제되었습니다.');
        controller.refetch();
      } else {
        setActionError(response.error || '브랜드 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('브랜드 삭제 오류:', err);
      setActionError('브랜드 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Brand>[] = [
    {
      key: 'logo',
      header: '로고',
      width: 'w-20',
      render: (brand) => (
        <Thumbnail
          src={addCacheBuster(brand.logoImageUrl, brand.updatedAt)}
          alt={`${brand.nameKo} 로고`}
          className="h-12 w-12 rounded-full"
          icon={<BookmarkOutlineIcon size={20} />}
        />
      ),
    },
    {
      key: 'name_ko',
      header: '브랜드명',
      width: 'w-56',
      sortable: true,
      render: (brand) => <span className="font-medium text-gray-900">{brand.nameKo}</span>,
    },
    {
      key: 'nameEn',
      header: '영문',
      render: (brand) =>
        brand.nameEn ? (
          <span className="text-gray-600">{brand.nameEn}</span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-28',
      nowrap: true,
      render: (brand) => <StatusBadge kind="brand" value={brand.status ?? 'visible'} />,
    },
    {
      key: 'websiteUrl',
      header: 'URL',
      width: 'w-28',
      render: (brand) =>
        brand.websiteUrl ? (
          <a
            href={brand.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-v-primary-100 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkOutlineIcon size={14} />
            방문
          </a>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'actions',
      header: '작업',
      width: 'w-32',
      align: 'right',
      render: (brand) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            aria-label="상세보기"
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            onClick={() => router.push(`/brands/${brand.id}`)}
          >
            <ViewOnOutlineIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="편집"
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            onClick={() => router.push(`/brands/${brand.id}/edit`)}
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="삭제"
            size="sm"
            variant="ghost"
            colorPalette="danger"
            onClick={() => setDeleteTarget(brand)}
          >
            <TrashOutlineIcon size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  const errorMessage = actionError ?? controller.error;

  return (
    <MainLayout>
      <PageHeader
        title="브랜드 관리"
        action={
          <Button colorPalette="primary" variant="fill" onClick={() => router.push('/brands/new')}>
            <PlusOutlineIcon size={16} />
            새 브랜드 추가
          </Button>
        }
      />

      {errorMessage ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {errorMessage}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <ListToolbar
        search={controller.search}
        onSearchChange={controller.setSearch}
        searchPlaceholder="한글/영문 브랜드명 검색"
        filters={
          <FilterSelect
            value={controller.filters.status ?? 'all'}
            onValueChange={(value) => controller.setFilter('status', value)}
            options={STATUS_OPTIONS}
          />
        }
        sort={
          <FilterSelect
            value={sortValue}
            onValueChange={(value) => controller.setSort(SORT_MAP[value] ?? SORT_MAP.latest)}
            options={SORT_OPTIONS}
          />
        }
      />

      <DataTable
        columns={columns}
        rows={controller.items}
        rowKey={(brand) => brand.id}
        loading={controller.loading}
        sortKey={controller.sort?.key}
        sortDir={controller.sort?.dir}
        onSortChange={controller.toggleSort}
        empty={
          <EmptyState
            icon={<BookmarkOutlineIcon size={40} />}
            title="등록된 브랜드가 없습니다."
            description="검색 조건을 변경하거나 새 브랜드를 추가해 보세요."
          />
        }
      />

      <div className="mt-6">
        <Pagination
          page={controller.page}
          total={controller.total}
          limit={LIMIT}
          onPageChange={controller.setPage}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="브랜드 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.nameKo}" 브랜드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : undefined
        }
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </MainLayout>
  );
}
