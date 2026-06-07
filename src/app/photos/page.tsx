// Design4Public CMS - 사진 리스트 페이지

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Callout, IconButton } from '@vapor-ui/core';
import {
  ViewOnOutlineIcon,
  EditOutlineIcon,
  TrashOutlineIcon,
  ImageOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  PageHeader,
  ListToolbar,
  FilterSelect,
  DataTable,
  Pagination,
  ConfirmDialog,
  EmptyState,
  SuccessCallout,
  Thumbnail,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useListController } from '@/lib/use-list-controller';
import type { ListFetchParams, ListResult } from '@/lib/use-list-controller';
import { api } from '@/lib/api';
import type { Photo } from '@/types';

const LIMIT = 12;

// 연결 상태 필터 (전체 / 미연결)
const CONNECTION_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'unconnected', label: '미연결' },
];

// 정렬 옵션 — 서버 화이트리스트(created_at, title)에 매핑
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: '최신순' },
  { value: 'title:asc', label: '제목순' },
];

export default function PhotosPage() {
  const router = useRouter();

  const fetchPhotos = useCallback(
    async (params: ListFetchParams): Promise<ListResult<Photo>> => {
      const res = await api.photos.getList({
        search: params.search || undefined,
        unconnected: params.connection === 'unconnected',
        sort: params.sort,
        dir: params.dir,
        page: params.page,
        limit: params.limit,
      });
      if (!res.success || !res.data) {
        throw new Error(res.error ?? '사진 목록을 불러오는데 실패했습니다.');
      }
      const data = res.data as { items: Photo[]; total: number };
      return { items: data.items, total: data.total };
    },
    [],
  );

  const {
    items: photos,
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
  } = useListController<Photo>({
    fetch: fetchPhotos,
    initialFilters: { connection: 'all' },
    initialSort: { key: 'created_at', dir: 'desc' },
    limit: LIMIT,
  });

  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sortValue = sort ? `${sort.key}:${sort.dir}` : '';
  const handleSortChange = (value: string) => {
    const [key, dir] = value.split(':');
    setSort({ key, dir: dir === 'asc' ? 'asc' : 'desc' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await api.photos.delete(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        setSuccess('사진이 삭제되었습니다.');
        // 현재 페이지의 마지막 행을 지웠다면 이전 페이지로 이동
        if (photos.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          refetch();
        }
      } else {
        setActionError(res.error ?? '사진 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('사진 삭제 오류:', err);
      setActionError('사진 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Photo>[] = [
    {
      key: 'image',
      header: '이미지',
      width: 'w-24',
      render: (photo) => (
        <Thumbnail src={photo.imageUrl} alt={photo.altText || photo.title || '사진'} />
      ),
    },
    {
      key: 'title',
      header: '제목',
      sortable: true,
      render: (photo) => (
        <span className="font-medium text-gray-900">
          {photo.title || photo.altText || '제목 없음'}
        </span>
      ),
    },
    {
      key: 'connectedItems',
      header: '연결 아이템',
      align: 'center',
      width: 'w-28',
      nowrap: true,
      render: (photo) => `${photo.connectedItems?.length ?? 0}개`,
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
      width: 'w-32',
      nowrap: true,
      render: (photo) => (
        <div className="flex justify-end gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="상세보기"
            onClick={() => router.push(`/photos/${photo.id}`)}
          >
            <ViewOnOutlineIcon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="편집"
            onClick={() => router.push(`/photos/${photo.id}/edit`)}
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="danger"
            aria-label="삭제"
            onClick={() => setDeleteTarget(photo)}
          >
            <TrashOutlineIcon size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader title="사진 관리" />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="사진 제목, 설명 검색"
        filters={
          <FilterSelect
            value={filters.connection ?? 'all'}
            onValueChange={(v) => setFilter('connection', v)}
            options={CONNECTION_OPTIONS}
            placeholder="전체"
            width="w-32"
          />
        }
        sort={
          <FilterSelect
            value={sortValue}
            onValueChange={handleSortChange}
            options={SORT_OPTIONS}
            placeholder="정렬"
            width="w-32"
          />
        }
      />

      {actionError || error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {actionError ?? error}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <DataTable
        columns={columns}
        rows={photos}
        rowKey={(photo) => photo.id}
        loading={loading}
        sortKey={sort?.key}
        sortDir={sort?.dir}
        onSortChange={toggleSort}
        empty={
          <EmptyState
            icon={<ImageOutlineIcon size={40} />}
            title="등록된 사진이 없습니다."
            description="사진은 프로젝트·아이템 이미지 업로드 시 자동으로 추가됩니다."
          />
        }
      />

      {total > LIMIT ? (
        <div className="mt-6">
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="사진 삭제"
        description="이 사진을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </MainLayout>
  );
}
