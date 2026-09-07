'use client';

import { Button, Text } from '@vapor-ui/core';
import { ChevronLeftOutlineIcon, ChevronRightOutlineIcon } from '@vapor-ui/icons';

export interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

/** Page numbers to render: 1 … (page-2 … page+2) … last, with `null` as an ellipsis. */
export function pageWindow(page: number, totalPages: number, radius = 2): (number | null)[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - radius; p <= page + radius; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1">
      <Button
        variant="outline"
        colorPalette="secondary"
        size="sm"
        disabled={!canPrev}
        onClick={() => onPageChange(1)}
        aria-label="첫 페이지"
      >
        <ChevronLeftOutlineIcon size={16} className="-mr-2.5" />
        <ChevronLeftOutlineIcon size={16} />
      </Button>
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

      {pageWindow(page, totalPages).map((p, i) =>
        p === null ? (
          <Text key={`gap-${i}`} typography="body2" className="px-1 text-gray-400" aria-hidden>
            …
          </Text>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'fill' : 'ghost'}
            colorPalette={p === page ? 'primary' : 'secondary'}
            size="sm"
            className="min-w-8"
            onClick={() => onPageChange(p)}
            aria-label={`${p} 페이지`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ),
      )}

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
      <Button
        variant="outline"
        colorPalette="secondary"
        size="sm"
        disabled={!canNext}
        onClick={() => onPageChange(totalPages)}
        aria-label="마지막 페이지"
      >
        <ChevronRightOutlineIcon size={16} className="-mr-2.5" />
        <ChevronRightOutlineIcon size={16} />
      </Button>
      <Text typography="body3" className="ml-2 text-gray-500">
        {page} / {totalPages}
      </Text>
    </nav>
  );
}
