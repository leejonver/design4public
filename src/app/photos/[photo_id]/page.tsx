// Design4Public CMS - 사진 상세보기 페이지

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Callout, Card, Spinner, Text } from '@vapor-ui/core';
import {
  ChevronLeftOutlineIcon,
  EditOutlineIcon,
  TrashOutlineIcon,
  LinkOutlineIcon,
  PriceOutlineIcon,
  FolderOutlineIcon,
  ImageOutlineIcon,
  CalendarOutlineIcon,
} from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { ConfirmDialog } from '@/components/ui';
import { api } from '@/lib/api';
import type { Photo } from '@/types';

interface UsedProject {
  id: string;
  title: string;
}

type PhotoWithUsage = Photo & { usedInProjects?: UsedProject[] };

export default function PhotoDetailPage() {
  const params = useParams();
  const photo_id = params.photo_id as string;
  const router = useRouter();

  const [photo, setPhoto] = useState<PhotoWithUsage | null>(null);
  const [usedInProjects, setUsedInProjects] = useState<UsedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<PhotoWithUsage>(`/photos/${photo_id}`);
        if (res.success && res.data) {
          setPhoto(res.data);
          if (res.data.usedInProjects) setUsedInProjects(res.data.usedInProjects);
        } else {
          setError('사진을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('사진 로딩 오류:', err);
        setError('사진을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPhoto();
  }, [photo_id]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await api.delete(`/photos/${photo_id}`);
      if (res.success) {
        router.push('/photos');
      } else {
        setError(res.error ?? '사진 삭제에 실패했습니다.');
        setConfirmOpen(false);
      }
    } catch (err) {
      console.error('사진 삭제 오류:', err);
      setError('사진 삭제 중 오류가 발생했습니다.');
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
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

  if (!photo) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <Text typography="body1" className="text-gray-500">
            사진을 찾을 수 없습니다
          </Text>
          <Button variant="outline" colorPalette="secondary" onClick={() => router.push('/photos')}>
            사진 목록으로
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" colorPalette="secondary" onClick={() => router.push('/photos')}>
            <ChevronLeftOutlineIcon size={16} />
            돌아가기
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <ImageOutlineIcon size={22} className="shrink-0 text-gray-500" />
            <Text typography="heading3" render={<h3 />} className="truncate text-gray-900">
              {photo.title || '제목 없는 사진'}
            </Text>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            colorPalette="secondary"
            onClick={() => router.push(`/photos/${photo_id}/edit`)}
          >
            <EditOutlineIcon size={16} />
            편집
          </Button>
          <Button variant="outline" colorPalette="danger" onClick={() => setConfirmOpen(true)}>
            <TrashOutlineIcon size={16} />
            삭제
          </Button>
        </div>
      </div>

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 사진 이미지 */}
        <Card.Root>
          <Card.Body>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt={photo.altText || '사진'}
              className="w-full rounded-lg object-cover"
            />
          </Card.Body>
        </Card.Root>

        {/* 사진 정보 */}
        <div className="space-y-6">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                사진 정보
              </Text>
            </Card.Header>
            <Card.Body>
              <dl className="divide-y divide-gray-100">
                <div className="flex gap-4 py-2">
                  <dt className="w-24 shrink-0 text-sm font-medium text-gray-500">제목</dt>
                  <dd className="text-sm text-gray-900">{photo.title || '-'}</dd>
                </div>
                <div className="flex gap-4 py-2">
                  <dt className="w-24 shrink-0 text-sm font-medium text-gray-500">대체 텍스트</dt>
                  <dd className="text-sm text-gray-900">{photo.altText || '-'}</dd>
                </div>
                <div className="flex gap-4 py-2">
                  <dt className="w-24 shrink-0 text-sm font-medium text-gray-500">설명</dt>
                  <dd className="text-sm text-gray-900">{photo.description || '-'}</dd>
                </div>
                <div className="flex gap-4 py-2">
                  <dt className="w-24 shrink-0 text-sm font-medium text-gray-500">등록일</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-gray-900">
                    <CalendarOutlineIcon size={14} className="text-gray-400" />
                    {new Date(photo.createdAt).toLocaleDateString('ko-KR')}
                  </dd>
                </div>
              </dl>
            </Card.Body>
          </Card.Root>

          {/* 연결된 아이템 */}
          <Card.Root>
            <Card.Header>
              <div className="flex items-center gap-2">
                <LinkOutlineIcon size={18} className="text-gray-500" />
                <Text typography="heading5" render={<h4 />} className="text-gray-900">
                  연결된 아이템
                </Text>
              </div>
            </Card.Header>
            <Card.Body>
              {photo.connectedItems && photo.connectedItems.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {photo.connectedItems.map((item) => {
                    const thumb = item.images?.find((img) => img.isMain) ?? item.images?.[0];
                    return (
                      <li key={item.id} className="flex items-center gap-3 py-2">
                        {thumb?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb.url} alt="" className="h-9 w-9 rounded object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded bg-gray-100">
                            <ImageOutlineIcon size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="truncate text-xs text-gray-500">{item.brand?.name || '-'}</div>
                        </div>
                        <Button
                          variant="ghost"
                          colorPalette="primary"
                          size="sm"
                          onClick={() => router.push(`/items/${item.id}`)}
                        >
                          보기
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Text typography="body3" className="text-gray-400">
                  연결된 아이템이 없습니다
                </Text>
              )}
            </Card.Body>
          </Card.Root>

          {/* 태그 */}
          <Card.Root>
            <Card.Header>
              <div className="flex items-center gap-2">
                <PriceOutlineIcon size={18} className="text-gray-500" />
                <Text typography="heading5" render={<h4 />} className="text-gray-900">
                  태그
                </Text>
              </div>
            </Card.Header>
            <Card.Body>
              {photo.tags && photo.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <Badge key={tag.id} colorPalette="primary" size="md">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Text typography="body3" className="text-gray-400">
                  태그 없음
                </Text>
              )}
            </Card.Body>
          </Card.Root>

          {/* 사용된 프로젝트 */}
          <Card.Root>
            <Card.Header>
              <div className="flex items-center gap-2">
                <FolderOutlineIcon size={18} className="text-gray-500" />
                <Text typography="heading5" render={<h4 />} className="text-gray-900">
                  사용된 프로젝트
                </Text>
              </div>
            </Card.Header>
            <Card.Body>
              {usedInProjects.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {usedInProjects.map((project) => (
                    <li key={project.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate text-sm text-gray-900">{project.title}</span>
                      <Button
                        variant="ghost"
                        colorPalette="primary"
                        size="sm"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        보기
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text typography="body3" className="text-gray-400">
                  아직 프로젝트에서 사용되지 않았습니다
                </Text>
              )}
            </Card.Body>
          </Card.Root>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="사진 삭제"
        description="이 사진을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </MainLayout>
  );
}
