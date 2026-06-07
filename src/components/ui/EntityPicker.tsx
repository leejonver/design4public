'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Dialog, IconButton, Spinner } from '@vapor-ui/core';
import { CorrectOutlineIcon, ImageOutlineIcon, XIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { Item, Photo } from '@/types';
import SearchInput from './SearchInput';

export interface EntityPickerProps {
  kind: 'item' | 'photo';
  value: string[];
  onChange: (ids: string[]) => void;
  mainId?: string;
  onMainChange?: (id: string) => void;
}

interface Option {
  id: string;
  label: string;
  thumb?: string;
}

function itemToOption(item: Item): Option {
  const main = item.images?.find((img) => img.isMain) ?? item.images?.[0];
  return { id: item.id, label: item.name, thumb: main?.url };
}

function photoToOption(photo: Photo): Option {
  return { id: photo.id, label: photo.title || photo.altText || '제목 없음', thumb: photo.imageUrl };
}

export default function EntityPicker({
  kind,
  value,
  onChange,
  mainId,
  onMainChange,
}: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [known, setKnown] = useState<Record<string, Option>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      limit: 200,
      ...(search.trim() ? { search: search.trim() } : {}),
    };
    const endpoint = kind === 'item' ? '/items' : '/photos';
    api
      .get<{ items: (Item | Photo)[]; total: number }>(endpoint, params)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          const mapped =
            kind === 'item'
              ? (res.data.items as Item[]).map(itemToOption)
              : (res.data.items as Photo[]).map(photoToOption);
          setOptions(mapped);
          setKnown((prev) => {
            const next = { ...prev };
            mapped.forEach((opt) => {
              next[opt.id] = opt;
            });
            return next;
          });
        } else {
          setError(res.error ?? '목록을 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (active) setError('목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, search]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id));
    if (onMainChange && mainId === id) onMainChange('');
  };

  const selected: Option[] = value.map((id) => known[id] ?? { id, label: id });
  const triggerLabel = kind === 'item' ? '아이템 선택' : '사진 선택';

  return (
    <div className="space-y-3">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1"
            >
              {opt.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={opt.thumb} alt="" className="h-8 w-8 rounded object-cover" />
              ) : null}
              <span className="max-w-[140px] truncate text-sm text-gray-700">{opt.label}</span>
              {onMainChange ? (
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="radio"
                    name="entity-picker-main"
                    checked={mainId === opt.id}
                    onChange={() => onMainChange(opt.id)}
                  />
                  대표
                </label>
              ) : null}
              <IconButton
                type="button"
                size="sm"
                variant="ghost"
                colorPalette="secondary"
                aria-label="선택 제거"
                onClick={() => remove(opt.id)}
              >
                <XIcon size={14} />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">선택된 항목이 없습니다.</p>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          render={<Button type="button" variant="outline" colorPalette="secondary" size="sm" />}
        >
          {triggerLabel}
        </Dialog.Trigger>
        <Dialog.Popup className="w-[640px] max-w-[90vw]">
          <Dialog.Title>{triggerLabel}</Dialog.Title>
          <Dialog.Body>
            <div className="mb-3">
              <SearchInput value={search} onChange={setSearch} placeholder="검색" />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <Callout.Root colorPalette="danger">{error}</Callout.Root>
            ) : options.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">결과가 없습니다.</p>
            ) : (
              <div className="grid max-h-[420px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                {options.map((opt) => {
                  const isSelected = value.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggle(opt.id)}
                      aria-pressed={isSelected}
                      className={`relative flex flex-col gap-1 rounded-md border p-2 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={opt.thumb} alt="" className="h-20 w-full rounded object-cover" />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded bg-gray-100">
                          <ImageOutlineIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                      <span className="truncate text-xs text-gray-700">{opt.label}</span>
                      {isSelected ? (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <CorrectOutlineIcon size={12} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close render={<Button type="button" variant="fill" colorPalette="primary" />}>
              확인
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
