import React from 'react';
import clsx from 'clsx';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx(
        'animate-pulse bg-purple-100/60 dark:bg-purple-900/20 rounded-2xl',
        className
      )}
    />
  );
};
