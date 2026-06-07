// Design4Public CMS - 사진 리스트 페이지

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Callout, IconButton } from '@vapor-ui/core';
import {
  ViewOnOutlineIcon,
  EditOutlineIcon,
  TrashOutlineIcon,
  ImageOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  PageHeader,
  SearchInput,
  DataTable,
  Pagination,
  ConfirmDialog,
  EmptyState,
  ImagePlaceholder,
  SuccessCallout,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import type { Photo } from '@/types';

const LIMIT = 12;

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<{ items: Photo[]; total: number }>('/photos', {
          page,
          limit: LIMIT,
          ...(search.trim() ? { search: search.trim() } : {}),
        });
        if (!active) return;
        if (res.success && res.data) {
          setPhotos(res.data.items);
          setTotal(res.data.total);
        } else {
          setError(res.error ?? '사진 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        if (active) {
          console.error('사진 목록 로딩 오류:', err);
          setError('사진 목록을 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPhotos();
    return () => {
      active = false;
    };
  }, [page, search, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await api.delete(`/photos/${deleteTarget.id}`);
      if (res.success) {
        setDeleteTarget(null);
        setSuccess('사진이 삭제되었습니다.');
        // If we deleted the last row on a page beyond the first, step back a page.
        if (photos.length === 1 && page > 1) {
          setPage((p) => p - 1);
        } else {
          refetch();
        }
      } else {
        setError(res.error ?? '사진 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('사진 삭제 오류:', err);
      setError('사진 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Photo>[] = [
    {
      key: 'image',
      header: '이미지',
      render: (photo) =>
        photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.imageUrl}
            alt={photo.altText || '사진'}
            className="h-12 w-16 rounded object-cover"
          />
        ) : (
          <ImagePlaceholder className="h-12 w-16 rounded" />
        ),
    },
    {
      key: 'title',
      header: '제목',
      render: (photo) => (
        <span className="font-medium text-gray-900">{photo.title || '제목 없음'}</span>
      ),
    },
    {
      key: 'connectedItems',
      header: '연결 아이템 수',
      align: 'center',
      render: (photo) => `${photo.connectedItems?.length ?? 0}개`,
    },
    {
      key: 'tags',
      header: '태그',
      render: (photo) => (
        <div className="flex flex-wrap gap-1">
          {photo.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag.id} colorPalette="hint" size="sm">
              {tag.name}
            </Badge>
          ))}
          {photo.tags && photo.tags.length > 3 ? (
            <Badge colorPalette="hint" size="sm">
              +{photo.tags.length - 3}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
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

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={handleSearch} placeholder="사진 제목, 설명 검색" />
      </div>

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <DataTable
        columns={columns}
        rows={photos}
        rowKey={(photo) => photo.id}
        loading={loading}
        empty={
          <EmptyState
            icon={<ImageOutlineIcon size={40} />}
            title="등록된 사진이 없습니다."
            description="프로젝트·아이템 이미지 업로드 시 자동으로 추가됩니다."
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
