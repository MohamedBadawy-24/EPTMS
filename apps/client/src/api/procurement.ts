import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type {
  CreateProcurementInput,
  UpdateProcurementInput,
  ProcurementQuery,
  PaginatedResponse,
  ProcurementStatus,
} from '@scb/shared';

export interface ProcurementItem {
  id: string;
  projectId: string;
  itemName: string;
  description: string | null;
  tenderQuantity: number;
  allocatedQuantity: number;
  deliveredQuantity: number;
  unitCost: string;
  status: ProcurementStatus;
  remainingQuantity: number; // Generated Column
  createdAt: string;
  updatedAt: string;
}

export function useProcurement(query?: Partial<ProcurementQuery>) {
  return useQuery<PaginatedResponse<ProcurementItem>>({
    queryKey: ['procurement', query],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResponse<ProcurementItem>>('/procurement', {
        params: query,
      });
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useProjectProcurement(projectId: string | undefined) {
  return useQuery<ProcurementItem[]>({
    queryKey: ['procurement', 'project', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await axiosInstance.get<{ success: boolean; data: ProcurementItem[] }>(
        `/projects/${projectId}/procurement`
      );
      return res.data.data;
    },
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}

export function useCreateProcurement(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProcurementInput) => {
      const targetProjectId = projectId || data.projectId;
      const res = await axiosInstance.post<{ success: boolean; data: ProcurementItem }>(
        `/projects/${targetProjectId}/procurement`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['procurement', 'project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProcurement(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProcurementInput }) => {
      const res = await axiosInstance.patch<{ success: boolean; data: ProcurementItem }>(
        `/procurement/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['procurement', 'project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProcurement(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/procurement/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['procurement', 'project', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
