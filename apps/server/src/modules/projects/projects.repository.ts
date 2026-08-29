import { db } from '../../config/database.js';
import { projects } from '../../db/schema/index.js';
import { eq, ilike, sql, and, desc } from 'drizzle-orm';
import type { ProjectStatus } from '@scb/shared';

// ─── Projects Repository ─────────────────────────────────────────────────────

export interface ProjectFilters {
  page: number;
  limit: number;
  search?: string;
  status?: ProjectStatus;
}

export const projectRepository = {
  async findMany(filters: ProjectFilters) {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        sql`(${ilike(projects.name, `%${filters.search}%`)} OR ${ilike(projects.code, `%${filters.search}%`)})`,
      );
    }
    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(whereClause)
        .orderBy(desc(projects.updatedAt))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(projects)
        .where(whereClause),
    ]);

    return {
      data,
      total: countResult[0]?.count ?? 0,
    };
  },

  async findById(id: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return project ?? null;
  },

  async create(data: typeof projects.$inferInsert) {
    const [project] = await db
      .insert(projects)
      .values(data)
      .returning();

    return project;
  },

  async update(id: string, data: Partial<typeof projects.$inferInsert>) {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    return project ?? null;
  },

  async delete(id: string) {
    const [project] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return project ?? null;
  },
};
