/**
 * Flip 7 — unit tests
 * Run: npx vitest run src/games/flip7/rules.test.js
 * ponytail: one flat file, no fixtures
 */
import { describe, it, expect } from 'vitest';
import { calculateRoundScore, checkBust, checkWinner } from './rules.js';

describe('checkBust', () => {
  it('returns false for empty hand', () => {
    expect(checkBust([])).toBe(false);
  });

  it('returns false for all-unique cards', () => {
    expect(checkBust([1, 2, 3, 5])).toBe(false);
  });

  it('returns true when a duplicate exists', () => {
    expect(checkBust([1, 2, 3, 2])).toBe(true);
  });
});

describe('calculateRoundScore', () => {
  it('returns 0 for a busted player', () => {
    const { score, hasBonus } = calculateRoundScore({
      numberCards: [1, 1],
      isBust: true,
    });
    expect(score).toBe(0);
    expect(hasBonus).toBe(false);
  });

  it('sums number cards correctly', () => {
    const { score } = calculateRoundScore({ numberCards: [1, 2, 3] });
    expect(score).toBe(6);
  });

  it('applies a single x2 multiplier to card sum only', () => {
    // cards sum = 10, ×2 = 20, modifier = 5 → 25
    const { score } = calculateRoundScore({
      numberCards: [4, 6],
      multiplierCount: 1,
      modifierTotal: 5,
    });
    expect(score).toBe(25);
  });

  it('applies two x2 multipliers', () => {
    // sum 4, ×2 = 8, ×2 = 16
    const { score } = calculateRoundScore({
      numberCards: [4],
      multiplierCount: 2,
    });
    expect(score).toBe(16);
  });

  it('adds 15 bonus for 7 unique cards', () => {
    const { score, hasBonus } = calculateRoundScore({
      numberCards: [0, 1, 2, 3, 4, 5, 6],
    });
    const expectedBase = 0 + 1 + 2 + 3 + 4 + 5 + 6; // 21
    expect(hasBonus).toBe(true);
    expect(score).toBe(expectedBase + 15); // 36
  });

  it('score is floored at 0 with large negative modifier', () => {
    const { score } = calculateRoundScore({
      numberCards: [1],
      modifierTotal: -999,
    });
    expect(score).toBe(0);
  });
});

describe('checkWinner', () => {
  it('returns no winner when all below target', () => {
    const result = checkWinner([
      { name: 'Alice', totalScore: 150 },
      { name: 'Bob', totalScore: 180 },
    ]);
    expect(result.isOver).toBe(false);
    expect(result.winners).toHaveLength(0);
  });

  it('returns single winner at or above 200', () => {
    const result = checkWinner([
      { name: 'Alice', totalScore: 200 },
      { name: 'Bob', totalScore: 190 },
    ]);
    expect(result.isOver).toBe(true);
    expect(result.winners).toEqual(['Alice']);
  });

  it('returns all tied winners at the highest score', () => {
    const result = checkWinner([
      { name: 'Alice', totalScore: 210 },
      { name: 'Bob', totalScore: 210 },
      { name: 'Carol', totalScore: 200 },
    ]);
    expect(result.isOver).toBe(true);
    expect(result.winners).toEqual(expect.arrayContaining(['Alice', 'Bob']));
    expect(result.winners).toHaveLength(2);
  });

  it('uses custom target score', () => {
    const result = checkWinner(
      [{ name: 'Alice', totalScore: 50 }],
      50
    );
    expect(result.isOver).toBe(true);
  });
});
