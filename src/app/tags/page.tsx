// Design4Public CMS - 태그 관리 페이지

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Dialog, Field, IconButton, Select, Spinner, Text, TextInput } from '@vapor-ui/core';
import { EditOutlineIcon, PlusOutlineIcon, TrashOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, SearchInput, DataTable, ConfirmDialog } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import type { Tag, TagType } from '@/types';

type TypeFilter = TagType | 'all';

type BadgeColor = 'primary' | 'hint' | 'danger' | 'success' | 'warning' | 'contrast';

const TYPE_OPTIONS: { value: TagType; label: string }[] = [
  { value: 'project', label: '프로젝트' },
  { value: 'item', label: '아이템' },
  { value: 'photo', label: '사진' },
  { value: 'brand', label: '브랜드' },
];

const FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  ...TYPE_OPTIONS,
];

const TYPE_BADGE: Record<TagType, { label: string; colorPalette: BadgeColor }> = {
  project: { label: '프로젝트', colorPalette: 'primary' },
  item: { label: '아이템', colorPalette: 'success' },
  photo: { label: '사진', colorPalette: 'contrast' },
  brand: { label: '브랜드', colorPalette: 'warning' },
};

// 태그명 검증 (1-20자, 한글/영문/숫자만)
function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return '태그명을 입력해주세요.';
  if (value.length < 1 || value.length > 20) return '태그명은 1-20자 사이여야 합니다.';
  if (!/^[가-힣a-zA-Z0-9\s]+$/.test(value)) return '태그명은 한글, 영문, 숫자만 사용할 수 있습니다.';
  return null;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  // 생성/수정 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<TagType>('project');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 삭제 확인 상태
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 태그 목록 가져오기
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.tags.getList({ limit: 1000 });
      if (res.success) {
        setTags((res.data as { items?: Tag[] } | undefined)?.items ?? []);
      }
    } catch (error) {
      console.error('태그 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // 타입 + 검색어로 필터링
  const filteredTags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tags.filter((tag) => {
      const matchesType = typeFilter === 'all' || tag.type === typeFilter;
      const matchesTerm = tag.name.toLowerCase().includes(term);
      return matchesType && matchesTerm;
    });
  }, [tags, searchTerm, typeFilter]);

  // 다이얼로그 열기 (생성)
  const openCreate = () => {
    setEditingTag(null);
    setFormName('');
    setFormType(typeFilter === 'all' ? 'project' : typeFilter);
    setFormError(null);
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (수정)
  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormType(tag.type);
    setFormError(null);
    setDialogOpen(true);
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setFormName('');
    setFormError(null);
  };

  // 태그 저장
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
      if (editingTag) {
        // 수정 - 태그 타입은 기존 값 유지 (변경 불가)
        const res = await api.put(`/tags/${editingTag.id}`, { name, type: editingTag.type });
        if (res.success) {
          await fetchTags();
          closeDialog();
        } else {
          setFormError(res.error ?? '태그 수정에 실패했습니다.');
        }
      } else {
        // 새로 추가
        const res = await api.post('/tags', { name, type: formType });
        if (res.success) {
          await fetchTags();
          closeDialog();
        } else {
          setFormError(res.error ?? '태그 추가에 실패했습니다.');
        }
      }
    } catch (error) {
      setFormError(`태그 저장 중 오류가 발생했습니다: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // 태그 삭제
  const handleDelete = async () => {
    if (!deletingTag) return;
    setDeleting(true);
    try {
      const res = await api.tags.delete(deletingTag.id);
      if (res.success) {
        await fetchTags();
        setDeletingTag(null);
      }
    } catch (error) {
      console.error('태그 삭제 오류:', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Tag>[] = [
    {
      key: 'name',
      header: '태그명',
      render: (tag) => <span className="font-medium text-gray-900">{tag.name}</span>,
    },
    {
      key: 'type',
      header: '타입',
      render: (tag) => {
        const info = TYPE_BADGE[tag.type];
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
      render: (tag) => (
        <div className="flex justify-end gap-1">
          <IconButton
            aria-label="편집"
            variant="ghost"
            colorPalette="secondary"
            size="sm"
            onClick={() => openEdit(tag)}
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            aria-label="삭제"
            variant="ghost"
            colorPalette="danger"
            size="sm"
            onClick={() => setDeletingTag(tag)}
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
        title="태그 관리"
        action={
          <Button variant="fill" colorPalette="primary" onClick={openCreate}>
            <PlusOutlineIcon size={16} />
            새 태그
          </Button>
        }
      />

      {/* 검색 + 타입 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-72">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="태그명 검색" />
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

      {/* 태그 테이블 */}
      <DataTable
        columns={columns}
        rows={filteredTags}
        rowKey={(tag) => tag.id}
        loading={loading}
        empty="태그가 없습니다."
      />

      {/* 태그 추가/수정 다이얼로그 */}
      <Dialog.Root
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
      >
        <Dialog.Popup>
          <Dialog.Title>{editingTag ? '태그 수정' : '새 태그 추가'}</Dialog.Title>
          <Dialog.Body>
            <div className="space-y-4">
              <Field.Root>
                <Field.Label>태그 타입</Field.Label>
                <Select.Root
                  value={formType}
                  onValueChange={(value) => {
                    if (value) setFormType(value as TagType);
                  }}
                  items={TYPE_OPTIONS}
                  disabled={Boolean(editingTag)}
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
                {editingTag ? (
                  <Field.Description>타입은 변경할 수 없습니다.</Field.Description>
                ) : null}
              </Field.Root>

              <Field.Root>
                <Field.Label>태그명</Field.Label>
                <TextInput
                  value={formName}
                  onValueChange={(value) => {
                    setFormName(value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="태그명을 입력하세요"
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
              {saving ? <Spinner size="md" /> : editingTag ? '수정' : '추가'}
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>

      {/* 태그 삭제 확인 */}
      <ConfirmDialog
        open={Boolean(deletingTag)}
        title="태그 삭제"
        description="이 태그를 삭제하시겠습니까?"
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTag(null)}
      />
    </MainLayout>
  );
}
