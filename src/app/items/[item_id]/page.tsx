// Design4Public CMS - 아이템 상세 페이지

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { Badge, Button, Card, Spinner, Text } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, EditOutlineIcon, LinkOutlineIcon, DashboardOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import type { Item } from '@/types';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 py-3">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800">{children}</dd>
    </div>
  );
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.item_id as string;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    api
      .get<Item>(`/items/${itemId}`)
      .then((res) => {
        if (res.success && res.data) setItem(res.data);
      })
      .catch((e) => console.error('아이템 조회 오류:', e))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!item) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <Text typography="body1" className="text-gray-400">
            아이템을 찾을 수 없습니다.
          </Text>
        </div>
      </MainLayout>
    );
  }

  const mainImage = item.images?.find((img) => img.isMain) ?? item.images?.[0];
  const otherImages = (item.images ?? []).filter((img) => img !== mainImage);
  const brand = item.brand;

  return (
    <MainLayout>
      <PageHeader
        title={item.name}
        action={
          <div className="flex gap-2">
            <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
              <ChevronLeftOutlineIcon size={16} />돌아가기
            </Button>
            <Button
              variant="fill"
              colorPalette="primary"
              onClick={() => router.push(`/items/${item.id}/edit`)}
            >
              <EditOutlineIcon size={16} />편집
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5">아이템 이미지</Text>
            </Card.Header>
            <Card.Body>
              {mainImage ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainImage.url}
                    alt={mainImage.alt}
                    className="h-72 w-full rounded-md object-cover"
                  />
                  {otherImages.length > 0 ? (
                    <div>
                      <Text typography="body2" render={<p />} className="font-medium text-gray-700">
                        추가 이미지
                      </Text>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {otherImages.map((img) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={img.id}
                            src={img.url}
                            alt={img.alt}
                            className="h-20 w-20 rounded object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-md bg-gray-50">
                  <DashboardOutlineIcon size={48} className="text-gray-300" />
                  <Text typography="body2" className="text-gray-400">
                    이미지 없음
                  </Text>
                </div>
              )}
            </Card.Body>
          </Card.Root>
        </div>

        <div className="lg:col-span-3">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5">아이템 정보</Text>
            </Card.Header>
            <Card.Body>
              <dl className="divide-y divide-gray-100">
                <InfoRow label="아이템명">
                  <span className="font-medium text-gray-900">{item.name}</span>
                </InfoRow>
                <InfoRow label="설명">
                  <p className="whitespace-pre-wrap text-gray-700">{item.description}</p>
                </InfoRow>
                <InfoRow label="브랜드">
                  {brand ? (
                    <button type="button" onClick={() => router.push(`/brands/${brand.id}`)}>
                      <Badge colorPalette="hint" size="md">
                        {brand.name}
                      </Badge>
                    </button>
                  ) : (
                    <span className="text-gray-400">등록되지 않음</span>
                  )}
                </InfoRow>
                <InfoRow label="상태">
                  <StatusBadge kind="item" value={item.status} />
                </InfoRow>
                <InfoRow label="나라장터 URL">
                  {item.mallUrl ? (
                    <a
                      href={item.mallUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <LinkOutlineIcon size={16} />
                      나라장터에서 보기
                    </a>
                  ) : (
                    <span className="text-gray-400">등록되지 않음</span>
                  )}
                </InfoRow>
                <InfoRow label="카테고리">
                  <div className="flex flex-wrap gap-1">
                    {item.categories?.length ? (
                      item.categories.map((category) => (
                        <Badge key={category.id} colorPalette="primary" size="sm">
                          {category.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </InfoRow>
                <InfoRow label="태그">
                  <div className="flex flex-wrap gap-1">
                    {item.tags?.length ? (
                      item.tags.map((tag) => (
                        <Badge key={tag.id} colorPalette="hint" size="sm">
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </InfoRow>
                <InfoRow label="등록일">
                  {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                </InfoRow>
                <InfoRow label="수정일">
                  {new Date(item.updatedAt).toLocaleDateString('ko-KR')}
                </InfoRow>
              </dl>
            </Card.Body>
          </Card.Root>
        </div>
      </div>

      {brand ? (
        <Card.Root className="mt-6">
          <Card.Header className="flex items-center justify-between">
            <Text typography="heading5">브랜드 정보</Text>
            <Button
              variant="ghost"
              colorPalette="primary"
              size="sm"
              onClick={() => router.push(`/brands/${brand.id}`)}
            >
              브랜드 상세보기
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center gap-4">
              {brand.logoImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoImageUrl}
                  alt={`${brand.name} 로고`}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <DashboardOutlineIcon size={20} className="text-gray-300" />
                </div>
              )}
              <div className="min-w-0">
                <Text typography="body1" render={<p />} className="font-medium text-gray-900">
                  {brand.name}
                </Text>
                <Text typography="body2" render={<p />} className="mt-0.5 text-gray-500">
                  {brand.description}
                </Text>
              </div>
            </div>
          </Card.Body>
        </Card.Root>
      ) : null}
    </MainLayout>
  );
}
