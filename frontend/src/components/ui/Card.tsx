import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = true, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-3xl p-6 border transition-all duration-200',
          glass
            ? 'cozy-glass shadow-soft-sm'
            : 'bg-white dark:bg-cozy-darkCard border-purple-50 dark:border-purple-900/30 shadow-soft-sm',
          hoverEffect && 'cozy-card',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
