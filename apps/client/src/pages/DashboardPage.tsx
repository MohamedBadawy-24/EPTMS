import React from 'react';
import { useDashboardSummary, useDashboardCharts } from '@/api/dashboard';
import { KPICard } from '@/components/dashboard/KPICard';
import { RAGDonutChart } from '@/components/dashboard/RAGDonutChart';
import { MilestoneStatusBarChart } from '@/components/dashboard/MilestoneStatusBarChart';
import { OverdueMilestonesTable } from '@/components/dashboard/OverdueMilestonesTable';
import {
  Briefcase,
  Activity,
  AlertOctagon,
  HardHat,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const DashboardPage: React.FC = () => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isRefetching: isSummaryRefetching,
  } = useDashboardSummary();

  const {
    data: charts,
    isLoading: isChartsLoading,
    refetch: refetchCharts,
    isRefetching: isChartsRefetching,
  } = useDashboardCharts();

  const handleRefresh = () => {
    refetchSummary();
    refetchCharts();
  };

  const isRefreshing = isSummaryRefetching || isChartsRefetching;

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scb-warm/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-scb-blue uppercase tracking-widest bg-scb-blue-light px-2 py-0.5 rounded border border-scb-blue/20">
              Engineering Governance
            </span>
            <span className="text-xs text-scb-dark-muted">•</span>
            <span className="text-xs text-scb-dark-muted font-medium">Suez Canal Bank HQ</span>
          </div>
          <h1 className="text-2xl font-black text-scb-dark tracking-tight">
            Executive Portfolio Control Dashboard
          </h1>
          <p className="text-xs text-scb-dark-muted mt-0.5">
            Real-time project controls, immutable schedule tracking, and automated financial risk derivation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="text-xs font-semibold shadow-sm gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Portfolio"
          value={summary?.totalProjects ?? 0}
          subtitle="All capital & tech projects"
          icon={Briefcase}
          color="blue"
          trendText="100% Tracked in EPCMS"
          isLoading={isSummaryLoading}
        />

        <KPICard
          title="Active Projects"
          value={summary?.activeProjects ?? 0}
          subtitle="Currently under execution"
          icon={Activity}
          color="green"
          trendText={`${summary ? Math.round(((summary.activeProjects) / Math.max(1, summary.totalProjects)) * 100) : 0}% Active Rate`}
          isLoading={isSummaryLoading}
        />

        <KPICard
          title="Overdue Milestones"
          value={summary?.overdueMilestones ?? 0}
          subtitle="Tasks with schedule slippage"
          icon={AlertOctagon}
          color={summary?.overdueMilestones && summary.overdueMilestones > 0 ? 'red' : 'green'}
          trendText={summary?.overdueMilestones && summary.overdueMilestones > 0 ? 'Requires PM Review' : 'Zero Slippage'}
          isLoading={isSummaryLoading}
        />

        <KPICard
          title="Avg Contractor Rating"
          value={summary?.avgContractorScore ? `${summary.avgContractorScore} / 100` : '—'}
          subtitle="Evaluated across 6 criteria"
          icon={HardHat}
          color="amber"
          trendText="Quality & Safety Weighted"
          isLoading={isSummaryLoading}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RAG Status Donut Chart */}
        <div className="lg:col-span-5">
          <RAGDonutChart
            data={charts?.ragDistribution || [
              { name: 'GREEN', value: 0, color: '#22C55E' },
              { name: 'AMBER', value: 0, color: '#F59E0B' },
              { name: 'RED', value: 0, color: '#EF4444' },
            ]}
            isLoading={isChartsLoading}
          />
        </div>

        {/* Milestone Delivery Status Bar Chart */}
        <div className="lg:col-span-7">
          <MilestoneStatusBarChart
            data={charts?.milestoneStatus || []}
            isLoading={isChartsLoading}
          />
        </div>
      </div>

      {/* Critical Overdue Milestones Table */}
      <div className="pt-2">
        <OverdueMilestonesTable
          milestones={charts?.recentOverdue || []}
          isLoading={isChartsLoading}
        />
      </div>
    </div>
  );
};
