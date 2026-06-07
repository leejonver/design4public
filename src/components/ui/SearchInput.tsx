'use client';

import { useEffect, useState } from 'react';
import { TextInput } from '@vapor-ui/core';
import { SearchOutlineIcon } from '@vapor-ui/icons';

export interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = '검색',
  debounceMs = 300,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  // Keep internal state in sync when the controlled value changes externally.
  useEffect(() => {
    setInternal(value);
  }, [value]);

  // Debounce propagating the internal value to the parent.
  useEffect(() => {
    if (internal === value) return;
    const timer = setTimeout(() => onChange(internal), debounceMs);
    return () => clearTimeout(timer);
  }, [internal, value, debounceMs, onChange]);

  return (
    <div className="relative">
      <SearchOutlineIcon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <TextInput
        type="search"
        value={internal}
        onValueChange={(v) => setInternal(v)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
