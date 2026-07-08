import { describe, it, expect } from 'vitest';
import { calculateFinalScore, checkWinner, hasTie, riverScore } from './rules.js';

describe('riverScore', () => {
  it('returns table values for length 1–6', () => {
    expect(riverScore(1)).toBe(1);
    expect(riverScore(3)).toBe(4);
    expect(riverScore(6)).toBe(15);
  });

  it('adds 4 pts per token beyond 6', () => {
    expect(riverScore(7)).toBe(19);
    expect(riverScore(8)).toBe(23);
  });

  it('returns 0 for length 0', () => {
    expect(riverScore(0)).toBe(0);
  });
});

describe('calculateFinalScore', () => {
  it('sums all landscape + animal buckets', () => {
    expect(calculateFinalScore({
      treePoints: 12,
      mountainPoints: 7,
      fieldPoints: 10,
      buildingPoints: 5,
      riverPoints: 15,
      animalPoints: 8,
    })).toBe(57);
  });

  it('returns 0 when all inputs are 0', () => {
    expect(calculateFinalScore({})).toBe(0);
  });
});

describe('checkWinner', () => {
  it('returns the single highest scorer', () => {
    const players = [
      { name: 'Alice', totalScore: 57, animalCubesPlaced: 10, completedCards: 3, unplacedCubes: 0 },
      { name: 'Bob',   totalScore: 50, animalCubesPlaced: 12, completedCards: 4, unplacedCubes: 1 },
    ];
    expect(checkWinner(players)).toEqual(['Alice']);
  });

  it('breaks ties by most animal cubes placed', () => {
    const players = [
      { name: 'Alice', totalScore: 50, animalCubesPlaced: 8,  completedCards: 3, unplacedCubes: 2 },
      { name: 'Bob',   totalScore: 50, animalCubesPlaced: 12, completedCards: 2, unplacedCubes: 1 },
    ];
    expect(checkWinner(players)).toEqual(['Bob']);
  });

  it('breaks further ties by most completed cards', () => {
    const players = [
      { name: 'Alice', totalScore: 50, animalCubesPlaced: 10, completedCards: 2, unplacedCubes: 2 },
      { name: 'Bob',   totalScore: 50, animalCubesPlaced: 10, completedCards: 4, unplacedCubes: 3 },
    ];
    expect(checkWinner(players)).toEqual(['Bob']);
  });

  it('breaks further ties by fewest unplaced cubes', () => {
    const players = [
      { name: 'Alice', totalScore: 50, animalCubesPlaced: 10, completedCards: 3, unplacedCubes: 3 },
      { name: 'Bob',   totalScore: 50, animalCubesPlaced: 10, completedCards: 3, unplacedCubes: 1 },
    ];
    expect(checkWinner(players)).toEqual(['Bob']);
  });
});

describe('hasTie', () => {
  it('returns true when top scores are equal', () => {
    expect(hasTie([
      { totalScore: 50 },
      { totalScore: 50 },
      { totalScore: 40 },
    ])).toBe(true);
  });

  it('returns false when there is a clear winner', () => {
    expect(hasTie([{ totalScore: 60 }, { totalScore: 50 }])).toBe(false);
  });
});
