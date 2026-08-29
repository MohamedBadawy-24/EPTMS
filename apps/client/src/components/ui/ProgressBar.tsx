import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  showValue?: boolean;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'auto';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showValue = false,
  color = 'auto',
  size = 'md',
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const getColorClass = () => {
    if (color === 'blue') return 'bg-scb-blue';
    if (color === 'green') return 'bg-emerald-500';
    if (color === 'amber') return 'bg-amber-500';
    if (color === 'red') return 'bg-rose-500';

    // Auto based on score / percentage
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex items-center gap-2.5', className)} {...props}>
      <div className={cn('w-full bg-scb-warm/40 rounded-full overflow-hidden flex-1', heights[size])}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-scb-dark min-w-[36px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
};
