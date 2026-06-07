// Design4Public CMS - 프로젝트 리스트 페이지

'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Callout, Card, IconButton } from '@vapor-ui/core';
import {
  EditOutlineIcon,
  PlusOutlineIcon,
  TrashOutlineIcon,
  ViewOnOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterSelect,
  ListToolbar,
  PageHeader,
  Pagination,
  StatusBadge,
  SuccessCallout,
  Thumbnail,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { useListController } from '@/lib/use-list-controller';
import type { ListFetchParams, ListResult } from '@/lib/use-list-controller';
import { api } from '@/lib/api';
import type { Project } from '@/types';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시됨' },
  { value: 'hidden', label: '숨김' },
];

// 정렬 옵션은 서버 화이트리스트(created_at | title | year)와 1:1로 매핑된다.
const SORT_OPTIONS = [
  { value: 'created_at:desc', label: '최신순' },
  { value: 'title:asc', label: '이름순' },
  { value: 'year:desc', label: '연도순' },
];

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(
    async (params: ListFetchParams): Promise<ListResult<Project>> => {
      const response = await api.projects.getList({
        status: typeof params.status === 'string' ? params.status : undefined,
        search: params.search || undefined,
        sort: params.sort,
        dir: params.dir,
        page: params.page,
        limit: params.limit,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || '프로젝트 목록을 불러오지 못했습니다.');
      }
      const data = response.data as { items: Project[]; total: number };
      return { items: data.items, total: data.total };
    },
    [],
  );

  const {
    items: projects,
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
  } = useListController<Project>({
    fetch: fetchProjects,
    initialFilters: { status: 'all' },
    initialSort: { key: 'created_at', dir: 'desc' },
    limit: PAGE_SIZE,
  });

  const sortValue = sort ? `${sort.key}:${sort.dir}` : '';

  const handleSortChange = (value: string) => {
    const [key, dir] = value.split(':');
    setSort({ key, dir: dir === 'asc' ? 'asc' : 'desc' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      const response = await api.projects.delete(deleteTarget.id);
      if (response.success) {
        setDeleteTarget(null);
        setSuccess('프로젝트가 삭제되었습니다.');
        refetch();
      } else {
        setActionError(response.error || '프로젝트 삭제에 실패했습니다.');
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('프로젝트 삭제 오류:', err);
      setActionError('프로젝트 삭제 중 오류가 발생했습니다.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<Project>[] = [
    {
      key: 'image',
      header: '대표이미지',
      width: 'w-24',
      nowrap: true,
      render: (project) => {
        const mainImage = project.images?.find((img) => img.isMain) || project.images?.[0];
        return (
          <Thumbnail
            src={mainImage?.url}
            alt={mainImage?.alt || project.name}
            className="h-16 w-16 rounded"
          />
        );
      },
    },
    {
      key: 'title',
      header: '프로젝트명',
      sortable: true,
      render: (project) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900">{project.name}</div>
          {project.description ? (
            <div className="mt-0.5 truncate text-xs text-gray-500">{project.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'location',
      header: '지역',
      width: 'w-32',
      render: (project) => <span className="text-gray-700">{project.location || '-'}</span>,
    },
    {
      key: 'year',
      header: '연도',
      width: 'w-24',
      nowrap: true,
      sortable: true,
      render: (project) => (
        <span className="text-gray-700">
          {project.completionYear ? `${project.completionYear}년` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: 'w-24',
      nowrap: true,
      render: (project) => <StatusBadge kind="project" value={project.status} />,
    },
    {
      key: 'categories',
      header: '카테고리',
      width: 'w-48',
      render: (project) =>
        project.categories.length === 0 ? (
          <span className="text-gray-400">-</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {project.categories.slice(0, 2).map((category) => (
              <Badge key={category.id} colorPalette="hint" size="sm">
                {category.name}
              </Badge>
            ))}
            {project.categories.length > 2 ? (
              <Badge colorPalette="hint" size="sm">
                +{project.categories.length - 2}
              </Badge>
            ) : null}
          </div>
        ),
    },
    {
      key: 'actions',
      header: '작업',
      width: 'w-32',
      align: 'right',
      nowrap: true,
      render: (project) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            render={<Link href={`/projects/${project.id}`} />}
            aria-label="상세보기"
            size="sm"
            variant="ghost"
            colorPalette="secondary"
          >
            <ViewOnOutlineIcon size={16} />
          </IconButton>
          <IconButton
            render={<Link href={`/projects/${project.id}/edit`} />}
            aria-label="편집"
            size="sm"
            variant="ghost"
            colorPalette="secondary"
          >
            <EditOutlineIcon size={16} />
          </IconButton>
          <IconButton
            type="button"
            aria-label="삭제"
            size="sm"
            variant="ghost"
            colorPalette="danger"
            onClick={() => setDeleteTarget(project)}
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
        title="프로젝트 관리"
        action={
          <Button
            render={<Link href="/projects/new" />}
            colorPalette="primary"
            variant="fill"
            size="md"
          >
            <PlusOutlineIcon size={16} />
            새 프로젝트
          </Button>
        }
      />

      {error || actionError ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error || actionError}
        </Callout.Root>
      ) : null}

      <SuccessCallout message={success} onClose={() => setSuccess(null)} />

      <Card.Root>
        <Card.Body>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="프로젝트명 또는 설명 검색"
            filters={
              <FilterSelect
                value={filters.status ?? 'all'}
                onValueChange={(value) => setFilter('status', value)}
                options={STATUS_OPTIONS}
                placeholder="전체"
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

          <DataTable
            columns={columns}
            rows={projects}
            rowKey={(project) => project.id}
            loading={loading}
            sortKey={sort?.key}
            sortDir={sort?.dir}
            onSortChange={toggleSort}
            empty={
              <EmptyState
                title="프로젝트가 없습니다."
                description="검색 조건을 변경하거나 새 프로젝트를 추가해 보세요."
              />
            }
          />

          {total > 0 ? (
            <div className="mt-4">
              <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
            </div>
          ) : null}
        </Card.Body>
      </Card.Root>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="프로젝트 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
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
