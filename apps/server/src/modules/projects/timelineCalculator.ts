import type { TimelineAnalysis, TimelineAlert, ProjectStoppage } from '@scb/shared';

export interface CalculateTimelineParams {
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  updatedAt: Date | string;
  stoppages: Array<{
    id: string;
    projectId: string;
    reason: string;
    daysAdded?: number | null;
    startDate: Date | string;
    endDate?: Date | string | null;
    createdAt: Date | string;
  }>;
  milestones?: Array<{
    status: string;
  }>;
  referenceDate?: Date; // Optional for deterministic testing
}

export function calculateTimeline(params: CalculateTimelineParams): TimelineAnalysis {
  const start = new Date(params.startDate);
  const originalEnd = new Date(params.endDate);
  const updated = new Date(params.updatedAt);
  const now = params.referenceDate || new Date();
  const isCompleted = params.status === 'COMPLETED';

  // 1. Original Contract Duration (in days)
  const originalContractDays = Math.max(
    1,
    Math.round((originalEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 2. Process Stoppages (Supporting both resolved and live ongoing delays)
  const formattedStoppages: ProjectStoppage[] = params.stoppages.map((s) => {
    const sStart = new Date(s.startDate);
    const isOngoing = !s.endDate;
    let computedDays = 0;

    if (s.endDate) {
      const sEnd = new Date(s.endDate);
      computedDays = Math.max(
        1,
        Math.round((sEnd.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24))
      );
    } else {
      // Ongoing stoppage: calculates dynamically up to current date (or frozen if completed)
      const dynamicEnd = isCompleted ? updated : now;
      computedDays = Math.max(
        1,
        Math.round((dynamicEnd.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      id: s.id,
      projectId: s.projectId,
      reason: s.reason,
      daysAdded: computedDays,
      startDate: sStart.toISOString(),
      endDate: s.endDate ? new Date(s.endDate).toISOString() : null,
      isOngoing,
      createdAt: new Date(s.createdAt).toISOString(),
    };
  });

  // 3. Total Stoppage Days Added
  const totalStoppageDays = formattedStoppages.reduce((sum, s) => sum + s.daysAdded, 0);

  // 4. Adjusted Timeline Duration & Adjusted End Date
  const adjustedTimelineDays = originalContractDays + totalStoppageDays;
  const adjustedEndDate = new Date(
    originalEnd.getTime() + totalStoppageDays * 24 * 60 * 60 * 1000
  );

  // 5. Actual Days Elapsed (Frozen if project is COMPLETED)
  const elapsedTargetDate = isCompleted ? updated : now;
  const actualDaysElapsed = Math.max(
    0,
    Math.round((elapsedTargetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 6. Time Elapsed Percentage
  const timeElapsedPercentage = Math.round((actualDaysElapsed / adjustedTimelineDays) * 100);

  // 7. Overrun Days
  const overrunDays = Math.max(0, actualDaysElapsed - adjustedTimelineDays);

  // 8. Physical Progress Percentage
  let physicalProgressPercentage = 0;
  if (isCompleted) {
    physicalProgressPercentage = 100;
  } else if (params.milestones && params.milestones.length > 0) {
    const completed = params.milestones.filter((m) => m.status === 'COMPLETED').length;
    const inProgress = params.milestones.filter((m) => m.status === 'IN_PROGRESS').length;
    physicalProgressPercentage = Math.round(
      ((completed * 1.0 + inProgress * 0.4) / params.milestones.length) * 100
    );
  } else {
    physicalProgressPercentage = Math.min(timeElapsedPercentage, 50);
  }

  // 9. Automated Alert Generation
  const alerts: TimelineAlert[] = [];

  const hasOngoingStoppages = formattedStoppages.some((s) => s.isOngoing);
  if (hasOngoingStoppages && !isCompleted) {
    alerts.push({
      type: 'SLOW_VELOCITY',
      severity: 'warning',
      title: 'LIVE DELAY: Active Stoppage in Effect',
      message: 'One or more unresolved stoppages are currently active. Adjusted baseline is expanding dynamically each day.',
    });
  }

  if (actualDaysElapsed > adjustedTimelineDays) {
    alerts.push({
      type: 'CRITICAL_OVERRUN',
      severity: 'critical',
      title: 'CRITICAL: Adjusted Schedule Overrun',
      message: `Project has exceeded the adjusted timeline by ${overrunDays} day${
        overrunDays > 1 ? 's' : ''
      } past the revised deadline (${adjustedEndDate.toISOString().split('T')[0]}).`,
    });
  }

  if (!isCompleted && timeElapsedPercentage - physicalProgressPercentage > 15) {
    alerts.push({
      type: 'SLOW_VELOCITY',
      severity: 'warning',
      title: 'WARNING: Slow Execution Velocity',
      message: `Physical progress (${physicalProgressPercentage}%) is lagging ${
        timeElapsedPercentage - physicalProgressPercentage
      }% behind contractual time elapsed (${timeElapsedPercentage}%).`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'ON_TRACK',
      severity: 'info',
      title: 'Timeline On Track',
      message: `Execution is progressing within the ${adjustedTimelineDays}-day adjusted contractual baseline.`,
    });
  }

  return {
    originalContractDays,
    totalStoppageDays,
    adjustedTimelineDays,
    originalStartDate: start.toISOString(),
    originalEndDate: originalEnd.toISOString(),
    adjustedEndDate: adjustedEndDate.toISOString(),
    actualDaysElapsed,
    timeElapsedPercentage,
    physicalProgressPercentage,
    overrunDays,
    isFrozen: isCompleted,
    alerts,
    stoppages: formattedStoppages,
  };
}
