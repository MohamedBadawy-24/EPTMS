import { db } from '../../config/database.js';
import { procurementItems } from '../../db/schema/index.js';
import { eq, and, lte, desc, sql } from 'drizzle-orm';
import type { ProcurementStatus } from '@scb/shared';

// ─── Procurement Repository ──────────────────────────────────────────────────

export interface ProcurementFilters {
  page: number;
  limit: number;
  status?: ProcurementStatus;
  atRisk?: boolean;
}

export const procurementRepository = {
  async findByProjectId(projectId: string, filters?: ProcurementFilters) {
    const conditions = [eq(procurementItems.projectId, projectId)];

    if (filters?.status) {
      conditions.push(eq(procurementItems.status, filters.status));
    }
    if (filters?.atRisk) {
      conditions.push(lte(procurementItems.remainingQuantity, 0));
    }

    return db
      .select()
      .from(procurementItems)
      .where(and(...conditions))
      .orderBy(desc(procurementItems.updatedAt));
  },

  async findAll(filters: ProcurementFilters) {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(procurementItems.status, filters.status));
    }
    if (filters.atRisk) {
      conditions.push(lte(procurementItems.remainingQuantity, 0));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(procurementItems)
        .where(whereClause)
        .orderBy(desc(procurementItems.updatedAt))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(procurementItems)
        .where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  },

  async findById(id: string) {
    const [item] = await db
      .select()
      .from(procurementItems)
      .where(eq(procurementItems.id, id))
      .limit(1);

    return item ?? null;
  },

  async create(data: typeof procurementItems.$inferInsert) {
    const [item] = await db
      .insert(procurementItems)
      .values(data)
      .returning();

    return item;
  },

  async update(id: string, data: Partial<typeof procurementItems.$inferInsert>) {
    const [item] = await db
      .update(procurementItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(procurementItems.id, id))
      .returning();

    return item ?? null;
  },

  async delete(id: string) {
    const [item] = await db
      .delete(procurementItems)
      .where(eq(procurementItems.id, id))
      .returning();

    return item ?? null;
  },

  async countAtRisk() {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(procurementItems)
      .where(lte(procurementItems.remainingQuantity, 0));

    return result?.count ?? 0;
  },
};
