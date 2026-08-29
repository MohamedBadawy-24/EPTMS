import { contractorRepository } from './contractors.repository.js';
import type { ContractorFilters } from './contractors.repository.js';
import { auditService } from '../audit/audit.service.js';
import { Errors } from '../../lib/AppError.js';
import type { CreateContractorInput, UpdateContractorInput } from '@scb/shared';

// ─── Contractors Service ─────────────────────────────────────────────────────

export const contractorService = {
  async getAll(filters: ContractorFilters) {
    const { data, total } = await contractorRepository.findMany(filters);

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

  async getByProject(projectId: string) {
    return contractorRepository.findByProjectId(projectId);
  },

  async getById(id: string) {
    const score = await contractorRepository.findById(id);
    if (!score) {
      throw Errors.notFound('Contractor score', id);
    }
    return score;
  },

  async create(input: CreateContractorInput, userId: string) {
    const score = await contractorRepository.create(input);

    await auditService.log({
      userId,
      action: 'CREATE',
      entity: 'CONTRACTOR_SCORE',
      entityId: score.id,
      afterState: score,
    });

    return score;
  },

  async update(id: string, input: UpdateContractorInput, userId: string) {
    const existing = await contractorRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Contractor score', id);
    }

    const score = await contractorRepository.update(id, input);

    await auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'CONTRACTOR_SCORE',
      entityId: id,
      beforeState: existing,
      afterState: score,
    });

    return score;
  },

  async delete(id: string, userId: string) {
    const existing = await contractorRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Contractor score', id);
    }

    await contractorRepository.delete(id);

    await auditService.log({
      userId,
      action: 'DELETE',
      entity: 'CONTRACTOR_SCORE',
      entityId: id,
      beforeState: existing,
    });
  },
};
