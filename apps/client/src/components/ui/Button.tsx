import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-scb-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-md';

    const variants = {
      primary: 'bg-scb-blue text-white hover:bg-scb-blue-hover active:bg-[#002f80] shadow-sm',
      secondary: 'bg-[#4A4F54] text-white hover:bg-[#383C40] active:bg-[#2D3033] shadow-sm',
      outline: 'border border-scb-warm bg-white text-scb-dark hover:bg-scb-offwhite hover:border-[#b8b2a8]',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
      ghost: 'text-scb-dark hover:bg-scb-warm/30 active:bg-scb-warm/50',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
