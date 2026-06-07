'use client';

import { useEffect, useState, type ReactNode } from 'react';
import ImagePlaceholder from './ImagePlaceholder';

export interface ThumbnailProps {
  src?: string | null;
  alt: string;
  /** Sizing/shape utilities, e.g. "h-16 w-16 rounded". */
  className?: string;
  /** Placeholder icon shown when there is no src or the image fails to load. */
  icon?: ReactNode;
}

/**
 * Image tile that falls back to a neutral placeholder when the source is
 * missing or fails to load (e.g. legacy .blob URLs). Never shows a broken-image
 * icon or an empty cell.
 */
export default function Thumbnail({
  src,
  alt,
  className = 'h-16 w-16 rounded',
  icon,
}: ThumbnailProps) {
  const [failed, setFailed] = useState(false);

  // Re-attempt loading when the src changes (e.g. cache-busted URL after an edit).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <ImagePlaceholder className={className} icon={icon} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
