// Design4Public CMS - 새 브랜드 추가 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, Card, Field, Select, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { ImageUploader, TagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { ImageData } from '@/types';

const STATUS_LABELS: Record<string, string> = { visible: '노출', hidden: '숨김' };

interface FieldErrors {
  nameKo?: string;
  description?: string;
  websiteUrl?: string;
}

export default function NewBrandPage() {
  const router = useRouter();
  const [nameKo, setNameKo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [status, setStatus] = useState('visible');
  const [tags, setTags] = useState<string[]>([]);
  const [logo, setLogo] = useState<ImageData[]>([]);
  const [cover, setCover] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
        tags,
      };
      const response = await api.post('/brands', body);
      if (response.success) {
        window.location.href = '/brands';
      } else {
        setError(`브랜드 추가 실패: ${response.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('브랜드 추가 오류:', err);
      setError('브랜드 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="outline" colorPalette="secondary" onClick={() => router.back()}>
          <ChevronLeftOutlineIcon size={16} />
          돌아가기
        </Button>
        <Text typography="heading3" render={<h3 />} className="text-gray-900">
          새 브랜드 추가
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
                  <Text typography="body3" className="mt-1 text-red-500">
                    {fieldErrors.nameKo}
                  </Text>
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
                  <Text typography="body3" className="mt-1 text-red-500">
                    {fieldErrors.description}
                  </Text>
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
                  <Text typography="body3" className="mt-1 text-red-500">
                    {fieldErrors.websiteUrl}
                  </Text>
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

              <Field.Root>
                <Field.Label>태그</Field.Label>
                <TagSelect type="brand" value={tags} onChange={setTags} />
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
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? <Spinner size="md" /> : <SaveOutlineIcon size={16} />}
                {loading ? '저장 중...' : '브랜드 저장'}
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
