import { act, render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useListController, type UseListController } from '@/lib/use-list-controller';

describe('useListController', () => {
  it('passes active filters and resets the page when one changes', () => {
    const fetch = vi.fn(() => new Promise<never>(() => {}));
    let controller!: UseListController<never>;

    function Subject() {
      controller = useListController({
        fetch,
        initialFilters: { role: 'all', status: 'all' },
        initialSort: { key: 'created_at', dir: 'desc' },
      });
      return null;
    }

    render(<Subject />);
    expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'all', status: 'all', page: 1 }));

    act(() => controller.setPage(2));
    act(() => controller.setFilter('role', 'admin'));
    expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'admin', status: 'all', page: 1 }));
  });

  it('clears a fetch error without refetching', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('목록 실패'));
    let controller!: UseListController<never>;

    function Subject() {
      controller = useListController({ fetch });
      return null;
    }

    render(<Subject />);
    await waitFor(() => expect(controller.error).toBe('목록 실패'));
    act(() => (controller as UseListController<never> & { clearError?: () => void }).clearError?.());
    expect(controller.error).toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
  });
});
