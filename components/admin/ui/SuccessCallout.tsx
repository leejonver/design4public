'use client';

import { useEffect, useRef } from 'react';
import { Callout, IconButton, Text } from '@vapor-ui/core';
import { CloseOutlineIcon } from '@vapor-ui/icons';

export interface SuccessCalloutProps {
  /** Message to show. When null, nothing renders. */
  message: string | null;
  /** Called on manual close and after the auto-dismiss timeout. */
  onClose: () => void;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}

/** Transient success feedback shown after a mutation succeeds. Auto-dismisses. */
export default function SuccessCallout({ message, onClose, duration = 3000 }: SuccessCalloutProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <Callout.Root colorPalette="success" className="mb-4 flex items-start justify-between gap-3">
      <Text typography="body2" render={<p />}>
        {message}
      </Text>
      <IconButton
        size="sm"
        variant="ghost"
        colorPalette="secondary"
        aria-label="알림 닫기"
        onClick={onClose}
      >
        <CloseOutlineIcon size={16} />
      </IconButton>
    </Callout.Root>
  );
}
