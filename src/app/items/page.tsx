// Design4Public CMS - 아이템 리스트 페이지

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Callout, IconButton } from '@vapor-ui/core';
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
  ListToolbar,
  FilterSelect,
  StatusBadge,
  DataTable,
  Pagination,
  ConfirmDialog,
  EmptyState,
  Thumbnail,
  SuccessCallout,
} from '@/components/ui';
import type { DataTableColumn, FilterSelectOption } from '@/components/ui';
import { useListController } from '@/lib/use-list-controller';
import { api } from '@/lib/api';
import type { Item, Brand } from '@/types';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: FilterSelectOption[] = [
  { label: '전체', value: 'all' },
  { label: '구입가능', value: 'available' },
  { label: '단종', value: 'discontinued' },
  { label: '숨김', value: 'hidden' },
];

const SORT_OPTIONS: FilterSelectOption[] = [
  { label: '최신순', value: 'created_at' },
  { label: '이름순', value: 'name' },
];

export default function ItemsPage() {
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const list = useListController<Item>({
    limit: PAGE_SIZE,
    initialFilters: { status: 'all', brandId: 'all' },
    initialSort: { key: 'created_at', dir: 'desc' },
    fetch: async (params) => {
      const status = typeof params.status === 'string' ? params.status : 'all';
      const brandId = typeof params.brandId === 'string' ? params.brandId : 'all';
      const res = await api.items.getList({
        search: params.search || undefined,
        status: status !== 'all' ? status : undefined,
        brandId: brandId !== 'all' ? brandId : undefined,
        sort: params.sort,
        dir: params.dir,
        page: params.page,
        limit: params.limit,
      });
      if (res.success && res.data) {
        const data = res.data as { items?: Item[]; total?: number };
        return { items: data.items ?? [], total: data.total ?? 0 };
      }
      throw new Error(res.error || '아이템 목록을 불러오지 못했습니다.');
    },
  });

  useEffect(() => {
    api.brands.getList({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        const data = res.data as { items?: Brand[] } | Brand[];
        setBrands(Array.isArray(data) ? data : data.items ?? []);
      }
    });
  }, []);

  const brandOptions = useMemo<FilterSelectOption[]>(
    () => [
      { label: '전체', value: 'all' },
      ...brands.map((brand) => ({ label: brand.name, value: brand.id })),
    ],
    [brands],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.items.delete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.success) {
      setSuccess('아이템이 삭제되었습니다.');
      list.refetch();
    }
  };

  const sortValue = list.sort?.key ?? 'created_at';

  const columns: DataTableColumn<Item>[] = [
    {
      key: 'image',
      header: '대표이미지',
      width: 'w-24',
      render: (item) => {
        const images = item.images;
        const mainImage =
          Array.isArray(images) && images.length > 0
            ? images.find((img) => img.isMain) ?? images[0]
            : null;
        return (
          <Thumbnail
            src={mainImage?.url}
            alt={mainImage?.alt || item.name}
            className="h-14 w-14 rounded-md"
          />
        );
      },
    },
    {
      key: 'name',
      header: '아이템명',
      sortable: true,
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
      width: 'w-40',
      render: (item) =>
        item.brand?.name ? (
          <span className="block truncate text-gray-700" title={item.brand.name}>
            {item.brand.name}
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-28',
      nowrap: true,
      render: (item) => <StatusBadge kind="item" value={item.status} />,
    },
    {
      key: 'categories',
      header: '카테고리',
      width: 'w-56',
      render: (item) => {
        const categories = item.categories ?? [];
        if (categories.length === 0) {
          return <span className="text-gray-300">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((category) => (
              <Badge key={category.id} colorPalette="contrast" size="sm">
                {category.name}
              </Badge>
            ))}
            {categories.length > 2 ? (
              <Badge colorPalette="hint" size="sm">
                +{categories.length - 2}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
      width: 'w-32',
      nowrap: true,
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

      {list.error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {list.error}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <ListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="아이템명 또는 설명 검색"
        filters={
          <>
            <FilterSelect
              value={list.filters.status ?? 'all'}
              onValueChange={(v) => list.setFilter('status', v)}
              options={STATUS_OPTIONS}
              width="w-32"
            />
            <FilterSelect
              value={list.filters.brandId ?? 'all'}
              onValueChange={(v) => list.setFilter('brandId', v)}
              options={brandOptions}
              width="w-44"
            />
          </>
        }
        sort={
          <FilterSelect
            value={sortValue}
            onValueChange={(v) => list.setSort({ key: v, dir: v === 'name' ? 'asc' : 'desc' })}
            options={SORT_OPTIONS}
            width="w-32"
          />
        }
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <DataTable<Item>
          columns={columns}
          rows={list.items}
          rowKey={(item) => item.id}
          loading={list.loading}
          sortKey={list.sort?.key}
          sortDir={list.sort?.dir}
          onSortChange={list.toggleSort}
          empty={
            <EmptyState
              icon={<DashboardOutlineIcon size={40} />}
              title="아이템이 없습니다."
              description="검색 조건을 변경하거나 새 아이템을 추가해 보세요."
            />
          }
        />
      </div>

      {list.total > PAGE_SIZE ? (
        <div className="mt-4">
          <Pagination
            page={list.page}
            total={list.total}
            limit={PAGE_SIZE}
            onPageChange={list.setPage}
          />
        </div>
      ) : null}

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
