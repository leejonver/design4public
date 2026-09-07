import { describe, expect, it } from 'vitest';
import { pageWindow } from '@/components/admin/ui/Pagination';

describe('pageWindow', () => {
  it('single page', () => expect(pageWindow(1, 1)).toEqual([1]));
  it('no gaps when small', () => expect(pageWindow(2, 3)).toEqual([1, 2, 3]));
  it('first page: window then … last', () => expect(pageWindow(1, 10)).toEqual([1, 2, 3, null, 10]));
  it('middle page: first … window … last', () =>
    expect(pageWindow(5, 10)).toEqual([1, null, 3, 4, 5, 6, 7, null, 10]));
  it('last page keeps first/last without duplicates', () =>
    expect(pageWindow(10, 10)).toEqual([1, null, 8, 9, 10]));
});
