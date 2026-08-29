import { describe, it, expect } from 'vitest';
import { calculateRAG } from '../lib/ragCalculator.js';

describe('RAG Calculator Pure Function Invariant Tests', () => {
  describe('Schedule Component Boundaries', () => {
    it('returns GREEN when all milestone delays are <= 7 days', () => {
      const result = calculateRAG({
        milestoneDelays: [0, 3, 7, -2],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(result).toBe('GREEN');
    });

    it('returns AMBER when max milestone delay is between 8 and 21 days', () => {
      const resultAt8 = calculateRAG({
        milestoneDelays: [2, 8],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(resultAt8).toBe('AMBER');

      const resultAt21 = calculateRAG({
        milestoneDelays: [21, 5, 0],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(resultAt21).toBe('AMBER');
    });

    it('returns RED when max milestone delay exceeds 21 days', () => {
      const resultAt22 = calculateRAG({
        milestoneDelays: [0, 22],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(resultAt22).toBe('RED');

      const resultAt60 = calculateRAG({
        milestoneDelays: [60],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(resultAt60).toBe('RED');
    });

    it('defaults to GREEN when milestone list is empty', () => {
      const result = calculateRAG({
        milestoneDelays: [],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(result).toBe('GREEN');
    });

    it('returns GREEN when all milestones are completed ahead of schedule (negative delay)', () => {
      const result = calculateRAG({
        milestoneDelays: [-5, -10, -1],
        contractValue: 1_000_000,
        finalCost: 1_000_000,
      });
      expect(result).toBe('GREEN');
    });
  });

  describe('Financial / Cost Overrun Component Boundaries', () => {
    it('defaults cost component to GREEN when finalCost is null (project still in execution)', () => {
      const result = calculateRAG({
        milestoneDelays: [3],
        contractValue: 5_000_000,
        finalCost: null,
      });
      expect(result).toBe('GREEN');
    });

    it('returns GREEN when cost overrun is <= 5%', () => {
      // 5% overrun on 1,000,000 is 1,050,000
      const result = calculateRAG({
        milestoneDelays: [0],
        contractValue: 1_000_000,
        finalCost: 1_050_000,
      });
      expect(result).toBe('GREEN');
    });

    it('returns AMBER when cost overrun is between 5.01% and 15%', () => {
      // 10% overrun on 1,000,000 is 1,100,000
      const result = calculateRAG({
        milestoneDelays: [0],
        contractValue: 1_000_000,
        finalCost: 1_100_000,
      });
      expect(result).toBe('AMBER');

      // 15% overrun exactly
      const resultAt15 = calculateRAG({
        milestoneDelays: [0],
        contractValue: 1_000_000,
        finalCost: 1_150_000,
      });
      expect(resultAt15).toBe('AMBER');
    });

    it('returns RED when cost overrun exceeds 15%', () => {
      // 20% overrun on 1,000,000 is 1,200,000
      const result = calculateRAG({
        milestoneDelays: [0],
        contractValue: 1_000_000,
        finalCost: 1_200_000,
      });
      expect(result).toBe('RED');
    });

    it('returns GREEN when final cost is under budget', () => {
      const result = calculateRAG({
        milestoneDelays: [0],
        contractValue: 1_000_000,
        finalCost: 900_000,
      });
      expect(result).toBe('GREEN');
    });
  });

  describe('Worst-Case Aggregation Rules (Worst of Schedule and Cost)', () => {
    it('returns RED when Schedule is RED even if Cost is GREEN', () => {
      const result = calculateRAG({
        milestoneDelays: [30], // RED schedule
        contractValue: 1_000_000,
        finalCost: null, // GREEN cost
      });
      expect(result).toBe('RED');
    });

    it('returns RED when Cost is RED even if Schedule is GREEN', () => {
      const result = calculateRAG({
        milestoneDelays: [0], // GREEN schedule
        contractValue: 1_000_000,
        finalCost: 1_300_000, // 30% overrun -> RED cost
      });
      expect(result).toBe('RED');
    });

    it('returns AMBER when Schedule is AMBER and Cost is GREEN', () => {
      const result = calculateRAG({
        milestoneDelays: [14], // AMBER schedule
        contractValue: 1_000_000,
        finalCost: 1_020_000, // 2% overrun -> GREEN cost
      });
      expect(result).toBe('AMBER');
    });

    it('returns RED when Schedule is AMBER and Cost is RED', () => {
      const result = calculateRAG({
        milestoneDelays: [14], // AMBER schedule
        contractValue: 1_000_000,
        finalCost: 1_250_000, // RED cost
      });
      expect(result).toBe('RED');
    });
  });
});
