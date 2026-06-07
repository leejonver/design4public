'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Callout, Popover, Spinner, TextInput } from '@vapor-ui/core';
import { CloseOutlineIcon, CorrectOutlineIcon, PlusOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/api';
import type { Category, CategoryType } from '@/types';

export interface CategorySelectProps {
  type: CategoryType;
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function CategorySelect({ type, value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.categories
      .getList({ type, limit: 200 })
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setCategories((res.data as { items: Category[] }).items);
        } else {
          setError(res.error ?? '카테고리를 불러오지 못했습니다.');
        }
      })
      .catch(() => {
        if (active) setError('카테고리를 불러오지 못했습니다.');
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

  const createCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    const res = await api.categories.create({ name, type });
    if (res.success && res.data) {
      const created = res.data as Category;
      setCategories((prev) => [...prev, created]);
      onChange([...value, created.id]);
      setNewName('');
    } else {
      setError(res.error ?? '카테고리 생성에 실패했습니다.');
    }
    setCreating(false);
  };

  const selected = value
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => Boolean(c));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length > 0 ? (
          selected.map((category) => (
            <Badge key={category.id} colorPalette="primary" size="md">
              {category.name}
              <button
                type="button"
                aria-label={`${category.name} 카테고리 제거`}
                onClick={() => toggle(category.id)}
                className="ml-1 inline-flex"
              >
                <CloseOutlineIcon size={12} />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-gray-400">선택된 카테고리가 없습니다.</span>
        )}
      </div>

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={<Button type="button" variant="outline" colorPalette="secondary" size="sm" />}
        >
          <PlusOutlineIcon size={14} />
          카테고리 선택
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
            ) : categories.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-gray-400">카테고리가 없습니다.</p>
            ) : (
              categories.map((category) => {
                const isSelected = value.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggle(category.id)}
                    aria-pressed={isSelected}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <span className="flex h-4 w-4 items-center justify-center text-blue-600">
                      {isSelected ? <CorrectOutlineIcon size={14} /> : null}
                    </span>
                    <span className="flex-1 text-left">{category.name}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
            <TextInput
              value={newName}
              onValueChange={setNewName}
              placeholder="새 카테고리"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createCategory();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="fill"
              colorPalette="primary"
              onClick={createCategory}
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
