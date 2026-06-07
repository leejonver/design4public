'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Callout, Popover, Spinner, TextInput } from '@vapor-ui/core';
import { CorrectOutlineIcon, PlusOutlineIcon, XIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { Tag, TagType } from '@/types';

export interface TagSelectProps {
  type: TagType;
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagSelect({ type, value, onChange }: TagSelectProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{ items: Tag[]; total: number }>('/tags', { type, limit: 200 })
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) setTags(res.data.items);
        else setError(res.error ?? '태그를 불러오지 못했습니다.');
      })
      .catch(() => {
        if (active) setError('태그를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const createTag = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    const res = await api.post<Tag>('/tags', { name, type });
    if (res.success && res.data) {
      setTags((prev) => [...prev, res.data as Tag]);
      onChange([...value, res.data.id]);
      setNewName('');
    } else {
      setError(res.error ?? '태그 생성에 실패했습니다.');
    }
    setCreating(false);
  };

  const selected = value
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => Boolean(t));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length > 0 ? (
          selected.map((tag) => (
            <Badge key={tag.id} colorPalette="primary" size="md">
              {tag.name}
              <button
                type="button"
                aria-label={`${tag.name} 태그 제거`}
                onClick={() => toggle(tag.id)}
                className="ml-1 inline-flex"
              >
                <XIcon size={12} />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-gray-400">선택된 태그가 없습니다.</span>
        )}
      </div>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={<Button type="button" variant="outline" colorPalette="secondary" size="sm" />}
        >
          <PlusOutlineIcon size={14} />
          태그 선택
        </Popover.Trigger>
        <Popover.Popup className="w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          {error ? (
            <Callout.Root colorPalette="danger" className="mb-2">
              {error}
            </Callout.Root>
          ) : null}

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner size="md" />
              </div>
            ) : tags.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-gray-400">태그가 없습니다.</p>
            ) : (
              tags.map((tag) => {
                const isSelected = value.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    aria-pressed={isSelected}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-blue-600">
                      {isSelected ? <CorrectOutlineIcon size={14} /> : null}
                    </span>
                    <span className="flex-1 text-left">{tag.name}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
            <TextInput
              value={newName}
              onValueChange={setNewName}
              placeholder="새 태그"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createTag();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="fill"
              colorPalette="primary"
              onClick={createTag}
              disabled={creating || !newName.trim()}
            >
              {creating ? <Spinner size="md" /> : '추가'}
            </Button>
          </div>
        </Popover.Popup>
      </Popover.Root>
    </div>
  );
}
