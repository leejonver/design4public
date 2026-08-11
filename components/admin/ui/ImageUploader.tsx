'use client';

import { useRef, useState } from 'react';
import { Button, Callout, IconButton, Spinner } from '@vapor-ui/core';
import { TrashOutlineIcon, UploadOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/admin-api';
import type { ImageData } from '@/lib/admin-types';

export interface ImageUploaderProps {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  folder: string;
}

export default function ImageUploader({
  value,
  onChange,
  folder,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const file = Array.from(fileList).at(-1);
    if (!file) return;

    setUploading(true);
    try {
      let fileToUpload = file;
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch {
        // Compression is best-effort; fall back to the original file.
      }

      const res = await api.upload(fileToUpload, folder);
      const url = res.data?.url;
      if (res.success && url) {
        onChange([{ id: url, url, alt: '', isMain: true }]);
      } else {
        setError(res.error ?? `${file.name} 업로드에 실패했습니다.`);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (id: string) => {
    onChange(value.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
          disabled={uploading}
        >
          {uploading ? <Spinner size="md" /> : <UploadOutlineIcon size={16} />}
          이미지 업로드
        </Button>
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
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
