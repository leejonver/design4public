import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DataTable from '@/components/admin/ui/DataTable';
import ImageUploader from '@/components/admin/ui/ImageUploader';
import SuccessCallout from '@/components/admin/ui/SuccessCallout';
import { api } from '@/lib/admin-api';
import { useListController } from '@/lib/use-list-controller';

vi.mock('@/lib/admin-api', () => ({ api: { upload: vi.fn() } }));
vi.mock('browser-image-compression', () => ({ default: vi.fn(async (file: File) => file) }));

describe('admin UI current contracts', () => {
  it('renders single-image upload controls and custom table cells', () => {
    const { container } = render(
      <>
        <ImageUploader value={[{ id: 'image', url: '/image.jpg', alt: '', isMain: true }]} onChange={() => {}} folder="brands" />
        <DataTable
          columns={[{ key: 'name', header: '이름', render: (row: { name: string }) => `맞춤 ${row.name}` }]}
          rows={[{ name: '행' }]}
          rowKey={(row) => row.name}
        />
      </>,
    );

    expect(container.querySelector('input[type="file"]')).not.toHaveAttribute('multiple');
    expect(screen.getByText('맞춤 행')).toBeInTheDocument();
  });

  it('can preview a logo without cropping it', () => {
    render(
      <ImageUploader
        value={[{ id: 'logo', url: '/logo.png', alt: '브랜드 로고', isMain: true }]}
        onChange={() => {}}
        folder="brands"
        previewFit="contain"
      />,
    );

    expect(screen.getByRole('img', { name: '브랜드 로고' })).toHaveClass('object-contain');
  });

  it('auto-dismisses success feedback after three seconds', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<SuccessCallout message="저장됨" onClose={onClose} />);

    act(() => vi.advanceTimersByTime(3000));
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('replaces the image on success and shows upload failures', async () => {
    const onChange = vi.fn();
    const { container } = render(<ImageUploader value={[]} onChange={onChange} folder="brands" />);
    const input = container.querySelector('input[type="file"]')!;
    const upload = vi.mocked(api.upload);

    upload.mockResolvedValueOnce({ success: true, data: { url: '/logo.jpg' } });
    fireEvent.change(input, { target: { files: [new File(['image'], 'logo.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith([{ id: '/logo.jpg', url: '/logo.jpg', alt: '', isMain: true }]));

    upload.mockResolvedValueOnce({ success: false, error: '업로드 실패' });
    fireEvent.change(input, { target: { files: [new File(['image'], 'bad.jpg', { type: 'image/jpeg' })] } });
    expect(await screen.findByText('업로드 실패')).toBeInTheDocument();
  });

  it('fetches lists with an empty default search', () => {
    const fetch = vi.fn(() => new Promise<never>(() => {}));
    let search = 'not rendered';

    function Subject() {
      search = useListController({ fetch }).search;
      return null;
    }

    render(<Subject />);
    expect(search).toBe('');
    expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ search: '' }));
  });
});
