// ─── RAG Thresholds ──────────────────────────────────────────────────────────
// Used by ragCalculator on the backend to derive project health.
// RAG status is NEVER stored — always computed on-the-fly.

export const RAG_THRESHOLDS = {
  /** GREEN: delay ≤ 7 days AND cost overrun ≤ 5% */
  green: {
    maxDelayDays: 7,
    maxCostOverrunPct: 5,
  },
  /** AMBER: delay ≤ 21 days AND cost overrun ≤ 15% */
  amber: {
    maxDelayDays: 21,
    maxCostOverrunPct: 15,
  },
  // Anything beyond amber thresholds → RED
} as const;

export type RAGStatus = 'GREEN' | 'AMBER' | 'RED';
