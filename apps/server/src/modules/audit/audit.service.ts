import { auditRepository } from './audit.repository.js';
import type { CreateAuditEntry, AuditFilters } from './audit.repository.js';
import { logger } from '../../lib/logger.js';

// ─── Audit Service ───────────────────────────────────────────────────────────

export const auditService = {
  /**
   * Records an audit log entry.
   * Fire-and-forget — errors are logged but do not propagate.
   */
  async log(entry: CreateAuditEntry): Promise<void> {
    try {
      await auditRepository.create(entry);
      logger.debug(
        { action: entry.action, entity: entry.entity, entityId: entry.entityId },
        'Audit entry recorded',
      );
    } catch (error) {
      // Audit logging should never break the main operation
      logger.error({ err: error, entry }, 'Failed to write audit log entry');
    }
  },

  /**
   * Query audit logs with pagination and filters.
   */
  async query(filters: AuditFilters) {
    const { data, total } = await auditRepository.findMany(filters);

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  },
};
