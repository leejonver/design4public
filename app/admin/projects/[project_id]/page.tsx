// Design4Public CMS - 프로젝트 상세 페이지

'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, Spinner, Text } from '@vapor-ui/core';
import {
  ChevronLeftOutlineIcon,
  EditOutlineIcon,
  OpenInNewOutlineIcon,
  TrashOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/admin/MainLayout';
import { ConfirmDialog, DataTable, StatusBadge, Thumbnail } from '@/components/admin/ui';
import type { DataTableColumn } from '@/components/admin/ui';
import { api } from '@/lib/admin-api';
import type { Item, Project } from '@/lib/admin-types';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-gray-100 py-2 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <Text typography="body2" className="text-gray-500">
        {label}
      </Text>
      <div className="text-gray-900">{children}</div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.project_id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get<Project>(`/projects/${projectId}`);
        if (response.success) {
          setProject(response.data ?? null);
        }
      } catch (error) {
        console.error('프로젝트 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/projects/${projectId}`);
      if (response.success) {
        router.push('/admin/projects');
      }
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <Text typography="body1" className="text-gray-400">
            프로젝트를 찾을 수 없습니다.
          </Text>
        </div>
      </MainLayout>
    );
  }

  const connectedItems = project.connectedItems ?? [];

  const itemColumns: DataTableColumn<Item>[] = [
    {
      key: 'image',
      header: '이미지',
      render: (item) => {
        const main = item.images?.find((img) => img.isMain) || item.images?.[0];
        return <Thumbnail src={main?.url} alt={main?.alt ?? item.name} className="h-10 w-10 rounded" />;
      },
    },
    {
      key: 'name',
      header: '아이템명',
      render: (item) => (
        <Link href={`/items/${item.id}`} className="font-medium text-v-primary-100 hover:underline">
          {item.name}
        </Link>
      ),
    },
    {
      key: 'brand',
      header: '브랜드',
      render: (item) => <span className="text-gray-700">{item.brand?.name}</span>,
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            colorPalette="secondary"
            size="md"
            onClick={() => router.back()}
          >
            <ChevronLeftOutlineIcon size={16} />
            돌아가기
          </Button>
          <Text typography="heading3" render={<h3 />} className="text-gray-900">
            {project.name}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={`/projects/${project.id}/edit`} />}
            colorPalette="primary"
            variant="fill"
            size="md"
          >
            <EditOutlineIcon size={16} />
            편집
          </Button>
          <Button
            type="button"
            colorPalette="danger"
            variant="outline"
            size="md"
            onClick={() => setConfirmOpen(true)}
          >
            <TrashOutlineIcon size={16} />
            삭제
          </Button>
        </div>
      </div>

      {project.images?.length > 0 ? (
        <Card.Root className="mb-6">
          <Card.Header>
            <Text typography="heading5" render={<h4 />} className="text-gray-900">
              프로젝트 이미지
            </Text>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {project.images.map((image) => (
                <div key={image.id} className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <Thumbnail src={image.url} alt={image.alt} className="h-44 w-full" />
                  </div>
                  {image.isMain ? (
                    <div className="text-center">
                      <Badge colorPalette="warning" size="sm">
                        대표 이미지
                      </Badge>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                프로젝트 정보
              </Text>
            </Card.Header>
            <Card.Body>
              <InfoRow label="프로젝트명">
                <span className="font-medium">{project.name}</span>
              </InfoRow>
              <InfoRow label="설명">
                <p className="whitespace-pre-wrap">{project.description}</p>
              </InfoRow>
              <InfoRow label="클라이언트">{project.client || '-'}</InfoRow>
              <InfoRow label="프로젝트 지역">{project.location}</InfoRow>
              <InfoRow label="완공연도">{project.completionYear}년</InfoRow>
              <InfoRow label="면적">
                {project.area ? `${project.area.toLocaleString()}m²` : '-'}
              </InfoRow>
              <InfoRow label="상태">
                <StatusBadge kind="project" value={project.status} />
              </InfoRow>
              <InfoRow label="문의 URL">
                {project.inquiryUrl ? (
                  <a
                    href={project.inquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-v-primary-100 hover:underline"
                  >
                    <OpenInNewOutlineIcon size={14} />
                    문의하기
                  </a>
                ) : (
                  <span className="text-gray-400">등록되지 않음</span>
                )}
              </InfoRow>
              <InfoRow label="카테고리">
                {project.categories?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {project.categories.map((category) => (
                      <Badge key={category.id} colorPalette="primary" size="sm">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </InfoRow>
              <InfoRow label="태그">
                {project.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag.id} colorPalette="hint" size="sm">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </InfoRow>
              <InfoRow label="등록일">
                {new Date(project.createdAt).toLocaleDateString('ko-KR')}
              </InfoRow>
              <InfoRow label="수정일">
                {new Date(project.updatedAt).toLocaleDateString('ko-KR')}
              </InfoRow>
            </Card.Body>
          </Card.Root>
        </div>

        <div className="lg:col-span-4">
          <Card.Root>
            <Card.Header className="flex items-center justify-between">
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                연결된 아이템 ({connectedItems.length}개)
              </Text>
              {connectedItems.length > 0 ? (
                <Link href="/admin/items" className="text-sm text-v-primary-100 hover:underline">
                  전체보기
                </Link>
              ) : null}
            </Card.Header>
            <Card.Body>
              <DataTable
                columns={itemColumns}
                rows={connectedItems}
                rowKey={(item) => item.id}
                empty="연결된 아이템이 없습니다."
              />
            </Card.Body>
          </Card.Root>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="프로젝트 삭제"
        description="정말로 이 프로젝트를 삭제하시겠습니까?"
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </MainLayout>
  );
}
