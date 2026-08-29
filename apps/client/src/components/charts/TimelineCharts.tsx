import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { TimelineAnalysis, ProjectStoppage } from '@scb/shared';
import {
  Calendar,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  TrendingDown,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface TimelineChartsProps {
  timeline?: TimelineAnalysis;
  isAdmin: boolean;
  onAddStoppage: () => void;
  onEditStoppage: (stoppage: ProjectStoppage) => void;
  onDeleteStoppage: (stoppageId: string) => void;
  isDeletingStoppage?: boolean;
}

export const TimelineCharts: React.FC<TimelineChartsProps> = ({
  timeline,
  isAdmin,
  onAddStoppage,
  onEditStoppage,
  onDeleteStoppage,
  isDeletingStoppage,
}) => {
  if (!timeline) return null;

  const {
    originalContractDays,
    totalStoppageDays,
    adjustedTimelineDays,
    originalStartDate,
    originalEndDate,
    adjustedEndDate,
    actualDaysElapsed,
    timeElapsedPercentage,
    physicalProgressPercentage,
    overrunDays,
    isFrozen,
    alerts,
    stoppages,
  } = timeline;

  const hasOngoingStoppages = stoppages.some((s) => s.isOngoing);

  // Stacked Bar Data
  const stackData = [
    {
      name: 'Baseline Model',
      originalDays: originalContractDays,
      stoppageDays: totalStoppageDays,
      total: adjustedTimelineDays,
    },
  ];

  // Execution Progress Data
  const velocityLag = timeElapsedPercentage - physicalProgressPercentage;
  const isOverdue = actualDaysElapsed > adjustedTimelineDays;

  return (
    <div className="space-y-6">
      {/* ─── Automated Risk & Velocity Alerts ──────────────────────────────── */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-sm transition-all ${
                  isCritical
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                {isCritical ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight">{alert.title}</span>
                    <Badge
                      variant={isCritical ? 'danger' : isWarning ? 'warning' : 'success'}
                      size="sm"
                    >
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="leading-relaxed opacity-90">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── High-Density Timeline Metrics Grid ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-scb-warm/60 space-y-1">
          <div className="flex items-center justify-between text-scb-dark-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Original Duration</span>
            <Calendar className="w-4 h-4 text-scb-blue" />
          </div>
          <div className="text-xl font-black text-scb-dark">{originalContractDays} <span className="text-xs font-normal text-scb-dark-muted">Days</span></div>
          <div className="text-[10px] text-scb-dark-muted truncate">
            {formatDate(originalStartDate)} → {formatDate(originalEndDate)}
          </div>
        </Card>

        <Card className="p-4 bg-white border-scb-warm/60 space-y-1">
          <div className="flex items-center justify-between text-scb-dark-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Stoppages</span>
            <Clock className={`w-4 h-4 ${hasOngoingStoppages ? 'text-amber-600 animate-pulse' : 'text-amber-500'}`} />
          </div>
          <div className="text-xl font-black text-amber-600 flex items-center gap-1.5">
            <span>+{totalStoppageDays}</span>
            <span className="text-xs font-normal text-scb-dark-muted">
              Days ({stoppages.length} {stoppages.length === 1 ? 'event' : 'events'})
            </span>
            {hasOngoingStoppages && (
              <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                Live
              </span>
            )}
          </div>
          <div className="text-[10px] text-scb-dark-muted">
            {hasOngoingStoppages ? 'Dynamically growing daily' : 'Official Contract Extensions'}
          </div>
        </Card>

        <Card className="p-4 bg-white border-scb-warm/60 space-y-1">
          <div className="flex items-center justify-between text-scb-dark-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Adjusted Timeline</span>
            <ShieldCheck className="w-4 h-4 text-scb-blue" />
          </div>
          <div className="text-xl font-black text-scb-blue">
            {adjustedTimelineDays} <span className="text-xs font-normal text-scb-dark-muted">Days</span>
          </div>
          <div className="text-[10px] text-scb-dark-muted truncate">
            New Deadline: <span className="font-semibold text-scb-dark">{formatDate(adjustedEndDate)}</span>
          </div>
        </Card>

        <Card
          className={`p-4 bg-white border-scb-warm/60 space-y-1 ${
            isOverdue ? 'border-rose-300 bg-rose-50/30' : ''
          }`}
        >
          <div className="flex items-center justify-between text-scb-dark-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isFrozen ? 'Completed Duration' : 'Actual Days Elapsed'}
            </span>
            {isFrozen ? (
              <Lock className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className={`w-4 h-4 ${isOverdue ? 'text-rose-600' : 'text-scb-dark'}`} />
            )}
          </div>
          <div className="text-xl font-black flex items-baseline gap-1.5">
            <span className={isOverdue ? 'text-rose-600' : 'text-scb-dark'}>
              {actualDaysElapsed}
            </span>
            <span className="text-xs font-normal text-scb-dark-muted">Days ({timeElapsedPercentage}%)</span>
          </div>
          <div className="text-[10px] text-scb-dark-muted">
            {isFrozen ? (
              <span className="text-emerald-700 font-semibold">Frozen at project completion</span>
            ) : isOverdue ? (
              <span className="text-rose-600 font-semibold">+{overrunDays}d contractual overrun</span>
            ) : (
              <span>{adjustedTimelineDays - actualDaysElapsed} days remaining</span>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Dual Charts Section ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Contract & Stoppage Stack */}
        <Card className="p-5 bg-white border-scb-warm/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-scb-warm/40">
              <div>
                <CardTitle className="text-sm font-bold text-scb-dark flex items-center gap-2">
                  <span>Contract & Stoppage Stack</span>
                  <Badge variant="outline" size="sm">Adjusted Baseline</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-scb-dark-muted mt-0.5">
                  Original contract duration vs. dynamic extension buffer (التوقفات)
                </CardDescription>
              </div>
            </div>

            <div className="h-44 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stackData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, Math.ceil(adjustedTimelineDays * 1.15)]}
                    tick={{ fontSize: 11, fill: '#4A4F54' }}
                    unit=" days"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    hide
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-scb-dark text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-scb-dark/80">
                          <p className="font-bold border-b border-white/20 pb-1">Contractual Baseline Breakdown</p>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-300">Original Contract:</span>
                            <span className="font-bold text-scb-blue-light">{originalContractDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-amber-300">Stoppages Added:</span>
                            <span className="font-bold text-amber-300">+{totalStoppageDays} days</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-white/20">
                            <span className="font-bold text-white">Adjusted Total:</span>
                            <span className="font-bold text-white">{adjustedTimelineDays} days</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="originalDays"
                    name="Original Contract"
                    stackId="a"
                    fill="#0047BA"
                    radius={[4, 0, 0, 4]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="stoppageDays"
                    name="Stoppages Added"
                    stackId="a"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-scb-warm/40 text-scb-dark-muted">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-scb-blue" />
                <span>Original ({originalContractDays}d)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Stoppages (+{totalStoppageDays}d)</span>
              </div>
            </div>
            <span className="font-bold text-scb-dark">Total: {adjustedTimelineDays} Days</span>
          </div>
        </Card>

        {/* Chart 2: Actual Execution Velocity (Progress Bullet Chart) */}
        <Card className="p-5 bg-white border-scb-warm/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-scb-warm/40">
              <div>
                <CardTitle className="text-sm font-bold text-scb-dark flex items-center gap-2">
                  <span>Execution Velocity & Health</span>
                  {isFrozen && <Badge variant="success" size="sm">Frozen</Badge>}
                </CardTitle>
                <CardDescription className="text-xs text-scb-dark-muted mt-0.5">
                  Actual time consumed vs. physical milestone progress completion
                </CardDescription>
              </div>
            </div>

            <div className="py-4 space-y-4">
              {/* Metric 1: Contractual Time Elapsed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-scb-dark">Contractual Time Elapsed</span>
                  <span className="font-bold text-scb-dark">
                    {timeElapsedPercentage}% ({actualDaysElapsed} / {adjustedTimelineDays} days)
                  </span>
                </div>
                <div className="h-3 w-full bg-scb-warm/40 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      timeElapsedPercentage > 100
                        ? 'bg-rose-600'
                        : timeElapsedPercentage > 85
                        ? 'bg-amber-500'
                        : 'bg-scb-blue'
                    }`}
                    style={{ width: `${Math.min(timeElapsedPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Metric 2: Physical Milestone Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-scb-dark">Physical Milestone Completion</span>
                  <span className="font-bold text-emerald-700">{physicalProgressPercentage}%</span>
                </div>
                <div className="h-3 w-full bg-scb-warm/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(physicalProgressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Velocity Comparison Note */}
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  velocityLag > 15
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-scb-offwhite border-scb-warm/60 text-scb-dark'
                }`}
              >
                <div className="flex items-center gap-2">
                  {velocityLag > 15 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {velocityLag > 15
                      ? `Execution velocity lag: ${velocityLag}% behind time consumption`
                      : 'Physical deliverables progressing in synchronization with timeline'}
                  </span>
                </div>
                <span className="font-bold text-[11px]">
                  {physicalProgressPercentage}% vs {timeElapsedPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-scb-warm/40 text-scb-dark-muted">
            <span>Status: <strong className="text-scb-dark">{isFrozen ? 'COMPLETED (Locked)' : isOverdue ? 'CRITICAL OVERRUN' : 'ON TRACK'}</strong></span>
            <span>Target Finish: <strong className="text-scb-dark">{formatDate(adjustedEndDate)}</strong></span>
          </div>
        </Card>
      </div>

      {/* ─── Stoppages Log & Admin Actions ─────────────────────────────────── */}
      <Card className="bg-white border-scb-warm/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-scb-warm/40">
          <div>
            <CardTitle className="text-sm font-bold text-scb-dark flex items-center gap-2">
              <span>Contract Stoppages & Time Extensions Log (سجل التوقفات والتمديدات)</span>
              <Badge variant="outline" size="sm">{stoppages.length} Events</Badge>
            </CardTitle>
            <CardDescription className="text-xs text-scb-dark-muted mt-0.5">
              Official timeline adjustments approved by Suez Canal Bank Engineering Department
            </CardDescription>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddStoppage}
              className="gap-1.5 shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stoppage / Extension</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {stoppages.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-scb-dark-muted/40 mx-auto" />
              <p className="text-xs font-semibold text-scb-dark">No contract stoppages or extensions registered.</p>
              <p className="text-[11px] text-scb-dark-muted">The project is running on its original baseline schedule.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-scb-warm/60 bg-scb-offwhite/50 text-scb-dark font-bold text-[11px]">
                    <th className="py-2.5 px-4">Extension Reason / Cause</th>
                    <th className="py-2.5 px-4">Start Date</th>
                    <th className="py-2.5 px-4">End Date</th>
                    <th className="py-2.5 px-4 text-center">Days Added</th>
                    <th className="py-2.5 px-4">Registered Date</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-scb-warm/30">
                  {stoppages.map((stoppage) => (
                    <tr key={stoppage.id} className="hover:bg-scb-offwhite/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-scb-dark max-w-xs truncate" title={stoppage.reason}>
                        {stoppage.reason}
                      </td>
                      <td className="py-3 px-4 text-scb-dark-muted">{formatDate(stoppage.startDate)}</td>
                      <td className="py-3 px-4">
                        {stoppage.endDate ? (
                          <span className="text-scb-dark-muted">{formatDate(stoppage.endDate)}</span>
                        ) : (
                          <Badge variant="warning" size="sm" className="gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
                            Ongoing
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={stoppage.isOngoing ? 'warning' : 'secondary'}
                          size="sm"
                          className="font-bold whitespace-nowrap"
                        >
                          +{stoppage.daysAdded} Days {stoppage.isOngoing && '(Live)'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-scb-dark-muted">{formatDate(stoppage.createdAt)}</td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditStoppage(stoppage)}
                              className="p-1 text-scb-dark-muted hover:text-scb-blue hover:bg-scb-blue-light/50 rounded transition-colors"
                              title="Edit stoppage details or resolve delay"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStoppage(stoppage.id)}
                              disabled={isDeletingStoppage}
                              className="p-1 text-scb-dark-muted hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete this stoppage extension"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
