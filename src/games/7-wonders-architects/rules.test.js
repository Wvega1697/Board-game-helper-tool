import { describe, it, expect } from 'vitest';
import { calculateFinalScore, checkWinner } from './rules.js';

describe('7 Wonders Architects rules', () => {
  it('calculates score correctly', () => {
    const score = calculateFinalScore({
      stagesConstructed: 5,
      wonderPoints: 10,
      hasCatPawn: true,
      bluePoints: 7,
      militaryTokens: 4,       // 4 tokens × 3 VP = 12
      progressTokens: 2,
      hasEducation: true        // 2 tokens × 2 VP = 4
    });
    expect(score).toBe(10 + 2 + 7 + 12 + 4); // 35
  });

  it('handles culture tokens correctly', () => {
    expect(calculateFinalScore({ cultureTokens: 1 })).toBe(4);
    expect(calculateFinalScore({ cultureTokens: 2 })).toBe(12);
  });

  it('determines winner and tiebreakers', () => {
    const players = [
      { name: 'Alice', totalScore: 30, stagesConstructed: 4 },
      { name: 'Bob', totalScore: 35, stagesConstructed: 4 },
      { name: 'Charlie', totalScore: 35, stagesConstructed: 5 },
    ];
    
    const winners = checkWinner(players);
    expect(winners).toEqual(['Charlie']);
  });
});
