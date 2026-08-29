import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { OverdueMilestone } from '@/api/dashboard';

export interface OverdueMilestonesTableProps {
  milestones: OverdueMilestone[];
  isLoading?: boolean;
}

export const OverdueMilestonesTable: React.FC<OverdueMilestonesTableProps> = ({ milestones, isLoading = false }) => {
  const navigate = useNavigate();

  const columns: Column<OverdueMilestone>[] = [
    {
      key: 'name',
      header: 'Milestone / Task Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-scb-dark text-xs">{row.name}</span>
            <span className="text-[10px] text-scb-dark-muted font-mono">{row.id.slice(0, 8)}...</span>
          </div>
        </div>
      ),
    },
    {
      key: 'baselineDate',
      header: 'Locked Baseline Date',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-scb-dark">
          <Clock className="w-3.5 h-3.5 text-scb-dark-muted" />
          <span className="font-medium font-mono">{formatDate(row.baselineDate)}</span>
        </div>
      ),
    },
    {
      key: 'forecastDate',
      header: 'Forecasted Target',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono font-medium text-scb-dark">
          {formatDate(row.forecastDate)}
        </span>
      ),
    },
    {
      key: 'delayDays',
      header: 'Schedule Slippage',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
          +{row.delayDays} days late
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${row.projectId}`);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-scb-blue hover:text-scb-blue-hover transition-colors p-1"
        >
          <span>View Project</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Critical Overdue Milestones</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold">
                {milestones.length} At Risk
              </span>
            </CardTitle>
            <CardDescription>
              Tasks exceeding their immutable baseline date with ongoing delivery delay
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="p-0 border-t border-scb-warm/40">
        <DataTable
          columns={columns}
          data={milestones}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No overdue milestones across the active portfolio. Excellent schedule compliance!"
          pageSize={5}
          rowHighlight={(row) => (row.delayDays > 14 ? 'red' : 'amber')}
          className="border-0 rounded-none shadow-none"
        />
      </div>
    </Card>
  );
};
