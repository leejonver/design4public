'use client';

import { useRef, useState } from 'react';
import { Button, Callout, Checkbox, IconButton, Spinner, Text, TextInput } from '@vapor-ui/core';
import {
  ChevronDownOutlineIcon,
  ChevronUpOutlineIcon,
  TrashOutlineIcon,
  UploadOutlineIcon,
} from '@vapor-ui/icons';
import { api } from '@/lib/admin-api';
import type { ImageData } from '@/lib/admin-types';

export interface PhotoUploaderProps {
  value: ImageData[];
  onChange: (photos: ImageData[]) => void;
  folder: string;
  max?: number;
}

// 항상 order = 배열 인덱스로 맞추고, 사진이 있으면 정확히 하나만 대표(없으면 첫 번째)로 보정한다.
function normalize(photos: ImageData[]): ImageData[] {
  const firstMain = photos.findIndex((p) => p.isMain);
  const mainIndex = firstMain === -1 ? 0 : firstMain;
  return photos.map((p, i) => ({ ...p, order: i, isMain: i === mainIndex }));
}

export default function PhotoUploader({ value, onChange, folder, max }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = typeof max === 'number' && value.length >= max;

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remaining = typeof max === 'number' ? Math.max(0, max - value.length) : files.length;
    const toProcess = files.slice(0, remaining);
    if (toProcess.length === 0) return;

    setUploading(true);
    const uploaded: ImageData[] = [];
    const failures: string[] = [];

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      let fileToUpload: File = file;
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch {
        fileToUpload = file; // 압축은 best-effort, 실패 시 원본 사용
      }

      const res = await api.upload(fileToUpload, folder);
      if (res.success && res.data?.url) {
        uploaded.push({
          id: res.data.url ?? crypto.randomUUID(),
          url: res.data.url,
          alt: '',
          title: '',
          isMain: false,
          order: value.length + i,
        });
      } else {
        failures.push(res.error ?? `${file.name} 업로드에 실패했습니다.`);
      }
    }

    if (uploaded.length > 0) onChange(normalize([...value, ...uploaded]));
    if (failures.length > 0) setError(failures.join(' '));

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateTitle = (index: number, title: string) => {
    onChange(normalize(value.map((p, i) => (i === index ? { ...p, title } : p))));
  };

  const setMain = (index: number) => {
    onChange(normalize(value.map((p, i) => ({ ...p, isMain: i === index }))));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(normalize(next));
  };

  const remove = (index: number) => {
    onChange(normalize(value.filter((_, i) => i !== index)));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        data-testid="photo-file-input"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          colorPalette="secondary"
          size="md"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || limitReached}
        >
          {uploading ? <Spinner size="md" /> : <UploadOutlineIcon size={16} />}
          사진 업로드
        </Button>
        {typeof max === 'number' ? (
          <Text typography="body3" className="text-gray-500">
            {value.length}/{max}
          </Text>
        ) : null}
      </div>

      {error ? <Callout.Root colorPalette="danger">{error}</Callout.Root> : null}

      {value.length > 0 ? (
        <div className="space-y-2">
          {value.map((photo, index) => (
            <div
              key={photo.id}
              data-testid="uploaded-photo"
              className="flex items-center gap-3 rounded-md border border-gray-200 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt}
                className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              />

              <TextInput
                className="flex-1"
                placeholder="사진 제목 (선택)"
                value={photo.title ?? ''}
                onValueChange={(v) => updateTitle(index, v)}
              />

              <label className="flex cursor-pointer select-none items-center gap-1.5">
                <Checkbox.Root
                  checked={!!photo.isMain}
                  onCheckedChange={(checked) => {
                    if (checked) setMain(index);
                  }}
                  aria-label="대표 사진으로 설정"
                />
                <Text typography="body3" className="text-gray-600">
                  대표
                </Text>
              </label>

              <div className="flex flex-shrink-0 items-center gap-1">
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="secondary"
                  aria-label="위로 이동"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUpOutlineIcon size={16} />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="secondary"
                  aria-label="아래로 이동"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDownOutlineIcon size={16} />
                </IconButton>
                <IconButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="danger"
                  aria-label="사진 삭제"
                  onClick={() => remove(index)}
                >
                  <TrashOutlineIcon size={16} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
