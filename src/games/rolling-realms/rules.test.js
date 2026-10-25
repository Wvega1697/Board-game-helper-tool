import { describe, it, expect } from 'vitest';
import { calculateRoundScore, calculateTotal, checkWinner } from './rules.js';

describe('calculateRoundScore', () => {
  it('sums realm stars plus 0.1 per unspent resource', () => {
    expect(calculateRoundScore(['euphoria', 'scythe', 'tapestry'], { euphoria: 4, scythe: 3, tapestry: 5, resources: 3 })).toBe(12.3);
  });

  it('Between Two Cities = lower of other two realms, capped by filled squares', () => {
    const realms = ['between-two-cities', 'euphoria', 'wingspan'];
    expect(calculateRoundScore(realms, { 'between-two-cities': 9, euphoria: 5, wingspan: 3 })).toBe(11); // 3 + 5 + 3
    expect(calculateRoundScore(realms, { 'between-two-cities': 2, euphoria: 5, wingspan: 3 })).toBe(10); // 2 + 5 + 3
  });
});

describe('calculateTotal', () => {
  it('adds tenths without float drift', () => {
    expect(calculateTotal([0.1, 0.2, 10.4])).toBe(10.7);
  });
});

describe('checkWinner', () => {
  it('breaks ties by round 3, then round 2', () => {
    const players = [
      { totalScore: 30, roundScores: [10, 10, 10] },
      { totalScore: 30, roundScores: [8, 10, 12] },
      { totalScore: 30, roundScores: [7, 11, 12] },
    ];
    expect(checkWinner(players)).toEqual([2]);
  });

  it('shares victory when fully tied', () => {
    const players = [
      { totalScore: 20, roundScores: [5, 5, 10] },
      { totalScore: 20, roundScores: [5, 5, 10] },
    ];
    expect(checkWinner(players)).toEqual([0, 1]);
  });
});
