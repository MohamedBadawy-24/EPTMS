import { milestoneRepository } from './milestones.repository.js';
import { auditService } from '../audit/audit.service.js';
import { Errors } from '../../lib/AppError.js';
import { logger } from '../../lib/logger.js';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@scb/shared';

// ─── Milestones Service ──────────────────────────────────────────────────────

export const milestoneService = {
  async getByProject(projectId: string) {
    return milestoneRepository.findByProjectId(projectId);
  },

  async getById(id: string) {
    const milestone = await milestoneRepository.findById(id);
    if (!milestone) {
      throw Errors.notFound('Milestone', id);
    }
    return milestone;
  },

  async create(input: CreateMilestoneInput, userId: string) {
    const milestone = await milestoneRepository.create(input);

    await auditService.log({
      userId,
      action: 'CREATE',
      entity: 'MILESTONE',
      entityId: milestone.id,
      afterState: milestone,
    });

    return milestone;
  },

  /**
   * Update a milestone.
   *
   * BASELINE IMMUTABILITY — LAYER 2 (Service):
   * Even if Zod validation (Layer 1) is somehow bypassed, this layer
   * explicitly checks for baselineDate in the payload. If found:
   *   1. Logs a BASELINE_ATTEMPT to the audit table
   *   2. Throws HTTP 403 with code BASELINE_ATTEMPT
   *
   * Layer 3 (PostgreSQL trigger) is the final safety net if this layer
   * is also bypassed.
   */
  async update(id: string, input: UpdateMilestoneInput, userId: string) {
    // ─── LAYER 2: Baseline Immutability Check ─────────────────────────────
    if ('baselineDate' in input) {
      logger.warn(
        { milestoneId: id, userId },
        'BASELINE_ATTEMPT: Service layer blocked baseline date modification',
      );

      // Record the attempt in the audit log
      await auditService.log({
        userId,
        action: 'BASELINE_ATTEMPT',
        entity: 'MILESTONE',
        entityId: id,
        metadata: {
          attemptedValue: (input as Record<string, unknown>).baselineDate,
          blockedAt: 'SERVICE_LAYER',
        },
      });

      throw Errors.baselineAttempt(id);
    }
    // ─── End Layer 2 Check ────────────────────────────────────────────────

    const existing = await milestoneRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Milestone', id);
    }

    const milestone = await milestoneRepository.update(id, input);

    await auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'MILESTONE',
      entityId: id,
      beforeState: existing,
      afterState: milestone,
    });

    return milestone;
  },

  async delete(id: string, userId: string) {
    const existing = await milestoneRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Milestone', id);
    }

    await milestoneRepository.delete(id);

    await auditService.log({
      userId,
      action: 'DELETE',
      entity: 'MILESTONE',
      entityId: id,
      beforeState: existing,
    });
  },
};
