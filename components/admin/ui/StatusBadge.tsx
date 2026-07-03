import { Badge } from '@vapor-ui/core';

type BadgeColor = 'primary' | 'hint' | 'danger' | 'success' | 'warning' | 'contrast';

export interface StatusBadgeProps {
  kind: 'project' | 'item' | 'brand' | 'approval';
  value: string;
}

type StatusEntry = { label: string; colorPalette: BadgeColor };

const STATUS_MAP: Record<StatusBadgeProps['kind'], Record<string, StatusEntry>> = {
  project: {
    draft: { label: '초안', colorPalette: 'hint' },
    published: { label: '게시됨', colorPalette: 'success' },
    hidden: { label: '숨김', colorPalette: 'hint' },
  },
  item: {
    available: { label: '구입가능', colorPalette: 'success' },
    discontinued: { label: '단종', colorPalette: 'warning' },
    hidden: { label: '숨김', colorPalette: 'hint' },
  },
  brand: {
    visible: { label: '노출', colorPalette: 'success' },
    hidden: { label: '숨김', colorPalette: 'hint' },
  },
  approval: {
    pending: { label: '대기', colorPalette: 'warning' },
    approved: { label: '승인', colorPalette: 'success' },
    rejected: { label: '거부', colorPalette: 'danger' },
  },
};

export default function StatusBadge({ kind, value }: StatusBadgeProps) {
  const entry = STATUS_MAP[kind][value] ?? { label: value, colorPalette: 'hint' as const };
  return (
    <Badge colorPalette={entry.colorPalette} size="sm">
      {entry.label}
    </Badge>
  );
}
