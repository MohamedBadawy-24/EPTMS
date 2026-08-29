import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';
import type { RAGStatus } from '@scb/shared';

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  overdueMilestones: number;
  avgContractorScore: number;
  atRiskProcurementItems: number;
}

export interface RAGDistributionItem {
  name: RAGStatus;
  value: number;
  color: string;
}

export interface MilestoneStatusCount {
  status: string;
  count: number;
}

export interface OverdueMilestone {
  id: string;
  projectId: string;
  name: string;
  baselineDate: string;
  forecastDate: string | null;
  actualDate: string | null;
  status: string;
  delayDays: number;
}

export interface DashboardChartsData {
  ragDistribution: RAGDistributionItem[];
  milestoneStatus: MilestoneStatusCount[];
  recentOverdue: OverdueMilestone[];
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary');
      return res.data.data;
    },
    staleTime: 30_000,
  });
}

export function useDashboardCharts() {
  return useQuery<DashboardChartsData>({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ success: boolean; data: DashboardChartsData }>('/dashboard/charts');
      return res.data.data;
    },
    staleTime: 30_000,
  });
}
