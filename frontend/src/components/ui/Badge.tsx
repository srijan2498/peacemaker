import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'lavender' | 'mint' | 'peach' | 'pink' | 'sky' | 'yellow' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'lavender',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    lavender: 'bg-cozy-lavender-soft text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    mint: 'bg-cozy-mint text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    peach: 'bg-cozy-peach text-amber-900 dark:bg-amber-900/40 dark:text-amber-300',
    pink: 'bg-cozy-pink text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    sky: 'bg-cozy-sky text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    yellow: 'bg-cozy-yellow text-amber-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-xs px-3 py-1 rounded-full font-semibold'
  };

  return (
    <span
      className={clsx('inline-flex items-center gap-1 select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
