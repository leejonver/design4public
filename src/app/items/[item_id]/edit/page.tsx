// Design4Public CMS - 아이템 편집 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Callout, Card, Field, Select, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, ImageUploader, CategorySelect, FreeTagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { Brand, ImageData, Item, ItemStatus } from '@/types';

const STATUS_OPTIONS = [
  { label: '구입가능', value: 'available' },
  { label: '단종', value: 'discontinued' },
  { label: '숨김', value: 'hidden' },
] as const;

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.item_id as string;

  const [item, setItem] = useState<Item | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mallUrl, setMallUrl] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState<ItemStatus>('available');
  const [images, setImages] = useState<ImageData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const populate = (it: Item) => {
    setName(it.name);
    setDescription(it.description);
    setMallUrl(it.mallUrl ?? '');
    setBrandId(it.brand?.id ?? '');
    setStatus(it.status);
    setImages(it.images ?? []);
    setCategories(it.categories?.map((category) => category.id) ?? []);
    setTags(it.tags?.map((tag) => tag.name) ?? []);
  };

  useEffect(() => {
    api.brands.getList({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        const data = res.data as { items?: Brand[] } | Brand[];
        setBrands(Array.isArray(data) ? data : data.items ?? []);
      }
    });
  }, []);

  useEffect(() => {
    if (!itemId) return;
    const fetchItem = async () => {
      try {
        const res = await api.get<Item>(`/items/${itemId}`);
        if (res.success && res.data) {
          setItem(res.data);
          populate(res.data);
        }
      } catch (e) {
        console.error('아이템 조회 오류:', e);
      } finally {
        setDataLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

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
    const res = await api.put(`/items/${itemId}`, {
      name: name.trim(),
      description: description.trim(),
      mallUrl: mallUrl.trim() || null,
      brandId,
      status,
      images,
      categories,
      tags,
    });
    setSaving(false);

    if (res.success) {
      router.push(`/items/${itemId}`);
    } else {
      setError(res.error || '아이템 수정에 실패했습니다.');
    }
  };

  if (dataLoading) {
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

  return (
    <MainLayout>
      <PageHeader
        title={`아이템 편집: ${item.name}`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" colorPalette="secondary" onClick={() => populate(item)}>
              초기값으로 리셋
            </Button>
            <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
              <ChevronLeftOutlineIcon size={16} />돌아가기
            </Button>
          </div>
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
              <ImageUploader value={images} onChange={setImages} folder="items" multiple max={5} />
              <Text typography="body3" render={<p />} className="mt-2 text-gray-500">
                최대 5장까지 업로드 가능합니다. 첫 번째 이미지가 대표 이미지로 설정됩니다.
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
                {saving ? '저장 중...' : '변경사항 저장'}
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
