import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';

vi.mock('@vapor-ui/core', () => ({
  Button: ({ children, colorPalette, ...props }: React.ComponentProps<'button'> & { colorPalette?: string }) => (
    <button data-color-palette={colorPalette} {...props}>{children}</button>
  ),
  Dialog: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Footer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
  Spinner: () => null,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

describe('ConfirmDialog', () => {
  it('uses the destructive confirmation style by default', () => {
    render(
      <ConfirmDialog
        open
        title="삭제"
        confirmText="삭제"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: '삭제' })).toHaveAttribute('data-color-palette', 'danger');
  });
});
