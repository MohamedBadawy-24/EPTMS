import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import type { RAGDistributionItem } from '@/api/dashboard';

export interface RAGDonutChartProps {
  data: RAGDistributionItem[];
  isLoading?: boolean;
}

export const RAGDonutChart: React.FC<RAGDonutChartProps> = ({ data, isLoading = false }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as RAGDistributionItem;
      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <div className="bg-white p-3 rounded-lg border border-scb-warm shadow-md text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-bold text-scb-dark">{item.name} Health</span>
          </div>
          <p className="text-scb-dark-muted font-medium">
            Projects: <span className="font-bold text-scb-dark">{item.value}</span> ({pct}%)
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
          <span>Portfolio Health (RAG)</span>
          <span className="text-xs font-normal text-scb-dark-muted">Automated Derivation</span>
        </CardTitle>
        <CardDescription>Live health distribution derived from schedule delays & cost overrun</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-between pb-6">
        {isLoading ? (
          <div className="w-full h-56 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-scb-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : total === 0 ? (
          <div className="w-full h-56 flex items-center justify-center text-xs text-scb-dark-muted font-medium">
            No project data available.
          </div>
        ) : (
          <div className="w-full relative flex items-center justify-center h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="#ffffff"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Summary Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-scb-dark">{total}</span>
              <span className="text-[10px] uppercase tracking-wider text-scb-dark-muted font-semibold">Total Projects</span>
            </div>
          </div>
        )}

        {/* Custom Legend */}
        <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-scb-warm/40 mt-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex flex-col items-center p-2 rounded-md bg-scb-offwhite/60 text-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-scb-dark">{item.name}</span>
                </div>
                <span className="text-sm font-black text-scb-dark">{item.value}</span>
                <span className="text-[10px] text-scb-dark-muted font-medium">{pct}% of total</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
