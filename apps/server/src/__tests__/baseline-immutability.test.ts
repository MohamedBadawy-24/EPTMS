import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateMilestoneSchema, createMilestoneSchema } from '@scb/shared';
import { milestoneService } from '../modules/milestones/milestones.service.js';
import { milestoneRepository } from '../modules/milestones/milestones.repository.js';
import { auditService } from '../modules/audit/audit.service.js';
import { AppError } from '../lib/AppError.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Three-Layer Baseline Immutability Invariant Test Suite', () => {
  // ─── Layer 1: Schema Validation (Zod) ──────────────────────────────────────
  describe('Layer 1: Zod Schema Strict Validation', () => {
    it('allows baselineDate on milestone creation schema', () => {
      const validCreatePayload = {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Structural Foundation Pours',
        baselineDate: new Date('2025-06-01'),
        status: 'NOT_STARTED',
      };

      const result = createMilestoneSchema.safeParse(validCreatePayload);
      expect(result.success).toBe(true);
    });

    it('REJECTS any update payload containing baselineDate (Layer 1 Defense)', () => {
      const maliciousUpdatePayload = {
        name: 'Revised Task Name',
        baselineDate: new Date('2025-07-01'), // Attempted overwrite!
        status: 'IN_PROGRESS',
      };

      const result = updateMilestoneSchema.safeParse(maliciousUpdatePayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasUnrecognizedKeyError = result.error.errors.some(
          (err) => err.code === 'unrecognized_keys' || err.path.includes('baselineDate')
        );
        expect(hasUnrecognizedKeyError).toBe(true);
      }
    });

    it('accepts valid update payload omitting baselineDate', () => {
      const validUpdatePayload = {
        name: 'Updated Milestone Name',
        forecastDate: new Date('2025-08-15'),
        status: 'IN_PROGRESS',
      };

      const result = updateMilestoneSchema.safeParse(validUpdatePayload);
      expect(result.success).toBe(true);
    });
  });

  // ─── Layer 2: Service Layer Explicit Interception & Audit ──────────────────
  describe('Layer 2: Express Service Layer Interception & Audit Logging', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('catches and blocks baselineDate if passed directly to service, throws 403 BASELINE_ATTEMPT, and logs to audit', async () => {
      const auditLogSpy = vi.spyOn(auditService, 'log').mockResolvedValue();
      const testMilestoneId = '123e4567-e89b-12d3-a456-426614174001';
      const testUserId = '123e4567-e89b-12d3-a456-426614174002';

      // Attempting to invoke service directly bypassing Zod
      const bypassedPayload: any = {
        name: 'Compromised Milestone',
        baselineDate: new Date('2025-12-01'),
      };

      await expect(
        milestoneService.update(testMilestoneId, bypassedPayload, testUserId)
      ).rejects.toThrowError(AppError);

      try {
        await milestoneService.update(testMilestoneId, bypassedPayload, testUserId);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('BASELINE_ATTEMPT');
      }

      // Verify BASELINE_ATTEMPT audit event was dispatched
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          action: 'BASELINE_ATTEMPT',
          entity: 'MILESTONE',
          entityId: testMilestoneId,
        })
      );
    });

    it('allows normal updates without baselineDate through the service', async () => {
      const testMilestoneId = '123e4567-e89b-12d3-a456-426614174001';
      const testUserId = '123e4567-e89b-12d3-a456-426614174002';

      vi.spyOn(milestoneRepository, 'findById').mockResolvedValue({
        id: testMilestoneId,
        projectId: 'project-1',
        name: 'Original Task',
        description: null,
        baselineDate: new Date('2025-05-01'),
        forecastDate: null,
        actualDate: null,
        status: 'NOT_STARTED',
        delayDays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(milestoneRepository, 'update').mockResolvedValue({
        id: testMilestoneId,
        projectId: 'project-1',
        name: 'Revised Task',
        description: null,
        baselineDate: new Date('2025-05-01'),
        forecastDate: new Date('2025-05-10'),
        actualDate: null,
        status: 'IN_PROGRESS',
        delayDays: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const auditLogSpy = vi.spyOn(auditService, 'log').mockResolvedValue();

      const result = await milestoneService.update(
        testMilestoneId,
        { name: 'Revised Task', forecastDate: new Date('2025-05-10') },
        testUserId
      );

      expect(result.name).toBe('Revised Task');
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity: 'MILESTONE',
          entityId: testMilestoneId,
        })
      );
    });
  });

  // ─── Layer 3: Database Trigger Verification ────────────────────────────────
  describe('Layer 3: PostgreSQL Raw BEFORE UPDATE Trigger Definition', () => {
    it('verifies SQL trigger file contains BEFORE UPDATE trigger preventing OLD.baseline_date != NEW.baseline_date', () => {
      const triggerSqlPath = join(__dirname, '../db/triggers/baseline_immutability.sql');
      const triggerSql = readFileSync(triggerSqlPath, 'utf-8');

      expect(triggerSql).toContain('CREATE OR REPLACE FUNCTION prevent_baseline_overwrite()');
      expect(triggerSql).toContain('IF OLD.baseline_date IS DISTINCT FROM NEW.baseline_date THEN');
      expect(triggerSql).toContain('RAISE EXCEPTION');
      expect(triggerSql).toContain('BASELINE_IMMUTABLE');
      expect(triggerSql).toContain('BEFORE UPDATE ON milestones');
    });
  });
});
