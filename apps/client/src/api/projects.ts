import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateStoppageInput,
  UpdateStoppageInput,
  ProjectQuery,
  PaginatedResponse,
  RAGStatus,
  ProjectStatus,
  TimelineAnalysis,
  ProjectStoppage,
} from '@scb/shared';

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  contractValue: string;
  finalCost: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  ragStatus: RAGStatus;
  timeline?: TimelineAnalysis;
}

export function useProjects(query?: Partial<ProjectQuery>) {
  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', query],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResponse<Project>>('/projects', {
        params: query,
      });
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      const res = await axiosInstance.get<{ success: boolean; data: Project }>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await axiosInstance.post<{ success: boolean; data: Project }>('/projects', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProjectInput) => {
      const res = await axiosInstance.patch<{ success: boolean; data: Project }>(`/projects/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ─── Stoppages Mutations ──────────────────────────────────────────────────────

export function useCreateStoppage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStoppageInput) => {
      const res = await axiosInstance.post<{ success: boolean; data: ProjectStoppage }>(
        `/projects/${projectId}/stoppages`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateStoppage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stoppageId,
      data,
    }: {
      stoppageId: string;
      data: UpdateStoppageInput;
    }) => {
      const res = await axiosInstance.patch<{ success: boolean; data: ProjectStoppage }>(
        `/projects/${projectId}/stoppages/${stoppageId}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteStoppage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stoppageId: string) => {
      await axiosInstance.delete(`/projects/${projectId}/stoppages/${stoppageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
