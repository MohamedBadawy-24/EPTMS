import { projectRepository } from './projects.repository.js';
import type { ProjectFilters } from './projects.repository.js';
import { stoppageRepository } from './stoppages.repository.js';
import { milestoneRepository } from '../milestones/milestones.repository.js';
import { auditService } from '../audit/audit.service.js';
import { calculateRAG } from '../../lib/ragCalculator.js';
import { calculateTimeline } from './timelineCalculator.js';
import { Errors } from '../../lib/AppError.js';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateStoppageInput,
  UpdateStoppageInput,
  RAGStatus,
} from '@scb/shared';

// ─── Projects Service ────────────────────────────────────────────────────────

export const projectService = {
  async getAll(filters: ProjectFilters & { rag?: RAGStatus }) {
    const { data: rawProjects, total } = await projectRepository.findMany(filters);

    // Attach computed RAG status to each project
    const projectsWithRAG = await Promise.all(
      rawProjects.map(async (project) => {
        const milestones = await milestoneRepository.findByProjectId(project.id);
        const delays = milestones.map((m) => m.delayDays ?? 0);

        const ragStatus = calculateRAG({
          milestoneDelays: delays,
          contractValue: parseFloat(project.contractValue),
          finalCost: project.finalCost ? parseFloat(project.finalCost) : null,
        });

        return { ...project, ragStatus };
      }),
    );

    // Apply RAG filter if specified (post-computation since RAG is not stored)
    const filtered = filters.rag
      ? projectsWithRAG.filter((p) => p.ragStatus === filters.rag)
      : projectsWithRAG;

    return {
      data: filtered,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: filters.rag ? filtered.length : total,
        totalPages: Math.ceil(
          (filters.rag ? filtered.length : total) / filters.limit,
        ),
      },
    };
  },

  async getById(id: string) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw Errors.notFound('Project', id);
    }

    // Compute RAG and Timeline on-the-fly
    const [milestones, stoppages] = await Promise.all([
      milestoneRepository.findByProjectId(id),
      stoppageRepository.findByProjectId(id),
    ]);

    const delays = milestones.map((m) => m.delayDays ?? 0);

    const ragStatus = calculateRAG({
      milestoneDelays: delays,
      contractValue: parseFloat(project.contractValue),
      finalCost: project.finalCost ? parseFloat(project.finalCost) : null,
    });

    const timeline = calculateTimeline({
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      updatedAt: project.updatedAt,
      stoppages,
      milestones,
    });

    return { ...project, ragStatus, timeline };
  },

  async create(input: CreateProjectInput, userId: string) {
    const project = await projectRepository.create({
      ...input,
      contractValue: input.contractValue.toString(),
      finalCost: input.finalCost?.toString() ?? null,
      createdBy: userId,
    });

    await auditService.log({
      userId,
      action: 'CREATE',
      entity: 'PROJECT',
      entityId: project.id,
      afterState: project,
    });

    return project;
  },

  async update(id: string, input: UpdateProjectInput, userId: string) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Project', id);
    }

    const updateData: Record<string, unknown> = { ...input };
    if (input.contractValue !== undefined) {
      updateData.contractValue = input.contractValue.toString();
    }
    if (input.finalCost !== undefined) {
      updateData.finalCost = input.finalCost?.toString() ?? null;
    }

    const project = await projectRepository.update(id, updateData as any);

    await auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'PROJECT',
      entityId: id,
      beforeState: existing,
      afterState: project,
    });

    return project;
  },

  async delete(id: string, userId: string) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Project', id);
    }

    await projectRepository.delete(id);

    await auditService.log({
      userId,
      action: 'DELETE',
      entity: 'PROJECT',
      entityId: id,
      beforeState: existing,
    });
  },

  // ─── Stoppages & Dynamic Extensions ────────────────────────────────────────

  async getStoppages(projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw Errors.notFound('Project', projectId);
    }

    return stoppageRepository.findByProjectId(projectId);
  },

  async createStoppage(projectId: string, input: CreateStoppageInput, userId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw Errors.notFound('Project', projectId);
    }

    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : null;
    const daysAdded = endDate
      ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const stoppage = await stoppageRepository.create({
      projectId,
      reason: input.reason,
      daysAdded,
      startDate,
      endDate,
    });

    await auditService.log({
      userId,
      action: 'CREATE',
      entity: 'PROJECT',
      entityId: projectId,
      metadata: {
        event: 'STOPPAGE_ADDED',
        stoppageId: stoppage.id,
        reason: stoppage.reason,
        isOngoing: !endDate,
        daysAdded,
      },
      afterState: stoppage,
    });

    return stoppage;
  },

  async updateStoppage(
    projectId: string,
    stoppageId: string,
    input: UpdateStoppageInput,
    userId: string
  ) {
    const existing = await stoppageRepository.findById(stoppageId);
    if (!existing || existing.projectId !== projectId) {
      throw Errors.notFound('Stoppage', stoppageId);
    }

    const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
    const endDate =
      input.endDate !== undefined
        ? input.endDate
          ? new Date(input.endDate)
          : null
        : existing.endDate;

    const daysAdded = endDate
      ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const updated = await stoppageRepository.update(stoppageId, {
      reason: input.reason ?? existing.reason,
      startDate,
      endDate,
      daysAdded,
    });

    await auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'PROJECT',
      entityId: projectId,
      metadata: {
        event: 'STOPPAGE_UPDATED',
        stoppageId,
        isOngoing: !endDate,
        daysAdded,
      },
      beforeState: existing,
      afterState: updated,
    });

    return updated;
  },

  async deleteStoppage(projectId: string, stoppageId: string, userId: string) {
    const stoppage = await stoppageRepository.findById(stoppageId);
    if (!stoppage || stoppage.projectId !== projectId) {
      throw Errors.notFound('Stoppage', stoppageId);
    }

    await stoppageRepository.delete(stoppageId);

    await auditService.log({
      userId,
      action: 'DELETE',
      entity: 'PROJECT',
      entityId: projectId,
      metadata: {
        event: 'STOPPAGE_REMOVED',
        stoppageId,
        daysRemoved: stoppage.daysAdded,
      },
      beforeState: stoppage,
    });
  },
};
