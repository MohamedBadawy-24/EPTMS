import { db } from '../../config/database.js';
import { projects, milestones, procurementItems, contractorScores } from '../../db/schema/index.js';
import { sql, eq, and } from 'drizzle-orm';
import { milestoneRepository } from '../milestones/milestones.repository.js';
import { procurementRepository } from '../procurement/procurement.repository.js';
import { contractorRepository } from '../contractors/contractors.repository.js';
import { calculateRAG } from '../../lib/ragCalculator.js';
import type { RAGStatus } from '@scb/shared';

// ─── Dashboard Service ───────────────────────────────────────────────────────
// Aggregated KPIs and pre-shaped chart data for the frontend.

export const dashboardService = {
  async getSummary() {
    // Run all aggregate queries in parallel
    const [
      projectCount,
      activeProjectCount,
      overdueCount,
      avgContractorScore,
      atRiskProcurement,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(projects)
        .where(eq(projects.status, 'ACTIVE')),
      milestoneRepository.countOverdue(),
      contractorRepository.averageOverallScore(),
      procurementRepository.countAtRisk(),
    ]);

    return {
      totalProjects: projectCount[0]?.count ?? 0,
      activeProjects: activeProjectCount[0]?.count ?? 0,
      overdueMilestones: overdueCount,
      avgContractorScore,
      atRiskProcurementItems: atRiskProcurement,
    };
  },

  async getChartData() {
    // ─── RAG Distribution ─────────────────────────────────────────────────
    const allProjects = await db.select().from(projects);
    const ragDistribution: Record<RAGStatus, number> = {
      GREEN: 0,
      AMBER: 0,
      RED: 0,
    };

    for (const project of allProjects) {
      const projectMilestones = await milestoneRepository.findByProjectId(
        project.id,
      );
      const delays = projectMilestones.map((m) => m.delayDays ?? 0);

      const rag = calculateRAG({
        milestoneDelays: delays,
        contractValue: parseFloat(project.contractValue),
        finalCost: project.finalCost ? parseFloat(project.finalCost) : null,
      });

      ragDistribution[rag]++;
    }

    // ─── Milestone Status Distribution ────────────────────────────────────
    const milestoneStatusData = await db
      .select({
        status: milestones.status,
        count: sql<number>`count(*)::int`,
      })
      .from(milestones)
      .groupBy(milestones.status);

    // ─── Recent Overdue Milestones ────────────────────────────────────────
    const recentOverdue = await milestoneRepository.findOverdue(10);

    return {
      ragDistribution: [
        { name: 'GREEN', value: ragDistribution.GREEN, color: '#22C55E' },
        { name: 'AMBER', value: ragDistribution.AMBER, color: '#F59E0B' },
        { name: 'RED', value: ragDistribution.RED, color: '#EF4444' },
      ],
      milestoneStatus: milestoneStatusData.map((item) => ({
        status: item.status,
        count: item.count,
      })),
      recentOverdue,
    };
  },
};
