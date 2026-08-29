import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type { AuditQuery, AuditAction, AuditEntity, PaginatedResponse } from '@scb/shared';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useAuditLogs(query?: Partial<AuditQuery>) {
  return useQuery<PaginatedResponse<AuditLogEntry>>({
    queryKey: ['audit', query],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResponse<AuditLogEntry>>('/audit', {
        params: query,
      });
      return res.data;
    },
    staleTime: 5_000,
  });
}
