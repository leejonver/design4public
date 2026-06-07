'use client';

import { Button, Text } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, ChevronRightOutlineIcon } from '@vapor-ui/icons';

export interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        colorPalette="secondary"
        size="sm"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        aria-label="이전 페이지"
      >
        <ChevronLeftOutlineIcon size={16} />
      </Button>
      <Text typography="body2" className="text-gray-600">
        {page} / {totalPages}
      </Text>
      <Button
        variant="outline"
        colorPalette="secondary"
        size="sm"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        aria-label="다음 페이지"
      >
        <ChevronRightOutlineIcon size={16} />
      </Button>
    </div>
  );
}
