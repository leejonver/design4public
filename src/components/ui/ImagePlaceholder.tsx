import type { ReactNode } from 'react';
import { ImageOutlineIcon } from '@vapor-ui/icons';

export interface ImagePlaceholderProps {
  /** Sizing/shape utilities (e.g. "h-12 w-12 rounded"). */
  className?: string;
  /** Override icon. Defaults to a neutral image icon. */
  icon?: ReactNode;
}

/** Standard empty/placeholder tile for missing images across list pages. */
export default function ImagePlaceholder({ className, icon }: ImagePlaceholderProps) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className ?? ''}`}>
      {icon ?? <ImageOutlineIcon size={18} />}
    </div>
  );
}
