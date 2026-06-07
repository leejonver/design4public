// Design4Public CMS - 아이템 리스트 페이지

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Callout, Card, IconButton, Select } from '@vapor-ui/core';
import {
  PlusOutlineIcon,
  ViewOnOutlineIcon,
  EditOutlineIcon,
  TrashOutlineIcon,
  DashboardOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  PageHeader,
  SearchInput,
  StatusBadge,
  DataTable,
  Pagination,
  ConfirmDialog,
  EmptyState,
  ImagePlaceholder,
  SuccessCallout,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import type { Item, ItemStatus, Brand } from '@/types';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { label: '모든 상태', value: 'all' },
  { label: '구입가능', value: 'available' },
  { label: '단종', value: 'discontinued' },
  { label: '숨김', value: 'hidden' },
] as const;

export default function ItemsPage() {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ items: Item[] }>('/items', { limit: 200 });
      if (res.success && res.data) {
        setItems(res.data.items || []);
      } else {
        setError(res.error || '아이템 목록을 불러오는데 실패했습니다.');
      }
    } catch (e) {
      console.error('아이템 목록 로딩 오류:', e);
      setError('아이템 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    api.brands.getList({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        const data = res.data as { items?: Brand[] } | Brand[];
        setBrands(Array.isArray(data) ? data : data.items ?? []);
      }
    });
  }, []);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, brandFilter]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesBrand = brandFilter === 'all' || item.brand?.id === brandFilter;
      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [items, searchTerm, statusFilter, brandFilter]);

  const total = filteredItems.length;
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const brandOptions = useMemo(
    () => [
      { label: '모든 브랜드', value: 'all' },
      ...brands.map((brand) => ({ label: brand.name, value: brand.id })),
    ],
    [brands],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.delete(`/items/${deleteTarget.id}`);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.success) {
      setSuccess('아이템이 삭제되었습니다.');
      fetchItems();
    } else {
      setError(res.error || '아이템 삭제에 실패했습니다.');
    }
  };

  const columns: DataTableColumn<Item>[] = [
    {
      key: 'image',
      header: '대표이미지',
      render: (item) => {
        const images = item.images;
        const mainImage =
          Array.isArray(images) && images.length > 0
            ? images.find((img) => img.isMain) || images[0]
            : null;
        return mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage.url}
            alt={mainImage.alt || '아이템 이미지'}
            className="h-14 w-14 rounded-md object-cover"
          />
        ) : (
          <ImagePlaceholder
            className="h-14 w-14 rounded-md"
            icon={<DashboardOutlineIcon size={20} />}
          />
        );
      },
    },
    {
      key: 'name',
      header: '아이템명',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900">{item.name}</div>
          {item.description ? (
            <div className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'brand',
      header: '브랜드',
      render: (item) =>
        item.brand ? (
          <Badge colorPalette="hint" size="sm">
            {item.brand.name}
          </Badge>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      render: (item) => <StatusBadge kind="item" value={item.status} />,
    },
    {
      key: 'tags',
      header: '태그',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag.id} colorPalette="contrast" size="sm">
              {tag.name}
            </Badge>
          ))}
          {item.tags && item.tags.length > 2 ? (
            <Badge colorPalette="hint" size="sm">
              +{item.tags.length - 2}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="상세보기"
            onClick={() => router.push(`/items/${item.id}`)}
          >
            <ViewOnOutlineIcon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="secondary"
            aria-label="편집"
            onClick={() => router.push(`/items/${item.id}/edit`)}
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            colorPalette="danger"
            aria-label="삭제"
            onClick={() => setDeleteTarget(item)}
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
        title="아이템 관리"
        action={
          <Button variant="fill" colorPalette="primary" onClick={() => router.push('/items/new')}>
            <PlusOutlineIcon size={16} />새 아이템
          </Button>
        }
      />

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <Card.Root>
        <Card.Body className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-72">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="아이템명 또는 설명 검색"
              />
            </div>
            <div className="w-40">
              <Select.Root
                items={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v ?? 'all')}
                placeholder="모든 상태"
              >
                <Select.Trigger className="w-full" />
                <Select.Popup>
                  {STATUS_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
            <div className="w-48">
              <Select.Root
                items={brandOptions}
                value={brandFilter}
                onValueChange={(v) => setBrandFilter(v ?? 'all')}
                placeholder="모든 브랜드"
              >
                <Select.Trigger className="w-full" />
                <Select.Popup>
                  {brandOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
          </div>

          <DataTable<Item>
            columns={columns}
            rows={pagedItems}
            rowKey={(item) => item.id}
            loading={loading}
            empty={
              <EmptyState
                icon={<DashboardOutlineIcon size={40} />}
                title="아이템이 없습니다."
                description="검색 조건을 변경하거나 새 아이템을 추가해 보세요."
              />
            }
          />

          {total > PAGE_SIZE ? (
            <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
          ) : null}
        </Card.Body>
      </Card.Root>

      <ConfirmDialog
        open={!!deleteTarget}
        title="아이템 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" 아이템을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
            : undefined
        }
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </MainLayout>
  );
}
