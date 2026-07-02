// Design4Public CMS - 새 아이템 추가 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, Card, Field, Select, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, PhotoUploader, CategorySelect, FreeTagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { Brand, ImageData, ItemStatus } from '@/types';

const STATUS_OPTIONS = [
  { label: '구입가능', value: 'available' },
  { label: '단종', value: 'discontinued' },
  { label: '숨김', value: 'hidden' },
] as const;

export default function NewItemPage() {
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mallUrl, setMallUrl] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<ItemStatus>('available');
  const [photos, setPhotos] = useState<ImageData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.brands.getList({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        const data = res.data as { items?: Brand[] } | Brand[];
        setBrands(Array.isArray(data) ? data : data.items ?? []);
      }
    });
  }, []);

  const brandOptions = brands.map((brand) => ({ label: brand.name, value: brand.id }));

  const handleSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('아이템명을 입력해주세요. (2-100자)');
      return;
    }
    if (description.trim().length < 10) {
      setError('아이템 설명을 입력해주세요. (10-1000자)');
      return;
    }
    if (mallUrl.trim()) {
      try {
        new URL(mallUrl.trim());
      } catch {
        setError('올바른 URL을 입력해주세요.');
        return;
      }
    }
    if (!brandId) {
      setError('브랜드를 선택해주세요.');
      return;
    }
    if (tags.length === 0) {
      setError('최소 1개의 태그를 선택해주세요.');
      return;
    }

    setSaving(true);
    const res = await api.post('/items', {
      name: name.trim(),
      description: description.trim(),
      mallUrl: mallUrl.trim() || null,
      brandId,
      status,
      images: photos.map((p, i) => ({ url: p.url, title: p.title, isMain: p.isMain, order: i })),
      categories,
      tags,
    });
    setSaving(false);

    if (res.success) {
      router.push('/items');
    } else {
      setError(res.error || '아이템 추가에 실패했습니다.');
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="새 아이템 추가"
        action={
          <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
            <ChevronLeftOutlineIcon size={16} />돌아가기
          </Button>
        }
      />

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5">기본 정보</Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>아이템명</Field.Label>
                <TextInput
                  value={name}
                  onValueChange={setName}
                  placeholder="아이템명을 입력하세요"
                  maxLength={100}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>아이템 설명</Field.Label>
                <Textarea
                  value={description}
                  onValueChange={setDescription}
                  placeholder="아이템에 대한 자세한 설명을 입력하세요"
                  rows={4}
                  maxLength={1000}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>나라장터 URL</Field.Label>
                <TextInput
                  type="url"
                  value={mallUrl}
                  onValueChange={setMallUrl}
                  placeholder="https://mall.g2b.go.kr/..."
                />
              </Field.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading5">아이템 이미지</Text>
            </Card.Header>
            <Card.Body>
              <PhotoUploader value={photos} onChange={setPhotos} folder="items" max={5} />
              <Text typography="body3" render={<p />} className="mt-2 text-gray-500">
                최대 5장까지 업로드할 수 있으며, 각 사진의 제목과 대표 사진, 순서를 지정할 수 있습니다.
              </Text>
            </Card.Body>
          </Card.Root>
        </div>

        <div className="space-y-6">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5">분류 및 상태</Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>브랜드</Field.Label>
                <Select.Root
                  items={brandOptions}
                  value={brandId || null}
                  onValueChange={(v) => setBrandId(v ?? '')}
                  placeholder={brands.length === 0 ? '로딩 중...' : '브랜드를 선택하세요'}
                >
                  <Select.Trigger className="w-full" />
                  <Select.Popup>
                    {brands.map((brand) => (
                      <Select.Item key={brand.id} value={brand.id}>
                        {brand.name}
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>카테고리</Field.Label>
                <CategorySelect type="item" value={categories} onChange={setCategories} />
              </Field.Root>

              <Field.Root>
                <Field.Label>태그</Field.Label>
                <FreeTagSelect value={tags} onChange={setTags} />
              </Field.Root>

              <Field.Root>
                <Field.Label>상태</Field.Label>
                <Select.Root
                  items={STATUS_OPTIONS}
                  value={status}
                  onValueChange={(v) => setStatus(v ?? 'available')}
                  placeholder="상태 선택"
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
              </Field.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body className="space-y-2">
              <Button
                variant="fill"
                colorPalette="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <Spinner size="md" /> : <SaveOutlineIcon size={16} />}
                {saving ? '저장 중...' : '아이템 저장'}
              </Button>
              <Button
                variant="outline"
                colorPalette="secondary"
                className="w-full"
                onClick={() => router.back()}
                disabled={saving}
              >
                취소
              </Button>
            </Card.Body>
          </Card.Root>
        </div>
      </div>
    </MainLayout>
  );
}
