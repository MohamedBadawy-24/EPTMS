import { describe, it, expect } from 'vitest';
import { calculateTimeline } from '../modules/projects/timelineCalculator.js';

describe('Project Timeline & Stoppages Calculation Engine Tests', () => {
  const baseProject = {
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: new Date('2025-04-11T00:00:00.000Z'), // 100 days
    status: 'ACTIVE',
    updatedAt: new Date('2025-02-15T00:00:00.000Z'),
    stoppages: [],
    milestones: [],
  };

  it('accurately computes original contract duration in days', () => {
    const result = calculateTimeline({
      ...baseProject,
      referenceDate: new Date('2025-01-21T00:00:00.000Z'), // Day 20
    });

    expect(result.originalContractDays).toBe(100);
    expect(result.totalStoppageDays).toBe(0);
    expect(result.adjustedTimelineDays).toBe(100);
    expect(result.actualDaysElapsed).toBe(20);
    expect(result.timeElapsedPercentage).toBe(20);
    expect(result.isFrozen).toBe(false);
  });

  it('dynamically adds stoppage extensions to calculate adjusted baseline', () => {
    const stoppages = [
      {
        id: 'stop-1',
        projectId: 'proj-1',
        reason: 'Permit delays by civil defense authority',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-16'), // 15 days
        createdAt: new Date(),
      },
      {
        id: 'stop-2',
        projectId: 'proj-1',
        reason: 'Client requested architectural redesign of vault area',
        startDate: new Date('2025-02-20'),
        endDate: new Date('2025-03-02'), // 10 days
        createdAt: new Date(),
      },
    ];

    const result = calculateTimeline({
      ...baseProject,
      stoppages,
      referenceDate: new Date('2025-02-10T00:00:00.000Z'), // Day 40
    });

    // 100 original + 25 stoppage = 125 adjusted
    expect(result.originalContractDays).toBe(100);
    expect(result.totalStoppageDays).toBe(25);
    expect(result.adjustedTimelineDays).toBe(125);
    expect(result.actualDaysElapsed).toBe(40);
    expect(result.timeElapsedPercentage).toBe(32); // 40 / 125 = 32%
  });

  it('dynamically calculates ongoing stoppages (null endDate) up to reference date and grows daily', () => {
    const ongoingStoppage = [
      {
        id: 'stop-ongoing-1',
        projectId: 'proj-1',
        reason: 'Unresolved site access dispute',
        startDate: new Date('2025-02-01T00:00:00.000Z'),
        endDate: null, // Ongoing!
        createdAt: new Date(),
      },
    ];

    // Reference Date 1: Day 12 of stoppage (Feb 13)
    const resultAtFeb13 = calculateTimeline({
      ...baseProject,
      stoppages: ongoingStoppage,
      referenceDate: new Date('2025-02-13T00:00:00.000Z'),
    });

    expect(resultAtFeb13.stoppages[0].isOngoing).toBe(true);
    expect(resultAtFeb13.stoppages[0].daysAdded).toBe(12);
    expect(resultAtFeb13.totalStoppageDays).toBe(12);
    expect(resultAtFeb13.adjustedTimelineDays).toBe(112); // 100 + 12

    // Reference Date 2: Day 20 of stoppage (Feb 21) -> Automatically grown!
    const resultAtFeb21 = calculateTimeline({
      ...baseProject,
      stoppages: ongoingStoppage,
      referenceDate: new Date('2025-02-21T00:00:00.000Z'),
    });

    expect(resultAtFeb21.stoppages[0].daysAdded).toBe(20);
    expect(resultAtFeb21.totalStoppageDays).toBe(20);
    expect(resultAtFeb21.adjustedTimelineDays).toBe(120); // 100 + 20

    // Alerts include ongoing stoppage warning
    const activeDelayAlert = resultAtFeb21.alerts.find((a) => a.title.includes('LIVE DELAY'));
    expect(activeDelayAlert).toBeDefined();
  });

  it('freezes actual days elapsed at completion date when project status is COMPLETED', () => {
    const completedProject = {
      ...baseProject,
      status: 'COMPLETED',
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-04-11T00:00:00.000Z'), // 100 days
      updatedAt: new Date('2025-03-22T00:00:00.000Z'), // Finished at Day 80
    };

    const result = calculateTimeline({
      ...completedProject,
      referenceDate: new Date('2025-08-01T00:00:00.000Z'), // Months later
    });

    expect(result.isFrozen).toBe(true);
    expect(result.actualDaysElapsed).toBe(80); // Frozen at Day 80, not August
    expect(result.physicalProgressPercentage).toBe(100);
  });

  it('triggers CRITICAL_OVERRUN alert when actual days elapsed exceed adjusted timeline', () => {
    const result = calculateTimeline({
      ...baseProject,
      stoppages: [
        {
          id: 'stop-1',
          projectId: 'proj-1',
          reason: 'Site access restriction',
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-11'), // 10 days
          createdAt: new Date(),
        },
      ],
      // 100 + 10 = 110 days adjusted deadline. Reference date is at Day 125 (+15 days late)
      referenceDate: new Date('2025-05-06T00:00:00.000Z'),
    });

    expect(result.adjustedTimelineDays).toBe(110);
    expect(result.actualDaysElapsed).toBe(125);
    expect(result.overrunDays).toBe(15);

    const criticalAlert = result.alerts.find((a) => a.type === 'CRITICAL_OVERRUN');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.severity).toBe('critical');
    expect(criticalAlert?.message).toContain('exceeded the adjusted timeline by 15 days');
  });

  it('triggers SLOW_VELOCITY alert when physical progress is lagging > 15% behind elapsed percentage', () => {
    const milestones = [
      { status: 'NOT_STARTED' },
      { status: 'NOT_STARTED' },
      { status: 'NOT_STARTED' },
      { status: 'NOT_STARTED' },
    ]; // 0% physical progress

    const result = calculateTimeline({
      ...baseProject,
      milestones,
      // Reference date is at Day 50 (50% time elapsed vs 0% physical progress -> delta = 50% > 15%)
      referenceDate: new Date('2025-02-20T00:00:00.000Z'),
    });

    expect(result.timeElapsedPercentage).toBe(50);
    expect(result.physicalProgressPercentage).toBe(0);

    const velocityAlert = result.alerts.find((a) => a.type === 'SLOW_VELOCITY');
    expect(velocityAlert).toBeDefined();
    expect(velocityAlert?.severity).toBe('warning');
  });

  it('returns ON_TRACK alert when execution velocity is well-aligned with schedule', () => {
    const milestones = [
      { status: 'COMPLETED' },
      { status: 'COMPLETED' },
      { status: 'IN_PROGRESS' },
      { status: 'NOT_STARTED' },
    ]; // 2 complete + 0.4 in progress = 2.4/4 = 60% progress

    const result = calculateTimeline({
      ...baseProject,
      milestones,
      // Reference date is at Day 55 (55% time elapsed vs 60% physical progress)
      referenceDate: new Date('2025-02-25T00:00:00.000Z'),
    });

    expect(result.alerts[0].type).toBe('ON_TRACK');
    expect(result.alerts[0].severity).toBe('info');
  });
});
