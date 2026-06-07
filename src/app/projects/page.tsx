// Design4Public CMS - 프로젝트 리스트 페이지

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Callout, Card, IconButton, Select } from '@vapor-ui/core';
import {
  EditOutlineIcon,
  ImageOutlineIcon,
  PlusOutlineIcon,
  TrashOutlineIcon,
  ViewOnOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import {
  ConfirmDialog,
  DataTable,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { api } from '@/lib/api';
import type { Project, ProjectStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: 'all', label: '모든 상태' },
  { value: 'published', label: '게시' },
  { value: 'draft', label: '초안' },
  { value: 'hidden', label: '숨김' },
];

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ items: Project[] }>('/projects');
      if (response.success) {
        setProjects(response.data?.items || []);
      } else {
        setError('프로젝트 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('프로젝트 목록 로딩 오류:', err);
      setError('프로젝트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 검색/필터가 바뀌면 첫 페이지로 이동
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/projects/${deleteTarget.id}`);
      if (response.success) {
        setDeleteTarget(null);
        fetchProjects();
      } else {
        setError(response.error || '프로젝트 삭제에 실패했습니다.');
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('프로젝트 삭제 오류:', err);
      setError('프로젝트 삭제 중 오류가 발생했습니다.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      project.name.toLowerCase().includes(term) ||
      (project.location && project.location.toLowerCase().includes(term)) ||
      (project.description && project.description.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pagedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataTableColumn<Project>[] = [
    {
      key: 'image',
      header: '대표이미지',
      render: (project) => {
        const mainImage = project.images?.find((img) => img.isMain) || project.images?.[0];
        return mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage.url}
            alt={mainImage.alt}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
            <ImageOutlineIcon size={18} className="text-gray-400" />
          </div>
        );
      },
    },
    {
      key: 'name',
      header: '프로젝트명',
      render: (project) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900">{project.name}</div>
          <div className="mt-0.5 truncate text-xs text-gray-500">
            {project.description?.substring(0, 50)}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: '지역',
      render: (project) => <span className="text-gray-700">{project.location}</span>,
    },
    {
      key: 'completionYear',
      header: '연도',
      render: (project) => (
        <div className="text-gray-700">
          <div>{project.completionYear}년</div>
          {project.area ? (
            <div className="text-xs text-gray-500">{project.area.toLocaleString()}m²</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (project) => <StatusBadge kind="project" value={project.status} />,
    },
    {
      key: 'tags',
      header: '태그',
      render: (project) => (
        <div className="flex flex-wrap gap-1">
          {project.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} colorPalette="hint" size="sm">
              {tag.name}
            </Badge>
          ))}
          {project.tags.length > 2 ? (
            <Badge colorPalette="hint" size="sm">
              +{project.tags.length - 2}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      align: 'right',
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

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <Card.Root>
        <Card.Body>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="w-72 max-w-full">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="프로젝트명, 지역 또는 설명 검색"
              />
            </div>
            <div className="w-40">
              <Select.Root
                items={STATUS_OPTIONS}
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'all')}
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
          </div>

          <DataTable
            columns={columns}
            rows={pagedProjects}
            rowKey={(project) => project.id}
            loading={loading}
            empty="프로젝트가 없습니다."
          />

          {filteredProjects.length > 0 ? (
            <div className="mt-4">
              <Pagination
                page={page}
                total={filteredProjects.length}
                limit={PAGE_SIZE}
                onPageChange={setPage}
              />
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
