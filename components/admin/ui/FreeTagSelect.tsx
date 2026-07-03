'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Callout, Spinner, TextInput } from '@vapor-ui/core';
import { CloseOutlineIcon, PlusOutlineIcon } from '@vapor-ui/icons';
import { api } from '@/lib/admin-api';
import type { Tag } from '@/lib/admin-types';

export interface FreeTagSelectProps {
  value: string[];
  onChange: (names: string[]) => void;
}

export default function FreeTagSelect({ value, onChange }: FreeTagSelectProps) {
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.tags
      .getList({ limit: 200 })
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setSuggestions((res.data as { items: Tag[] }).items);
        } else {
          setError(res.error ?? '태그를 불러오지 못했습니다.');
        }
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
  }, []);

  const addName = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (value.includes(name)) {
      setDraft('');
      return;
    }
    onChange([...value, name]);
    setDraft('');
  };

  const remove = (name: string) => {
    onChange(value.filter((v) => v !== name));
  };

  const filteredSuggestions = useMemo(() => {
    const query = draft.trim().toLowerCase();
    return suggestions
      .filter((tag) => !value.includes(tag.name))
      .filter((tag) => (query ? tag.name.toLowerCase().includes(query) : true))
      .slice(0, 30);
  }, [suggestions, value, draft]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.length > 0 ? (
          value.map((name) => (
            <Badge key={name} colorPalette="primary" size="md">
              {name}
              <button
                type="button"
                aria-label={`${name} 태그 제거`}
                onClick={() => remove(name)}
                className="ml-1 inline-flex"
              >
                <CloseOutlineIcon size={12} />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-gray-400">선택된 태그가 없습니다.</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <TextInput
          value={draft}
          onValueChange={setDraft}
          placeholder="태그 입력 후 Enter"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addName(draft);
            }
          }}
        />
        <Button
          type="button"
          size="md"
          variant="fill"
          colorPalette="primary"
          onClick={() => addName(draft)}
          disabled={!draft.trim()}
        >
          <PlusOutlineIcon size={16} />
          추가
        </Button>
      </div>

      {error ? <Callout.Root colorPalette="danger">{error}</Callout.Root> : null}

      {loading ? (
        <div className="flex justify-center py-2">
          <Spinner size="md" />
        </div>
      ) : filteredSuggestions.length > 0 ? (
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addName(tag.name)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
