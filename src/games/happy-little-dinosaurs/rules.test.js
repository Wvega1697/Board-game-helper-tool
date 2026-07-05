/**
 * Happy Little Dinosaurs — unit tests
 * Run: npx vitest run src/games/happy-little-dinosaurs/rules.test.js
 * ponytail: no fixtures, uses 'nervous-rex' (natural:0, predator:+1, emotional:-1, meteor:0)
 */
import { describe, it, expect } from 'vitest';
import {
  calculateRoundScore,
  applyScoreInversion,
  checkElimination,
  advanceEscapeRoute,
} from './rules.js';

// ──────────────────────────────────────────────
// calculateRoundScore
// ──────────────────────────────────────────────
describe('calculateRoundScore – base card + trait', () => {
  it('neutral dino, no modifiers', () => {
    const { score } = calculateRoundScore({
      baseCardValue: 5,
      dinosaurId: 'stego', // all traits 0 except meteor
      disasterType: 'natural',
    });
    expect(score).toBe(5);
  });

  it('positive trait adds to score', () => {
    // nervous-rex: predator +1
    const { score, traitBonus } = calculateRoundScore({
      baseCardValue: 3,
      dinosaurId: 'nervous-rex',
      disasterType: 'predator',
    });
    expect(traitBonus).toBe(1);
    expect(score).toBe(4);
  });

  it('negative trait does not push score below 0', () => {
    // nervous-rex: emotional -1, card = 0
    const { score } = calculateRoundScore({
      baseCardValue: 0,
      dinosaurId: 'nervous-rex',
      disasterType: 'emotional',
    });
    expect(score).toBe(0);
  });
});

describe('calculateRoundScore – boosters / sappers', () => {
  it('score booster adds 2 per count', () => {
    const { score } = calculateRoundScore({
      baseCardValue: 1,
      scoreBoosterTotal: 2, // 2 cards × 2 = +4
    });
    expect(score).toBe(5); // 1 + 4
  });

  it('score sapper subtracts 2 per count', () => {
    const { score } = calculateRoundScore({
      baseCardValue: 5,
      scoreSapperTotal: 1, // 1 card × 2 = -2
    });
    expect(score).toBe(3);
  });

  it('Star Fruit doubles booster effect', () => {
    // card=0, booster=1 → 1×2=2; star fruit doubles → 4
    const { score } = calculateRoundScore({
      baseCardValue: 0,
      scoreBoosterTotal: 1,
      hasStarFruit: true,
    });
    expect(score).toBe(4);
  });

  it('Star Fruit doubles sapper effect (correct equation from spec)', () => {
    // card=0, booster=1 (+2 effect), sapper=0, traitBonus=-1, starFruit doubles → booster×4
    // score = (0) + (1×2×2 - 0) + (-1) = 0 + 4 + (-1) = 3
    const { score } = calculateRoundScore({
      baseCardValue: 0,
      dinosaurId: 'nervous-rex',
      disasterType: 'emotional',   // trait -1
      scoreBoosterTotal: 1,
      hasStarFruit: true,
    });
    expect(score).toBe(3); // 0 + (2*2) + (-1) = 3
  });

  it('Swiss Shears halves boosters/sappers', () => {
    // booster=2 → effect=4, Swiss Shears → floor(4/2)=2
    const { score } = calculateRoundScore({
      baseCardValue: 0,
      scoreBoosterTotal: 2,
      hasSwissShears: true,
    });
    expect(score).toBe(2);
  });
});

describe('calculateRoundScore – Rock Candy', () => {
  it('adds 2 per hazard card when Rock Candy is active', () => {
    const { score } = calculateRoundScore({
      baseCardValue: 0,
      hasRockCandy: true,
      hazardCardCount: 3, // 3 × 2 = +6
    });
    expect(score).toBe(6);
  });
});

// ──────────────────────────────────────────────
// applyScoreInversion
// ──────────────────────────────────────────────
describe('applyScoreInversion', () => {
  it('swaps highest and lowest scores', () => {
    const input = [
      { name: 'A', score: 1 },
      { name: 'B', score: 5 },
      { name: 'C', score: 3 },
    ];
    const result = applyScoreInversion(input);
    expect(result.find((p) => p.name === 'A').score).toBe(5);
    expect(result.find((p) => p.name === 'B').score).toBe(1);
    expect(result.find((p) => p.name === 'C').score).toBe(3);
  });

  it('is a no-op for a single player', () => {
    const input = [{ name: 'Solo', score: 7 }];
    expect(applyScoreInversion(input)).toEqual(input);
  });

  it('is a no-op when all scores are tied', () => {
    const input = [
      { name: 'A', score: 5 },
      { name: 'B', score: 5 },
    ];
    const result = applyScoreInversion(input);
    expect(result.find((p) => p.name === 'A').score).toBe(5);
    expect(result.find((p) => p.name === 'B').score).toBe(5);
  });
});

// ──────────────────────────────────────────────
// checkElimination
// ──────────────────────────────────────────────
describe('checkElimination', () => {
  it('not eliminated with fewer than 3 cards', () => {
    expect(checkElimination([{ type: 'natural' }, { type: 'natural' }]).eliminated).toBe(false);
  });

  it('eliminated by 3 of the same type', () => {
    const cards = [{ type: 'natural' }, { type: 'natural' }, { type: 'natural' }];
    expect(checkElimination(cards).eliminated).toBe(true);
  });

  it('eliminated by 3 different types', () => {
    const cards = [{ type: 'natural' }, { type: 'predator' }, { type: 'emotional' }];
    expect(checkElimination(cards).eliminated).toBe(true);
  });

  it('meteor counts as all types → 1 meteor + 2 natural = eliminated', () => {
    const cards = [{ type: 'meteor' }, { type: 'natural' }, { type: 'natural' }];
    expect(checkElimination(cards).eliminated).toBe(true);
  });

  it('not eliminated for 2 natural + 1 predator', () => {
    const cards = [{ type: 'natural' }, { type: 'natural' }, { type: 'predator' }];
    expect(checkElimination(cards).eliminated).toBe(false);
  });
});

// ──────────────────────────────────────────────
// advanceEscapeRoute
// ──────────────────────────────────────────────
describe('advanceEscapeRoute', () => {
  it('advances by points won', () => {
    expect(advanceEscapeRoute(10, 5, 0)).toBe(15);
  });

  it('advances by disaster count (passive)', () => {
    expect(advanceEscapeRoute(10, 0, 2)).toBe(12);
  });

  it('slippery slope subtracts 1 after advance', () => {
    expect(advanceEscapeRoute(10, 3, 0, true)).toBe(12); // 10+3-1
  });

  it('caps at max (default 50)', () => {
    expect(advanceEscapeRoute(48, 10, 0)).toBe(50);
  });

  it('cannot go below 0', () => {
    expect(advanceEscapeRoute(0, 0, 0, true)).toBe(0);
  });
});
