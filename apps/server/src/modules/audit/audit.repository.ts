import { db } from '../../config/database.js';
import { auditLog } from '../../db/schema/index.js';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import type { AuditAction, AuditEntity } from '@scb/shared';

// ─── Audit Repository ────────────────────────────────────────────────────────

export interface CreateAuditEntry {
  userId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
}

export interface AuditFilters {
  action?: AuditAction;
  entity?: AuditEntity;
  userId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export const auditRepository = {
  async create(entry: CreateAuditEntry) {
    const [record] = await db
      .insert(auditLog)
      .values({
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        beforeState: entry.beforeState ?? null,
        afterState: entry.afterState ?? null,
        metadata: entry.metadata ?? null,
      })
      .returning();

    return record;
  },

  async findMany(filters: AuditFilters) {
    const conditions = [];

    if (filters.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }
    if (filters.entity) {
      conditions.push(eq(auditLog.entity, filters.entity));
    }
    if (filters.userId) {
      conditions.push(eq(auditLog.userId, filters.userId));
    }
    if (filters.from) {
      conditions.push(gte(auditLog.createdAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(auditLog.createdAt, filters.to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(auditLog)
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLog)
        .where(whereClause),
    ]);

    return {
      data,
      total: countResult[0]?.count ?? 0,
    };
  },
};
