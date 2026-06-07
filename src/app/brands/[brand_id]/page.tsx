// Design4Public CMS - 브랜드 상세 페이지

'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Spinner, Text } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, EditOutlineIcon, LinkOutlineIcon, BookmarkOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { Thumbnail } from '@/components/ui';
import { api } from '@/lib/api';
import type { Brand } from '@/types';

// 이미지 URL에 캐시 무효화를 위한 타임스탬프 추가
function addCacheBuster(url: string | null | undefined, updatedAt?: string): string | undefined {
  if (!url) return undefined;
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
      <div className="w-32 shrink-0 text-sm font-medium text-gray-500">{label}</div>
      <div className="flex-1 text-sm text-gray-900">{children}</div>
    </div>
  );
}

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brand_id as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await api.get<Brand>(`/brands/${brandId}`);
        if (response.success && response.data) {
          setBrand(response.data);
        }
      } catch (err) {
        console.error('브랜드 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    if (brandId) fetchBrand();
  }, [brandId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!brand) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <Text typography="body1" className="text-gray-400">
            브랜드를 찾을 수 없습니다.
          </Text>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
            <ChevronLeftOutlineIcon size={16} />
            돌아가기
          </Button>
          <Text typography="heading3" render={<h3 />} className="text-gray-900">
            {brand.nameKo}
          </Text>
        </div>
        <Button
          colorPalette="primary"
          variant="fill"
          onClick={() => router.push(`/brands/${brand.id}/edit`)}
        >
          <EditOutlineIcon size={16} />
          편집
        </Button>
      </div>

      {brand.coverImageUrl ? (
        <Card.Root className="mb-6 overflow-hidden">
          <Thumbnail
            src={addCacheBuster(brand.coverImageUrl, brand.updatedAt)}
            alt={`${brand.nameKo} 커버 이미지`}
            className="h-72 w-full"
          />
        </Card.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" className="text-gray-900">
                브랜드 로고
              </Text>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-col items-center py-4">
                <Thumbnail
                  src={addCacheBuster(brand.logoImageUrl, brand.updatedAt)}
                  alt={`${brand.nameKo} 로고`}
                  className="h-32 w-32 rounded-full"
                  icon={<BookmarkOutlineIcon size={48} />}
                />
                <Text typography="heading4" render={<h4 />} className="mt-4 text-gray-900">
                  {brand.nameKo}
                </Text>
                {brand.nameEn ? (
                  <Text typography="body2" className="text-gray-500">
                    {brand.nameEn}
                  </Text>
                ) : null}
              </div>
            </Card.Body>
          </Card.Root>
        </div>

        <div className="lg:col-span-8">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" className="text-gray-900">
                브랜드 정보
              </Text>
            </Card.Header>
            <Card.Body>
              <div className="divide-y divide-gray-200 rounded-md border border-gray-200">
                <InfoRow label="브랜드명">
                  <span className="font-medium">{brand.nameKo}</span>
                  {brand.nameEn ? <div className="mt-1 text-gray-500">{brand.nameEn}</div> : null}
                </InfoRow>
                <InfoRow label="브랜드 설명">{brand.description || '-'}</InfoRow>
                <InfoRow label="웹사이트">
                  {brand.websiteUrl ? (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-v-primary-100 hover:underline"
                    >
                      <LinkOutlineIcon size={14} />
                      {brand.websiteUrl}
                    </a>
                  ) : (
                    <span className="text-gray-400">등록되지 않음</span>
                  )}
                </InfoRow>
                <InfoRow label="등록일">
                  {new Date(brand.createdAt).toLocaleDateString('ko-KR')}
                </InfoRow>
                <InfoRow label="수정일">
                  {new Date(brand.updatedAt).toLocaleDateString('ko-KR')}
                </InfoRow>
              </div>
            </Card.Body>
          </Card.Root>
        </div>
      </div>

      <Card.Root className="mt-6">
        <Card.Header>
          <Text typography="heading5" className="text-gray-900">
            추가 정보
          </Text>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Text typography="body3" render={<p />} className="text-gray-500">
                등록 ID
              </Text>
              <div className="text-sm text-gray-900">{brand.id}</div>
            </div>
            <div>
              <Text typography="body3" render={<p />} className="text-gray-500">
                최종 수정일시
              </Text>
              <div className="text-sm text-gray-900">
                {new Date(brand.updatedAt).toLocaleString('ko-KR')}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card.Root>
    </MainLayout>
  );
}
