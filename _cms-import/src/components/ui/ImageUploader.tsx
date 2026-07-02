'use client';

import { useRef, useState } from 'react';
import { Button, Callout, IconButton, Spinner, Text } from '@vapor-ui/core';
import { TrashOutlineIcon, UploadOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { ImageData } from '@/types';

export interface ImageUploaderProps {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  folder: string;
  multiple?: boolean;
  max?: number;
}

// Guarantee exactly one image is flagged as the representative ("대표").
function ensureOneMain(images: ImageData[]): ImageData[] {
  if (images.length === 0) return images;
  if (images.some((img) => img.isMain)) return images;
  return images.map((img, i) => (i === 0 ? { ...img, isMain: true } : img));
}

export default function ImageUploader({
  value,
  onChange,
  folder,
  multiple = true,
  max,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = multiple && typeof max === 'number' && value.length >= max;

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    // When single, only the last picked file matters. When multiple, respect `max`.
    const remaining =
      typeof max === 'number' ? Math.max(0, max - value.length) : files.length;
    const toProcess = multiple ? files.slice(0, remaining) : files.slice(-1);
    if (toProcess.length === 0) return;

    setUploading(true);
    const uploaded: ImageData[] = [];
    const failures: string[] = [];

    for (const file of toProcess) {
      let fileToUpload: File = file;
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch {
        fileToUpload = file; // compression is best-effort; fall back to the original.
      }

      const res = await api.upload(fileToUpload, folder);
      if (res.success && res.data?.url) {
        uploaded.push({
          id: res.data.url ?? crypto.randomUUID(),
          url: res.data.url,
          alt: '',
          isMain: false,
        });
      } else {
        failures.push(res.error ?? `${file.name} 업로드에 실패했습니다.`);
      }
    }

    if (uploaded.length > 0) {
      const next = multiple ? [...value, ...uploaded] : [uploaded[uploaded.length - 1]];
      onChange(ensureOneMain(next));
    }
    if (failures.length > 0) setError(failures.join(' '));

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (id: string) => {
    onChange(ensureOneMain(value.filter((img) => img.id !== id)));
  };

  const setMain = (id: string) => {
    onChange(value.map((img) => ({ ...img, isMain: img.id === id })));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
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
          이미지 업로드
        </Button>
        {typeof max === 'number' ? (
          <Text typography="body3" className="text-gray-500">
            {value.length}/{max}
          </Text>
        ) : null}
      </div>

      {error ? <Callout.Root colorPalette="danger">{error}</Callout.Root> : null}

      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {value.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-md border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="h-24 w-full object-cover" />
              <IconButton
                type="button"
                size="sm"
                variant="fill"
                colorPalette="danger"
                aria-label="이미지 삭제"
                onClick={() => remove(img.id)}
                className="absolute right-1.5 top-1.5"
              >
                <TrashOutlineIcon size={14} />
              </IconButton>
              <div className="absolute inset-x-0 bottom-0 flex justify-center bg-black/40 py-1">
                {img.isMain ? (
                  <span className="text-xs font-semibold text-white">대표</span>
                ) : multiple ? (
                  <button
                    type="button"
                    onClick={() => setMain(img.id)}
                    className="text-xs text-white/90 hover:text-white"
                  >
                    대표 설정
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
