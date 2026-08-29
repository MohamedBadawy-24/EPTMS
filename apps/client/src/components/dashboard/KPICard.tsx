import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'default';
  trendText?: string;
  isLoading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'default',
  trendText,
  isLoading = false,
}) => {
  const colorMap = {
    blue: {
      border: 'border-l-scb-blue',
      iconBg: 'bg-scb-blue-light text-scb-blue',
      badgeBg: 'text-scb-blue bg-scb-blue-light/60',
    },
    green: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'text-emerald-700 bg-emerald-50',
    },
    amber: {
      border: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      badgeBg: 'text-amber-700 bg-amber-50',
    },
    red: {
      border: 'border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-600',
      badgeBg: 'text-rose-700 bg-rose-50',
    },
    default: {
      border: 'border-l-scb-dark',
      iconBg: 'bg-scb-offwhite text-scb-dark',
      badgeBg: 'text-scb-dark bg-scb-warm/40',
    },
  };

  const currentTheme = colorMap[color];

  return (
    <Card className={cn('p-5 border-l-4 transition-all duration-150', currentTheme.border)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-scb-dark-muted uppercase tracking-wider">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-scb-warm/40 animate-pulse rounded my-1" />
          ) : (
            <h4 className="text-2xl font-bold text-scb-dark tracking-tight">{value}</h4>
          )}
          {subtitle && <p className="text-[11px] text-scb-dark-muted">{subtitle}</p>}
        </div>

        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm', currentTheme.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trendText && (
        <div className="mt-3 pt-2.5 border-t border-scb-warm/40 flex items-center justify-between text-[11px]">
          <span className={cn('font-semibold px-2 py-0.5 rounded-full', currentTheme.badgeBg)}>
            {trendText}
          </span>
        </div>
      )}
    </Card>
  );
};
