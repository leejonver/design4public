// Design4Public CMS - 카테고리 설정 페이지

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Dialog, Field, IconButton, Select, Spinner, Text, TextInput } from '@vapor-ui/core';
import { EditOutlineIcon, PlusOutlineIcon, TrashOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, SearchInput, DataTable, ConfirmDialog } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import type { Category, CategoryType } from '@/types';

type TypeFilter = CategoryType | 'all';

type BadgeColor = 'primary' | 'hint' | 'danger' | 'success' | 'warning' | 'contrast';

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'project', label: '프로젝트' },
  { value: 'item', label: '아이템' },
];

const FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  ...TYPE_OPTIONS,
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

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

  // 카테고리 목록 가져오기
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.categories.getList({ limit: 1000 });
      if (res.success) {
        setCategories((res.data as { items?: Category[] } | undefined)?.items ?? []);
      }
    } catch (error) {
      console.error('카테고리 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 타입 + 검색어로 필터링
  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesType = typeFilter === 'all' || category.type === typeFilter;
      const matchesTerm = category.name.toLowerCase().includes(term);
      return matchesType && matchesTerm;
    });
  }, [categories, searchTerm, typeFilter]);

  // 다이얼로그 열기 (생성)
  const openCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(typeFilter === 'all' ? 'project' : typeFilter);
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
          await fetchCategories();
          closeDialog();
        } else {
          setFormError(res.error ?? '카테고리 수정에 실패했습니다.');
        }
      } else {
        const res = await api.categories.create({ name, type: formType });
        if (res.success) {
          await fetchCategories();
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
        await fetchCategories();
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
      render: (category) => <span className="font-medium text-gray-900">{category.name}</span>,
    },
    {
      key: 'type',
      header: '타입',
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
      render: (category) => (
        <div className="flex justify-end gap-1">
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

      {/* 검색 + 타입 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="카테고리명 검색" />
        </div>
        <Select.Root
          value={typeFilter}
          onValueChange={(value) => setTypeFilter((value ?? 'all') as TypeFilter)}
          items={FILTER_OPTIONS}
        >
          <Select.Trigger className="w-40" aria-label="타입 필터" />
          <Select.Popup>
            {FILTER_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Root>
      </div>

      {/* 카테고리 테이블 */}
      <DataTable
        columns={columns}
        rows={filteredCategories}
        rowKey={(category) => category.id}
        loading={loading}
        empty="카테고리가 없습니다."
      />

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
                {formError ? (
                  <Text typography="body3" render={<p />} className="text-red-600">
                    {formError}
                  </Text>
                ) : null}
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
