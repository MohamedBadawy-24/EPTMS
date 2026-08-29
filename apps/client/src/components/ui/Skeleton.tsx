import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-scb-warm/40', className)}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-36" />
    </Card>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-scb-warm/40">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
};
