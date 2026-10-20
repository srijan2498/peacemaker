import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-cozy-lavender text-white shadow-soft-sm hover:shadow-soft-md hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-cozy-lavender/40',
      secondary:
        'bg-cozy-lavender-soft text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50',
      soft:
        'bg-cozy-mint text-emerald-800 hover:bg-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-300',
      outline:
        'border border-purple-200 text-cozy-text hover:bg-cozy-lavender-soft dark:border-purple-800/40 dark:text-cozy-darkText dark:hover:bg-purple-900/20',
      ghost:
        'text-cozy-text hover:bg-cozy-lavender-soft/60 dark:text-cozy-darkText dark:hover:bg-purple-900/20',
      danger:
        'bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-2 focus-visible:ring-rose-400'
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-xl',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 rounded-3xl',
      icon: 'p-2.5 w-10 h-10 rounded-2xl'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
