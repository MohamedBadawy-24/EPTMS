import { RAG_THRESHOLDS } from '@scb/shared';
import type { RAGStatus } from '@scb/shared';

// ─── RAG Calculator ──────────────────────────────────────────────────────────
// Pure function that computes project health (GREEN / AMBER / RED) on-the-fly.
// This value is NEVER stored in the database.
//
// Inputs:
//   - milestoneDelays: array of delay_days values (from generated column)
//   - contractValue: the project's contract value
//   - finalCost: the project's final cost (null if still in progress)
//
// Rules:
//   - Schedule: use the MAXIMUM delay across all milestones
//   - Cost: compare finalCost vs contractValue. If finalCost is null → cost component defaults to GREEN.
//   - Overall RAG = worst of (schedule RAG, cost RAG)

interface RAGInput {
  milestoneDelays: number[];
  contractValue: number;
  finalCost: number | null;
}

export function calculateRAG(input: RAGInput): RAGStatus {
  const scheduleRAG = calculateScheduleRAG(input.milestoneDelays);
  const costRAG = calculateCostRAG(input.contractValue, input.finalCost);

  // Overall RAG is the WORST of schedule and cost
  return worstRAG(scheduleRAG, costRAG);
}

/**
 * Schedule RAG: based on the maximum delay across all milestones.
 * If no milestones exist, default to GREEN.
 */
function calculateScheduleRAG(delays: number[]): RAGStatus {
  if (delays.length === 0) return 'GREEN';

  const maxDelay = Math.max(...delays);

  if (maxDelay <= RAG_THRESHOLDS.green.maxDelayDays) return 'GREEN';
  if (maxDelay <= RAG_THRESHOLDS.amber.maxDelayDays) return 'AMBER';
  return 'RED';
}

/**
 * Cost RAG: based on cost overrun percentage.
 * If finalCost is null (project still in progress), cost component defaults to GREEN.
 */
function calculateCostRAG(
  contractValue: number,
  finalCost: number | null,
): RAGStatus {
  // Per spec: if finalCost is null, cost component defaults to GREEN
  if (finalCost === null || finalCost === undefined) return 'GREEN';
  if (contractValue <= 0) return 'RED'; // Guard against division by zero

  const overrunPct = ((finalCost - contractValue) / contractValue) * 100;

  if (overrunPct <= RAG_THRESHOLDS.green.maxCostOverrunPct) return 'GREEN';
  if (overrunPct <= RAG_THRESHOLDS.amber.maxCostOverrunPct) return 'AMBER';
  return 'RED';
}

/**
 * Returns the worst RAG status from two inputs.
 * RED > AMBER > GREEN
 */
function worstRAG(a: RAGStatus, b: RAGStatus): RAGStatus {
  const severity: Record<RAGStatus, number> = {
    GREEN: 0,
    AMBER: 1,
    RED: 2,
  };

  return severity[a] >= severity[b] ? a : b;
}
