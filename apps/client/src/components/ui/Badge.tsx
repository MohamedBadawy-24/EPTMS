import React from 'react';
import { cn, getRagConfig } from '@/lib/utils';
import type { RAGStatus } from '@scb/shared';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  rag?: RAGStatus;
  variant?: 'default' | 'outline' | 'secondary' | 'admin' | 'viewer' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  rag,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  if (rag) {
    const config = getRagConfig(rag);
    return (
      <span
        className={cn(
          'inline-flex items-center font-semibold rounded-full border transition-colors',
          size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5',
          config.badgeBg,
          className
        )}
        {...props}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', config.dotBg)} />
        {children || config.label}
      </span>
    );
  }

  const variantStyles = {
    default: 'bg-scb-blue-light text-scb-blue border-scb-blue/20',
    outline: 'border-scb-warm bg-white text-scb-dark',
    secondary: 'bg-scb-dark/10 text-scb-dark border-transparent',
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold tracking-wide',
    viewer: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
    danger: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
