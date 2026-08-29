import { z } from 'zod';
import type {
  loginSchema,
  registerSchema,
} from '../schemas/auth.schema.js';
import type {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '../schemas/project.schema.js';
import type {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneQuerySchema,
} from '../schemas/milestone.schema.js';
import type {
  createProcurementSchema,
  updateProcurementSchema,
  procurementQuerySchema,
} from '../schemas/procurement.schema.js';
import type {
  createContractorSchema,
  updateContractorSchema,
  contractorQuerySchema,
} from '../schemas/contractor.schema.js';
import type { auditQuerySchema } from '../schemas/audit.schema.js';

// ─── Auth Types ──────────────────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Project Types ───────────────────────────────────────────────────────────
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;

// ─── Milestone Types ─────────────────────────────────────────────────────────
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type MilestoneQuery = z.infer<typeof milestoneQuerySchema>;

// ─── Procurement Types ───────────────────────────────────────────────────────
export type CreateProcurementInput = z.infer<typeof createProcurementSchema>;
export type UpdateProcurementInput = z.infer<typeof updateProcurementSchema>;
export type ProcurementQuery = z.infer<typeof procurementQuerySchema>;

// ─── Contractor Types ────────────────────────────────────────────────────────
export type CreateContractorInput = z.infer<typeof createContractorSchema>;
export type UpdateContractorInput = z.infer<typeof updateContractorSchema>;
export type ContractorQuery = z.infer<typeof contractorQuerySchema>;

// ─── Audit Types ─────────────────────────────────────────────────────────────
export type AuditQuery = z.infer<typeof auditQuerySchema>;

// ─── API Response Types ──────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// ─── Auth Response Types ─────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VIEWER';
}
