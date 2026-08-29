import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RAGStatus } from '@scb/shared';

/**
 * Merges Tailwind classes safely with clsx and twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value as EGP or USD currency
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = 'EGP'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '—';
  }
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numericVal);
}

/**
 * Formats a date string or Date object into a banking-standard DD-MMM-YYYY format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats standard number with commas
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  const numericVal = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US').format(numericVal);
}

/**
 * Returns consistent styling tokens based on RAG status
 */
export function getRagConfig(rag: RAGStatus | undefined | null) {
  switch (rag) {
    case 'GREEN':
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotBg: 'bg-emerald-500',
        hex: '#22C55E',
        label: 'On Track',
      };
    case 'AMBER':
      return {
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        dotBg: 'bg-amber-500',
        hex: '#F59E0B',
        label: 'Caution',
      };
    case 'RED':
      return {
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        dotBg: 'bg-rose-500',
        hex: '#EF4444',
        label: 'Critical',
      };
    default:
      return {
        badgeBg: 'bg-gray-50 text-gray-700 border-gray-200',
        dotBg: 'bg-gray-400',
        hex: '#9CA3AF',
        label: 'Unknown',
      };
  }
}
