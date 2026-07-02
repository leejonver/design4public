'use client';

import { Button, Dialog, Spinner, Text } from '@vapor-ui/core';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '확인',
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <Dialog.Popup>
        <Dialog.Title>{title}</Dialog.Title>
        {description ? (
          <Dialog.Body>
            <Text typography="body2" render={<p />} className="text-gray-600">
              {description}
            </Text>
          </Dialog.Body>
        ) : null}
        <Dialog.Footer>
          <Button variant="outline" colorPalette="secondary" onClick={onCancel} disabled={loading}>
            취소
          </Button>
          <Button
            variant="fill"
            colorPalette={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="md" /> : confirmText}
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
