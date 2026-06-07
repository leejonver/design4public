// Design4Public CMS - 사진 편집 페이지

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Callout, Card, Field, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { FreeTagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { Photo } from '@/types';

export default function PhotoEditPage() {
  const params = useParams();
  const photo_id = params.photo_id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);

  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<Photo>(`/photos/${photo_id}`);
        if (res.success && res.data) {
          setPhoto(res.data);
          setTitle(res.data.title || '');
          setAltText(res.data.altText || '');
          setDescription(res.data.description || '');
          setTags(res.data.tags?.map((tag) => tag.name) || []);
        } else {
          setError('사진을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        setError('데이터를 불러오는 데 실패했습니다.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [photo_id]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/photos/${photo_id}`, {
        title: title || null,
        altText: altText || null,
        description: description || null,
        tags,
      });

      if (res.success) {
        router.push(`/photos/${photo_id}`);
      } else {
        setError(res.error ?? '사진 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('사진 수정 중 예외 발생:', err);
      setError('사진 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner size="lg" />
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
          사진 편집
        </Text>
      </div>

      {error ? (
        <Callout.Root colorPalette="danger" className="mb-4">
          {error}
        </Callout.Root>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        {/* 현재 이미지 (읽기 전용) */}
        <div className="lg:col-span-5">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                현재 이미지
              </Text>
            </Card.Header>
            <Card.Body>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.imageUrl}
                  alt={photo.altText || '사진'}
                  className="w-full rounded-lg object-cover"
                />
              ) : null}
              <Text typography="body3" render={<p />} className="mt-3 text-gray-500">
                * 이미지는 변경할 수 없습니다. 이미지를 변경하려면 새 사진을 등록해주세요.
              </Text>
            </Card.Body>
          </Card.Root>
        </div>

        {/* 편집 가능한 정보 */}
        <div className="space-y-6 lg:col-span-7">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                기본 정보
              </Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>사진 제목</Field.Label>
                <TextInput
                  value={title}
                  onValueChange={setTitle}
                  placeholder="사진 제목을 입력하세요"
                  maxLength={100}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>대체 텍스트</Field.Label>
                <TextInput
                  value={altText}
                  onValueChange={setAltText}
                  placeholder="이미지에 대한 간단한 설명"
                  maxLength={200}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>사진 설명</Field.Label>
                <Textarea
                  value={description}
                  onValueChange={setDescription}
                  placeholder="사진에 대한 자세한 설명을 입력하세요"
                  maxLength={500}
                  rows={3}
                />
              </Field.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                태그
              </Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>태그</Field.Label>
                <FreeTagSelect value={tags} onChange={setTags} />
              </Field.Root>
            </Card.Body>
          </Card.Root>

          <div className="flex flex-col gap-3">
            <Button type="submit" colorPalette="primary" size="md" disabled={loading} className="w-full">
              {loading ? <Spinner size="md" /> : <SaveOutlineIcon size={16} />}
              {loading ? '저장 중...' : '변경사항 저장'}
            </Button>
            <Button
              type="button"
              variant="outline"
              colorPalette="secondary"
              onClick={() => router.back()}
              className="w-full"
            >
              취소
            </Button>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
