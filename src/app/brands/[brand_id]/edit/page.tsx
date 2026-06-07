// Design4Public CMS - 브랜드 편집 페이지

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Callout, Card, Field, Select, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { ImageUploader } from '@/components/ui';
import { api } from '@/lib/api';
import type { Brand, ImageData } from '@/types';

const STATUS_LABELS: Record<string, string> = { visible: '노출', hidden: '숨김' };

interface FieldErrors {
  nameKo?: string;
  description?: string;
  websiteUrl?: string;
}

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.brand_id as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [nameKo, setNameKo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [status, setStatus] = useState('visible');
  const [logo, setLogo] = useState<ImageData[]>([]);
  const [cover, setCover] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const fetchBrand = async () => {
      if (!brandId) return;
      try {
        const response = await api.get<Brand>(`/brands/${brandId}`);
        if (response.success && response.data) {
          const data = response.data;
          setBrand(data);
          setNameKo(data.nameKo);
          setNameEn(data.nameEn ?? '');
          setDescription(data.description ?? '');
          setWebsiteUrl(data.websiteUrl ?? '');
          setStatus(data.status ?? 'visible');
          if (data.logoImageUrl) {
            setLogo([{ id: data.logoImageUrl, url: data.logoImageUrl, alt: '', isMain: true }]);
          }
          if (data.coverImageUrl) {
            setCover([{ id: data.coverImageUrl, url: data.coverImageUrl, alt: '', isMain: true }]);
          }
        }
      } catch (err) {
        console.error('브랜드 조회 오류:', err);
        setError('브랜드 정보를 불러오는 데 실패했습니다.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchBrand();
  }, [brandId]);

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!nameKo.trim()) errs.nameKo = '한글 브랜드명을 입력해주세요.';
    if (!description.trim()) errs.description = '브랜드 설명을 입력해주세요.';
    if (websiteUrl.trim()) {
      try {
        new URL(websiteUrl.trim());
      } catch {
        errs.websiteUrl = '올바른 URL을 입력해주세요.';
      }
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError(null);
    try {
      const body = {
        nameKo: nameKo.trim(),
        nameEn: nameEn.trim() || undefined,
        description: description.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        status,
        logoImageUrl: logo[0]?.url ?? null,
        coverImageUrl: cover[0]?.url ?? null,
      };
      const response = await api.put(`/brands/${brandId}`, body);
      if (response.success) {
        // 완전 새로고침으로 이미지 캐시를 무효화한다.
        setTimeout(() => {
          window.location.href = '/brands';
        }, 500);
      } else {
        setError(`브랜드 수정 실패: ${response.error || '알 수 없는 오류'}`);
        setLoading(false);
      }
    } catch (err) {
      console.error('브랜드 수정 오류:', err);
      setError('브랜드 수정 중 오류가 발생했습니다.');
      setLoading(false);
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
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
          <ChevronLeftOutlineIcon size={16} />
          돌아가기
        </Button>
        <Text typography="heading3" render={<h3 />} className="text-gray-900">
          브랜드 편집: {brand.nameKo}
        </Text>
      </div>

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card.Root>
            <Card.Header>
              <Text typography="heading6" className="text-gray-900">
                기본 정보
              </Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>브랜드명 (한글)</Field.Label>
                <TextInput value={nameKo} onValueChange={setNameKo} placeholder="예: 허먼밀러" />
                {fieldErrors.nameKo ? (
                  <Field.Error match>{fieldErrors.nameKo}</Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root>
                <Field.Label>브랜드명 (영문)</Field.Label>
                <TextInput value={nameEn} onValueChange={setNameEn} placeholder="예: Herman Miller" />
              </Field.Root>

              <Field.Root>
                <Field.Label>브랜드 설명</Field.Label>
                <Textarea
                  value={description}
                  onValueChange={setDescription}
                  rows={4}
                  placeholder="브랜드에 대한 자세한 설명을 입력하세요"
                />
                {fieldErrors.description ? (
                  <Field.Error match>{fieldErrors.description}</Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root>
                <Field.Label>브랜드 웹사이트 URL</Field.Label>
                <TextInput
                  type="url"
                  value={websiteUrl}
                  onValueChange={setWebsiteUrl}
                  placeholder="https://example.com"
                />
                {fieldErrors.websiteUrl ? (
                  <Field.Error match>{fieldErrors.websiteUrl}</Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root>
                <Field.Label>노출 상태</Field.Label>
                <Select.Root
                  value={status}
                  onValueChange={(v) => setStatus((v ?? 'visible') as 'visible' | 'hidden')}
                >
                  <Select.Trigger className="w-40">
                    <Select.ValuePrimitive>
                      {(value: unknown) => STATUS_LABELS[String(value)] ?? '노출'}
                    </Select.ValuePrimitive>
                  </Select.Trigger>
                  <Select.Popup>
                    <Select.Item value="visible">노출</Select.Item>
                    <Select.Item value="hidden">숨김</Select.Item>
                  </Select.Popup>
                </Select.Root>
              </Field.Root>
            </Card.Body>
          </Card.Root>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card.Root>
            <Card.Header>
              <Text typography="heading6" className="text-gray-900">
                이미지
              </Text>
            </Card.Header>
            <Card.Body className="space-y-6">
              <div>
                <Text typography="body2" render={<p />} className="mb-2 text-gray-700">
                  로고 이미지
                </Text>
                <ImageUploader value={logo} onChange={setLogo} folder="brands" multiple={false} />
                <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                  1:1 비율의 이미지를 권장합니다.
                </Text>
              </div>
              <div>
                <Text typography="body2" render={<p />} className="mb-2 text-gray-700">
                  커버 이미지
                </Text>
                <ImageUploader value={cover} onChange={setCover} folder="brands" multiple={false} />
                <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                  2:1 비율의 이미지를 권장합니다.
                </Text>
              </div>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body className="space-y-2">
              <Button
                colorPalette="primary"
                variant="fill"
                size="md"
                className="w-full"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? <Spinner size="md" /> : <SaveOutlineIcon size={16} />}
                {loading ? '저장 중...' : '변경사항 저장'}
              </Button>
              <Button
                variant="outline"
                colorPalette="secondary"
                className="w-full"
                disabled={loading}
                onClick={() => router.back()}
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
