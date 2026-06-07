// Design4Public CMS - 새 프로젝트 추가 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Callout,
  Card,
  Field,
  Select,
  Spinner,
  Text,
  TextInput,
  Textarea,
} from '@vapor-ui/core';
import { ChevronLeftOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { EntityPicker, TagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { ProjectStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시' },
  { value: 'hidden', label: '숨김' },
];

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [completionYear, setCompletionYear] = useState(String(new Date().getFullYear()));
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [inquiryUrl, setInquiryUrl] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [connectedItems, setConnectedItems] = useState<string[]>([]);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [mainPhotoId, setMainPhotoId] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = '프로젝트명을 입력해주세요.';
    else if (name.trim().length < 2 || name.trim().length > 100)
      next.name = '프로젝트명은 2-100자 사이여야 합니다.';

    if (!description.trim()) next.description = '프로젝트 설명을 입력해주세요.';
    else if (description.trim().length < 10 || description.trim().length > 1000)
      next.description = '설명은 10-1000자 사이여야 합니다.';

    if (!location.trim()) next.location = '프로젝트 지역을 입력해주세요.';

    if (!completionYear.trim() || Number.isNaN(Number(completionYear)))
      next.completionYear = '완공연도를 입력해주세요.';

    if (inquiryUrl.trim() && !isValidUrl(inquiryUrl.trim()))
      next.inquiryUrl = '올바른 URL을 입력해주세요.';

    if (photoIds.length === 0) next.photos = '최소 1장의 사진을 선택해주세요.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const effectiveMain = photoIds.includes(mainPhotoId) ? mainPhotoId : photoIds[0];
      const body = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        completionYear: Number(completionYear),
        area: area.trim() ? Number(area) : undefined,
        status,
        tags,
        connectedItems,
        photos: photoIds.map((photoId, index) => ({
          photoId,
          isMain: photoId === effectiveMain,
          order: index,
        })),
        inquiryUrl: inquiryUrl.trim(),
      };

      const response = await api.projects.create(body);
      if (response.success) {
        router.push('/projects');
      } else {
        setError(response.error || '프로젝트 추가 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('프로젝트 생성 오류:', err);
      setError('프로젝트 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          colorPalette="secondary"
          size="sm"
          onClick={() => router.back()}
        >
          <ChevronLeftOutlineIcon size={16} />
          돌아가기
        </Button>
        <Text typography="heading3" render={<h3 />} className="text-gray-900">
          새 프로젝트 추가
        </Text>
      </div>

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                기본 정보
              </Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>프로젝트명</Field.Label>
                <TextInput
                  value={name}
                  onValueChange={setName}
                  placeholder="프로젝트명을 입력하세요"
                />
                {errors.name ? (
                  <Text typography="body3" className="text-red-600">
                    {errors.name}
                  </Text>
                ) : null}
              </Field.Root>

              <Field.Root>
                <Field.Label>프로젝트 설명</Field.Label>
                <Textarea
                  value={description}
                  onValueChange={setDescription}
                  placeholder="프로젝트에 대한 자세한 설명을 입력하세요"
                  rows={4}
                />
                {errors.description ? (
                  <Text typography="body3" className="text-red-600">
                    {errors.description}
                  </Text>
                ) : null}
              </Field.Root>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field.Root>
                  <Field.Label>프로젝트 지역</Field.Label>
                  <TextInput
                    value={location}
                    onValueChange={setLocation}
                    placeholder="서울시 강남구"
                  />
                  {errors.location ? (
                    <Text typography="body3" className="text-red-600">
                      {errors.location}
                    </Text>
                  ) : null}
                </Field.Root>

                <Field.Root>
                  <Field.Label>완공연도</Field.Label>
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    value={completionYear}
                    onValueChange={setCompletionYear}
                    placeholder="2024"
                  />
                  {errors.completionYear ? (
                    <Text typography="body3" className="text-red-600">
                      {errors.completionYear}
                    </Text>
                  ) : null}
                </Field.Root>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field.Root>
                  <Field.Label>면적 (m²)</Field.Label>
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    value={area}
                    onValueChange={setArea}
                    placeholder="면적을 입력하세요 (선택사항)"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>문의 URL</Field.Label>
                  <TextInput
                    type="url"
                    value={inquiryUrl}
                    onValueChange={setInquiryUrl}
                    placeholder="https://forms.gle/..."
                  />
                  {errors.inquiryUrl ? (
                    <Text typography="body3" className="text-red-600">
                      {errors.inquiryUrl}
                    </Text>
                  ) : null}
                </Field.Root>
              </div>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                프로젝트 사진
              </Text>
              <Text typography="body3" render={<p />} className="mt-1 text-gray-500">
                대표 이미지를 선택하면 목록과 상세에서 우선 노출됩니다.
              </Text>
            </Card.Header>
            <Card.Body>
              <EntityPicker
                kind="photo"
                value={photoIds}
                onChange={setPhotoIds}
                mainId={mainPhotoId}
                onMainChange={setMainPhotoId}
              />
              {errors.photos ? (
                <Text typography="body3" className="mt-2 text-red-600">
                  {errors.photos}
                </Text>
              ) : null}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                연결 아이템
              </Text>
            </Card.Header>
            <Card.Body>
              <EntityPicker kind="item" value={connectedItems} onChange={setConnectedItems} />
            </Card.Body>
          </Card.Root>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                프로젝트 태그
              </Text>
            </Card.Header>
            <Card.Body>
              <TagSelect type="project" value={tags} onChange={setTags} />
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>발행 상태</Field.Label>
                <Select.Root
                  items={STATUS_OPTIONS}
                  value={status}
                  onValueChange={(value) => setStatus(value as ProjectStatus)}
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

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  colorPalette="primary"
                  variant="fill"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <Spinner size="md" /> : '프로젝트 저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  colorPalette="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  취소
                </Button>
              </div>
            </Card.Body>
          </Card.Root>
        </div>
      </div>
    </MainLayout>
  );
}
