import { describe, it, expect } from 'vitest';
import { calculateFinalScore, checkWinner } from './rules.js';

describe('calculateFinalScore', () => {
  it('matches the rulebook scoring example (total = 62)', () => {
    expect(calculateFinalScore({
      baseCardPoints: 22,
      pointTokens: 14,
      prosperityBonus: 10,
      journeyPoints: 4,
      eventPoints: 12,
    })).toBe(62);
  });

  it('returns 0 when all inputs are 0', () => {
    expect(calculateFinalScore({})).toBe(0);
  });
});

describe('checkWinner', () => {
  it('returns the single highest scorer', () => {
    const players = [
      { name: 'Alice', totalScore: 62, eventsAchieved: 3, leftoverResources: 5 },
      { name: 'Bob',   totalScore: 55, eventsAchieved: 4, leftoverResources: 8 },
    ];
    expect(checkWinner(players)).toEqual(['Alice']);
  });

  it('breaks ties by most events achieved', () => {
    const players = [
      { name: 'Alice', totalScore: 60, eventsAchieved: 2, leftoverResources: 10 },
      { name: 'Bob',   totalScore: 60, eventsAchieved: 4, leftoverResources: 3 },
    ];
    expect(checkWinner(players)).toEqual(['Bob']);
  });

  it('breaks further ties by most leftover resources', () => {
    const players = [
      { name: 'Alice', totalScore: 60, eventsAchieved: 3, leftoverResources: 7 },
      { name: 'Bob',   totalScore: 60, eventsAchieved: 3, leftoverResources: 12 },
    ];
    expect(checkWinner(players)).toEqual(['Bob']);
  });
});
