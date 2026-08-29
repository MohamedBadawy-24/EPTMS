import { procurementRepository } from './procurement.repository.js';
import type { ProcurementFilters } from './procurement.repository.js';
import { auditService } from '../audit/audit.service.js';
import { Errors } from '../../lib/AppError.js';
import type { CreateProcurementInput, UpdateProcurementInput } from '@scb/shared';

// ─── Procurement Service ─────────────────────────────────────────────────────

export const procurementService = {
  async getByProject(projectId: string) {
    return procurementRepository.findByProjectId(projectId);
  },

  async getAll(filters: ProcurementFilters) {
    const { data, total } = await procurementRepository.findAll(filters);

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

  async getById(id: string) {
    const item = await procurementRepository.findById(id);
    if (!item) {
      throw Errors.notFound('Procurement item', id);
    }
    return item;
  },

  async create(input: CreateProcurementInput, userId: string) {
    const item = await procurementRepository.create({
      ...input,
      unitCost: input.unitCost.toString(),
    });

    await auditService.log({
      userId,
      action: 'CREATE',
      entity: 'PROCUREMENT_ITEM',
      entityId: item.id,
      afterState: item,
    });

    return item;
  },

  async update(id: string, input: UpdateProcurementInput, userId: string) {
    const existing = await procurementRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Procurement item', id);
    }

    const updateData: Record<string, unknown> = { ...input };
    if (input.unitCost !== undefined) {
      updateData.unitCost = input.unitCost.toString();
    }

    const item = await procurementRepository.update(id, updateData as any);

    await auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'PROCUREMENT_ITEM',
      entityId: id,
      beforeState: existing,
      afterState: item,
    });

    return item;
  },

  async delete(id: string, userId: string) {
    const existing = await procurementRepository.findById(id);
    if (!existing) {
      throw Errors.notFound('Procurement item', id);
    }

    await procurementRepository.delete(id);

    await auditService.log({
      userId,
      action: 'DELETE',
      entity: 'PROCUREMENT_ITEM',
      entityId: id,
      beforeState: existing,
    });
  },
};
