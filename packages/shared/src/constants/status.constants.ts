// ─── Role & Status Constants ─────────────────────────────────────────────────
// Single source of truth for all enums used across the stack.

export const ROLES = ['ADMIN', 'VIEWER'] as const;
export type Role = (typeof ROLES)[number];

export const MILESTONE_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ON_HOLD',
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const PROCUREMENT_STATUSES = [
  'PENDING',
  'TENDERED',
  'ALLOCATED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
