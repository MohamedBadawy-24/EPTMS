import { db } from '../../config/database.js';
import { projectStoppages } from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

export const stoppageRepository = {
  async findByProjectId(projectId: string) {
    return db
      .select()
      .from(projectStoppages)
      .where(eq(projectStoppages.projectId, projectId))
      .orderBy(desc(projectStoppages.startDate));
  },

  async findById(id: string) {
    const [stoppage] = await db
      .select()
      .from(projectStoppages)
      .where(eq(projectStoppages.id, id))
      .limit(1);

    return stoppage ?? null;
  },

  async create(data: typeof projectStoppages.$inferInsert) {
    const [stoppage] = await db
      .insert(projectStoppages)
      .values(data)
      .returning();

    return stoppage;
  },

  async update(id: string, data: Partial<typeof projectStoppages.$inferInsert>) {
    const [stoppage] = await db
      .update(projectStoppages)
      .set(data)
      .where(eq(projectStoppages.id, id))
      .returning();

    return stoppage ?? null;
  },

  async delete(id: string) {
    const [stoppage] = await db
      .delete(projectStoppages)
      .where(eq(projectStoppages.id, id))
      .returning();

    return stoppage ?? null;
  },
};
