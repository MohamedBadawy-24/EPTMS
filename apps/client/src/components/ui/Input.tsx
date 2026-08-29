import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-scb-dark select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-scb-dark-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-9 rounded-md border border-scb-warm bg-white px-3 py-1.5 text-xs text-scb-dark placeholder:text-scb-dark-muted/60 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-scb-blue focus:border-scb-blue',
              'disabled:bg-scb-offwhite disabled:text-scb-dark-muted disabled:cursor-not-allowed',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-scb-dark-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-scb-dark-muted">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
