// Design4Public CMS - 새 사진 추가 페이지

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Callout, Card, Field, Spinner, Text, TextInput, Textarea } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, SaveOutlineIcon } from '@vapor-ui/icons';
import MainLayout from '@/components/MainLayout';
import { ImageUploader, EntityPicker, TagSelect } from '@/components/ui';
import { api } from '@/lib/api';
import type { ImageData } from '@/types';

export default function NewPhotoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<ImageData[]>([]);
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [description, setDescription] = useState('');
  const [connectedItems, setConnectedItems] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = async () => {
    setError(null);

    const imageUrl = images[0]?.url;
    if (!imageUrl) {
      setError('이미지를 업로드해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/photos', {
        imageUrl,
        altText: altText || null,
        title: title || null,
        description: description || null,
        connectedItems,
        tags,
      });

      if (res.success) {
        router.push('/photos');
      } else {
        setError(res.error ?? '사진 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error('사진 추가 중 예외 발생:', err);
      setError('사진 추가 중 오류가 발생했습니다.');
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
          새 사진 추가
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
        {/* 이미지 업로드 */}
        <div className="lg:col-span-5">
          <Card.Root>
            <Card.Header>
              <Text typography="heading5" render={<h4 />} className="text-gray-900">
                사진 이미지
              </Text>
            </Card.Header>
            <Card.Body>
              <Field.Root>
                <Field.Label>이미지 업로드</Field.Label>
                <ImageUploader value={images} onChange={setImages} folder="photos" multiple={false} />
                <Field.Description>JPG, PNG, WebP 형식, 최대 10MB</Field.Description>
              </Field.Root>
            </Card.Body>
          </Card.Root>
        </div>

        {/* 기본 정보 + 연결 정보 */}
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
                <Field.Description>사진의 제목입니다 (선택사항)</Field.Description>
              </Field.Root>

              <Field.Root>
                <Field.Label>대체 텍스트</Field.Label>
                <TextInput
                  value={altText}
                  onValueChange={setAltText}
                  placeholder="이미지에 대한 간단한 설명"
                  maxLength={200}
                />
                <Field.Description>이미지 접근성을 위한 대체 텍스트입니다</Field.Description>
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
                연결 정보
              </Text>
            </Card.Header>
            <Card.Body className="space-y-4">
              <Field.Root>
                <Field.Label>연결된 아이템</Field.Label>
                <EntityPicker kind="item" value={connectedItems} onChange={setConnectedItems} />
                <Field.Description>이 사진에 등장하는 아이템을 선택하세요</Field.Description>
              </Field.Root>

              <Field.Root>
                <Field.Label>태그</Field.Label>
                <TagSelect type="photo" value={tags} onChange={setTags} />
              </Field.Root>
            </Card.Body>
          </Card.Root>

          <div className="flex flex-col gap-3">
            <Button type="submit" colorPalette="primary" size="lg" disabled={loading} className="w-full">
              {loading ? <Spinner size="md" /> : <SaveOutlineIcon size={16} />}
              {loading ? '저장 중...' : '사진 저장'}
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
