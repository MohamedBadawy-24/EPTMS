import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { MilestoneStatusCount } from '@/api/dashboard';

export interface MilestoneStatusBarChartProps {
  data: MilestoneStatusCount[];
  isLoading?: boolean;
}

const statusColorMap: Record<string, string> = {
  COMPLETED: '#22C55E',
  IN_PROGRESS: '#0047BA',
  NOT_STARTED: '#6C7278',
  ON_HOLD: '#F59E0B',
};

const statusLabelMap: Record<string, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  NOT_STARTED: 'Not Started',
  ON_HOLD: 'On Hold',
};

export const MilestoneStatusBarChart: React.FC<MilestoneStatusBarChartProps> = ({ data, isLoading = false }) => {
  const formattedData = data.map((d) => ({
    rawStatus: d.status,
    status: statusLabelMap[d.status] || d.status,
    count: d.count,
    color: statusColorMap[d.status] || '#0047BA',
  }));

  const totalMilestones = data.reduce((sum, d) => sum + d.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-scb-warm shadow-md text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-scb-dark">{item.status}</span>
          </div>
          <p className="text-scb-dark-muted font-medium">
            Milestones: <span className="font-bold text-scb-dark">{item.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          <span>Milestone Execution Status</span>
          <span className="text-xs font-normal text-scb-dark-muted">Total: {totalMilestones}</span>
        </CardTitle>
        <CardDescription>Breakdown of all program milestones by active delivery lifecycle</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center pb-6">
        {isLoading ? (
          <div className="w-full h-56 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-scb-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : formattedData.length === 0 ? (
          <div className="w-full h-56 flex items-center justify-center text-xs text-scb-dark-muted font-medium">
            No milestone execution data available.
          </div>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE6E1" />
                <XAxis
                  dataKey="status"
                  axisLine={{ stroke: '#D6D1CA' }}
                  tickLine={false}
                  tick={{ fill: '#4A4F54', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={{ stroke: '#D6D1CA' }}
                  tickLine={false}
                  tick={{ fill: '#6C7278', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 71, 186, 0.04)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {formattedData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
