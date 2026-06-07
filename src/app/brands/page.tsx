// Design4Public CMS - 브랜드 리스트 페이지

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, IconButton, Select } from '@vapor-ui/core';
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
  SearchInput,
  StatusBadge,
  ConfirmDialog,
  DataTable,
  Pagination,
  type DataTableColumn,
} from '@/components/ui';
import { api } from '@/lib/api';
import type { Brand } from '@/types';

const LIMIT = 10;

const STATUS_FILTER_LABELS: Record<string, string> = {
  all: '전체',
  visible: '노출',
  hidden: '숨김',
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      const response = await api.get<{ items: Brand[]; total: number }>('/brands', params);
      if (response.success && response.data) {
        setBrands(response.data.items);
        setTotal(response.data.total);
      } else {
        setError(response.error || '브랜드 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('브랜드 목록 로딩 오류:', err);
      setError('브랜드 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/brands/${deleteTarget.id}`);
      if (response.success) {
        setDeleteTarget(null);
        fetchBrands();
      } else {
        setError(response.error || '브랜드 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('브랜드 삭제 오류:', err);
      setError('브랜드 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Brand>[] = [
    {
      key: 'logo',
      header: '로고',
      render: (brand) =>
        brand.logoImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={addCacheBuster(brand.logoImageUrl, brand.updatedAt)}
            alt={`${brand.nameKo} 로고`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <BookmarkOutlineIcon size={20} />
          </div>
        ),
    },
    {
      key: 'nameKo',
      header: '브랜드명',
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
      render: (brand) => <StatusBadge kind="brand" value={brand.status ?? 'visible'} />,
    },
    {
      key: 'websiteUrl',
      header: 'URL',
      render: (brand) =>
        brand.websiteUrl ? (
          <a
            href={brand.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
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

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="한글/영문 브랜드명 검색"
          />
        </div>
        <Select.Root value={status} onValueChange={(v) => handleStatusChange(v ?? 'all')}>
          <Select.Trigger className="w-40">
            <Select.ValuePrimitive>
              {(value: unknown) => STATUS_FILTER_LABELS[String(value)] ?? '전체'}
            </Select.ValuePrimitive>
          </Select.Trigger>
          <Select.Popup>
            <Select.Item value="all">전체</Select.Item>
            <Select.Item value="visible">노출</Select.Item>
            <Select.Item value="hidden">숨김</Select.Item>
          </Select.Popup>
        </Select.Root>
      </div>

      <DataTable
        columns={columns}
        rows={brands}
        rowKey={(brand) => brand.id}
        loading={loading}
        empty="등록된 브랜드가 없습니다."
      />

      <div className="mt-6">
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
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
