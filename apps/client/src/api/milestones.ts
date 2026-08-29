import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
} from '@scb/shared';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  baselineDate: string;
  forecastDate: string | null;
  actualDate: string | null;
  status: MilestoneStatus;
  delayDays: number;
  createdAt: string;
  updatedAt: string;
}

export function useMilestones(projectId: string | undefined) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await axiosInstance.get<{ success: boolean; data: Milestone[] }>(
        `/projects/${projectId}/milestones`
      );
      return res.data.data;
    },
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateMilestoneInput, 'projectId'>) => {
      const res = await axiosInstance.post<{ success: boolean; data: Milestone }>(
        `/projects/${projectId}/milestones`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateMilestone(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMilestoneInput }) => {
      const res = await axiosInstance.patch<{ success: boolean; data: Milestone }>(
        `/milestones/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteMilestone(projectId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/milestones/${id}`);
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
