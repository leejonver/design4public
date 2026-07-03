'use client';

import { Select } from '@vapor-ui/core';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  /** Tailwind width utility class for the trigger, e.g. 'w-40' | 'w-[160px]'. */
  width?: string;
}

/**
 * Thin Vapor Select wrapper for status/role/type filters.
 *
 * Always renders the selected option's LABEL in the trigger (mapping value -> label),
 * so a value like 'all' shows '전체' instead of the raw value. Built from the Select
 * primitives because the convenience `Select.Trigger` overrides its own children and
 * would otherwise render the raw value.
 */
export default function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder = '전체',
  width = 'w-40',
}: FilterSelectProps) {
  const labelOf = (v: unknown): string => {
    const found = options.find((option) => option.value === v);
    return found ? found.label : placeholder;
  };

  return (
    <Select.Root value={value} onValueChange={(v) => onValueChange(v ?? '')} placeholder={placeholder}>
      <Select.TriggerPrimitive className={width}>
        <Select.ValuePrimitive>{(v: unknown) => labelOf(v)}</Select.ValuePrimitive>
        <Select.TriggerIconPrimitive />
      </Select.TriggerPrimitive>
      <Select.Popup>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
}
