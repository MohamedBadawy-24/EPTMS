import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type {
  CreateContractorInput,
  UpdateContractorInput,
  ContractorQuery,
  PaginatedResponse,
} from '@scb/shared';

export interface ContractorScore {
  id: string;
  contractorName: string;
  projectId: string;
  schedule: number;
  quality: number;
  resources: number;
  safety: number;
  coordination: number;
  docs: number;
  overallScore: number; // Generated Column
  createdAt: string;
  updatedAt: string;
}

export function useContractors(query?: Partial<ContractorQuery>) {
  return useQuery<PaginatedResponse<ContractorScore>>({
    queryKey: ['contractors', query],
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedResponse<ContractorScore>>('/contractors', {
        params: query,
      });
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useCreateContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateContractorInput) => {
      const res = await axiosInstance.post<{ success: boolean; data: ContractorScore }>('/contractors', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContractorInput }) => {
      const res = await axiosInstance.patch<{ success: boolean; data: ContractorScore }>(
        `/contractors/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/contractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
