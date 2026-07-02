import type { ReactNode } from 'react';
import { FolderOutlineIcon } from '@vapor-ui/icons';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="text-gray-300">
        {icon ?? <FolderOutlineIcon size={40} />}
      </span>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description ? <p className="max-w-sm text-sm text-gray-400">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
