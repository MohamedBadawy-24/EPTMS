import { db } from '../../config/database.js';
import { milestones } from '../../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

// ─── Milestones Repository ───────────────────────────────────────────────────

export const milestoneRepository = {
  async findByProjectId(projectId: string) {
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(milestones.baselineDate);
  },

  async findById(id: string) {
    const [milestone] = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id))
      .limit(1);

    return milestone ?? null;
  },

  async findOverdue(limit = 10) {
    return db
      .select()
      .from(milestones)
      .where(
        and(
          sql`delay_days > 0`,
          sql`status != 'COMPLETED'`,
        ),
      )
      .orderBy(desc(sql`delay_days`))
      .limit(limit);
  },

  async create(data: typeof milestones.$inferInsert) {
    const [milestone] = await db
      .insert(milestones)
      .values(data)
      .returning();

    return milestone;
  },

  async update(id: string, data: Partial<Omit<typeof milestones.$inferInsert, 'baselineDate'>>) {
    const [milestone] = await db
      .update(milestones)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();

    return milestone ?? null;
  },

  async delete(id: string) {
    const [milestone] = await db
      .delete(milestones)
      .where(eq(milestones.id, id))
      .returning();

    return milestone ?? null;
  },

  async countByStatus(projectId?: string) {
    const baseQuery = projectId
      ? sql`SELECT status, count(*)::int as count FROM milestones WHERE project_id = ${projectId} GROUP BY status`
      : sql`SELECT status, count(*)::int as count FROM milestones GROUP BY status`;

    const result = await db.execute(baseQuery);
    return result as unknown as { status: string; count: number }[];
  },

  async countOverdue() {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(milestones)
      .where(
        and(
          sql`delay_days > 0`,
          sql`status != 'COMPLETED'`,
        ),
      );

    return result?.count ?? 0;
  },
};
