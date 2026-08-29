import { db } from '../../config/database.js';
import { contractorScores } from '../../db/schema/index.js';
import { eq, ilike, desc, sql } from 'drizzle-orm';

// ─── Contractors Repository ──────────────────────────────────────────────────

export interface ContractorFilters {
  page: number;
  limit: number;
  search?: string;
}

export const contractorRepository = {
  async findMany(filters: ContractorFilters) {
    const conditions = [];

    if (filters.search) {
      conditions.push(
        ilike(contractorScores.contractorName, `%${filters.search}%`),
      );
    }

    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(contractorScores)
        .where(whereClause)
        .orderBy(desc(contractorScores.overallScore))
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contractorScores)
        .where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  },

  async findByProjectId(projectId: string) {
    return db
      .select()
      .from(contractorScores)
      .where(eq(contractorScores.projectId, projectId))
      .orderBy(desc(contractorScores.overallScore));
  },

  async findById(id: string) {
    const [score] = await db
      .select()
      .from(contractorScores)
      .where(eq(contractorScores.id, id))
      .limit(1);

    return score ?? null;
  },

  async create(data: typeof contractorScores.$inferInsert) {
    const [score] = await db
      .insert(contractorScores)
      .values(data)
      .returning();

    return score;
  },

  async update(id: string, data: Partial<typeof contractorScores.$inferInsert>) {
    const [score] = await db
      .update(contractorScores)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contractorScores.id, id))
      .returning();

    return score ?? null;
  },

  async delete(id: string) {
    const [score] = await db
      .delete(contractorScores)
      .where(eq(contractorScores.id, id))
      .returning();

    return score ?? null;
  },

  async averageOverallScore() {
    const [result] = await db
      .select({ avg: sql<number>`ROUND(AVG(overall_score)::numeric, 1)::real` })
      .from(contractorScores);

    return result?.avg ?? 0;
  },
};
