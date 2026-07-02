// Design4Public CMS - 카테고리 설정 페이지

'use client';

import { useState } from 'react';
import { Badge, Button, Card, Dialog, Field, IconButton, Select, Spinner, Text, TextInput } from '@vapor-ui/core';
import { EditOutlineIcon, PlusOutlineIcon, TrashOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, ListToolbar, FilterSelect, DataTable, Pagination, ConfirmDialog } from '@/components/ui';
import type { DataTableColumn, FilterSelectOption } from '@/components/ui';
import { useListController } from '@/lib/use-list-controller';
import { api } from '@/lib/api';
import type { Category, CategoryType } from '@/types';

type BadgeColor = 'primary' | 'hint' | 'danger' | 'success' | 'warning' | 'contrast';

const PAGE_SIZE = 20;

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'project', label: '프로젝트' },
  { value: 'item', label: '아이템' },
];

const TYPE_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: 'all', label: '전체' },
  ...TYPE_OPTIONS,
];

const SORT_OPTIONS: FilterSelectOption[] = [
  { value: 'name', label: '이름순' },
  { value: 'created_at', label: '최신순' },
];

const TYPE_BADGE: Record<CategoryType, { label: string; colorPalette: BadgeColor }> = {
  project: { label: '프로젝트', colorPalette: 'primary' },
  item: { label: '아이템', colorPalette: 'success' },
};

// 카테고리명 검증 (1-20자, 한글/영문/숫자만)
function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return '카테고리명을 입력해주세요.';
  if (value.length < 1 || value.length > 20) return '카테고리명은 1-20자 사이여야 합니다.';
  if (!/^[가-힣a-zA-Z0-9\s]+$/.test(value)) return '카테고리명은 한글, 영문, 숫자만 사용할 수 있습니다.';
  return null;
}

export default function CategoriesPage() {
  const {
    items: categories,
    total,
    loading,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    toggleSort,
    refetch,
  } = useListController<Category>({
    initialFilters: { type: 'all' },
    initialSort: { key: 'name', dir: 'asc' },
    limit: PAGE_SIZE,
    fetch: async (params) => {
      const res = await api.categories.getList({
        type: params.type && params.type !== 'all' ? String(params.type) : undefined,
        search: params.search || undefined,
        sort: params.sort,
        dir: params.dir,
        page: params.page,
        limit: params.limit,
      });
      if (!res.success) {
        throw new Error(res.error ?? '카테고리 목록을 불러오지 못했습니다.');
      }
      const data = res.data as { items?: Category[]; total?: number } | undefined;
      return { items: data?.items ?? [], total: data?.total ?? 0 };
    },
  });

  // 생성/수정 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CategoryType>('project');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 삭제 확인 상태
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const typeFilter = filters.type ?? 'all';

  // 정렬 셀렉트: 이름순(name asc) / 최신순(created_at desc)
  const handleSortSelect = (value: string) => {
    setSort(value === 'created_at' ? { key: 'created_at', dir: 'desc' } : { key: 'name', dir: 'asc' });
  };

  // 다이얼로그 열기 (생성)
  const openCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(typeFilter === 'all' ? 'project' : (typeFilter as CategoryType));
    setFormError(null);
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (수정)
  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormError(null);
    setDialogOpen(true);
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormName('');
    setFormError(null);
  };

  // 카테고리 저장
  const handleSave = async () => {
    const error = validateName(formName);
    if (error) {
      setFormError(error);
      return;
    }

    setSaving(true);
    setFormError(null);
    const name = formName.trim();

    try {
      if (editingCategory) {
        const res = await api.categories.update(editingCategory.id, { name, type: formType });
        if (res.success) {
          refetch();
          closeDialog();
        } else {
          setFormError(res.error ?? '카테고리 수정에 실패했습니다.');
        }
      } else {
        const res = await api.categories.create({ name, type: formType });
        if (res.success) {
          refetch();
          closeDialog();
        } else {
          setFormError(res.error ?? '카테고리 추가에 실패했습니다.');
        }
      }
    } catch (error) {
      setFormError(`카테고리 저장 중 오류가 발생했습니다: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // 카테고리 삭제
  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      const res = await api.categories.delete(deletingCategory.id);
      if (res.success) {
        refetch();
        setDeletingCategory(null);
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'name',
      header: '카테고리명',
      sortable: true,
      truncate: true,
      render: (category) => (
        <span className="font-medium text-gray-900" title={category.name}>
          {category.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: '타입',
      width: 'w-40',
      nowrap: true,
      render: (category) => {
        const info = TYPE_BADGE[category.type];
        return (
          <Badge colorPalette={info.colorPalette} size="sm">
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
      width: 'w-32',
      nowrap: true,
      render: (category) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            aria-label="편집"
            variant="ghost"
            colorPalette="secondary"
            size="sm"
            onClick={() => openEdit(category)}
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="삭제"
            variant="ghost"
            colorPalette="danger"
            size="sm"
            onClick={() => setDeletingCategory(category)}
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
        title="카테고리 설정"
        action={
          <Button variant="fill" colorPalette="primary" onClick={openCreate}>
            <PlusOutlineIcon size={16} />
            새 카테고리
          </Button>
        }
      />

      <Card.Root>
        <Card.Body>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="카테고리명 검색"
            filters={
              <FilterSelect
                value={typeFilter}
                onValueChange={(value) => setFilter('type', value)}
                options={TYPE_FILTER_OPTIONS}
                placeholder="전체"
                width="w-40"
              />
            }
            sort={
              <FilterSelect
                value={sort?.key ?? 'name'}
                onValueChange={handleSortSelect}
                options={SORT_OPTIONS}
                placeholder="이름순"
                width="w-36"
              />
            }
          />

          <DataTable
            columns={columns}
            rows={categories}
            rowKey={(category) => category.id}
            loading={loading}
            empty="카테고리가 없습니다."
            sortKey={sort?.key}
            sortDir={sort?.dir}
            onSortChange={toggleSort}
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            <Text typography="body3" className="text-gray-500">
              총 {total}개
            </Text>
            <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </Card.Body>
      </Card.Root>

      {/* 카테고리 추가/수정 다이얼로그 */}
      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</Dialog.Title>
          <Dialog.Body>
            <div className="space-y-4">
              <Field.Root>
                <Field.Label>타입</Field.Label>
                <Select.Root
                  value={formType}
                  onValueChange={(value) => {
                    if (value) setFormType(value as CategoryType);
                  }}
                  items={TYPE_OPTIONS}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Popup>
                    {TYPE_OPTIONS.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>카테고리명</Field.Label>
                <TextInput
                  value={formName}
                  onValueChange={(value) => {
                    setFormName(value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="카테고리명을 입력하세요"
                  maxLength={20}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSave();
                    }
                  }}
                />
                {formError ? <Field.Error match>{formError}</Field.Error> : null}
              </Field.Root>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" colorPalette="secondary" onClick={closeDialog} disabled={saving}>
              취소
            </Button>
            <Button variant="fill" colorPalette="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="md" /> : editingCategory ? '수정' : '추가'}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>

      {/* 카테고리 삭제 확인 */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title="카테고리 삭제"
        description="이 카테고리를 삭제하시겠습니까?"
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </MainLayout>
  );
}
