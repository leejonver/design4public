import React from 'react';
import { Text } from '@vapor-ui/core';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Text typography="heading3" render={<h3 />} className="text-gray-900">
          {title}
        </Text>
        {description ? (
          <Text typography="body2" render={<p />} className="mt-1 text-gray-500">
            {description}
          </Text>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
