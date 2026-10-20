import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌷',
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white/70 dark:bg-cozy-darkCard/70 border border-purple-50 dark:border-purple-900/30 shadow-soft-sm my-4">
      <div className="w-16 h-16 rounded-3xl bg-cozy-lavender-soft dark:bg-purple-900/30 flex items-center justify-center text-3xl mb-4 shadow-sm animate-bounce duration-1000">
        {icon}
      </div>
      <h4 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">{title}</h4>
      <p className="text-sm text-cozy-muted dark:text-cozy-darkMuted mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
