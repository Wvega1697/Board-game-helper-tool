/**
 * Happy Little Dinosaurs — Pure scoring logic.
 * No UI dependencies, fully testable in isolation.
 */

import { getDinosaur } from './data/dinosaurs.js';

/**
 * DISASTER TYPES
 */
export const DISASTER_TYPES = ['natural', 'predator', 'emotional', 'meteor'];

/**
 * Calculate round score for a single player.
 * Order: base card → dinosaur trait → instant card modifiers
 *
 * @param {Object} params
 * @param {number} params.baseCardValue - Point card value (0–9)
 * @param {string} params.dinosaurId - Dinosaur character ID
 * @param {string} params.disasterType - 'natural' | 'predator' | 'emotional' | 'meteor'
 * @param {number} params.additionalPoints - Extra points from instant cards (e.g., Pet Rock, Smoothie)
 * @param {number} params.scoreBoosterTotal - Total from Score Booster cards applied to this player
 * @param {number} params.scoreSapperTotal - Total from Score Sapper cards applied to this player
 * @param {boolean} params.hasStarFruit - Whether Special Star Fruit is active (doubles boosters/sappers)
 * @param {boolean} params.hasSwissShears - Whether Swiss Shears halves opponent boosters/sappers
 * @param {string[]} params.hazardModifiers - Active hazard card modifier IDs
 * @param {number} params.hazardCardCount - Number of hazard cards in disaster area
 * @param {boolean} params.hasRockCandy - Whether Rock Candy is active (+2 per hazard)
 * @returns {{ score: number, traitBonus: number }}
 */
export function calculateRoundScore({
  baseCardValue = 0,
  dinosaurId,
  disasterType,
  additionalPoints = 0,
  scoreBoosterTotal = 0,
  scoreSapperTotal = 0,
  hasStarFruit = false,
  hasSwissShears = false,
  hazardModifiers = [],
  hazardCardCount = 0,
  hasRockCandy = false,
}) {
  let score = baseCardValue;

  // Step 1: Apply dinosaur trait
  let traitBonus = 0;
  if (dinosaurId && disasterType) {
    const dino = getDinosaur(dinosaurId);
    if (dino) {
      traitBonus = dino.traits[disasterType] || 0;

      // Meteor affects all types for trait purposes
      if (disasterType === 'meteor') {
        traitBonus = dino.traits.meteor || 0;
      }

      // Hazard: Juice Cleanse — ignore trait advantages
      if (hazardModifiers.includes('no-trait-bonus') && traitBonus > 0) {
        traitBonus = 0;
      }

      // Hazard: Rock Slide — double trait disadvantages
      if (hazardModifiers.includes('double-trait-penalty') && traitBonus < 0) {
        traitBonus *= 2;
      }

      score += traitBonus;
    }
  }

  // Step 2: Additional points from instant cards (Pet Rock, Smoothie, etc.)
  score += additionalPoints;

  // Step 3: Apply Score Boosters and Sappers (each card is worth 2 points)
  let boosterEffect = scoreBoosterTotal * 2;
  let sapperEffect = scoreSapperTotal * 2;

  // Star Fruit doubles boosters and sappers
  if (hasStarFruit) {
    boosterEffect *= 2;
    sapperEffect *= 2;
  }

  // Swiss Shears halves opponent boosters/sappers (applied per-player context)
  if (hasSwissShears) {
    boosterEffect = Math.floor(boosterEffect / 2);
    sapperEffect = Math.floor(sapperEffect / 2);
  }

  // Hazard: Live.Laugh.Lava — halves YOUR boosters/sappers
  if (hazardModifiers.includes('halve-boosters')) {
    boosterEffect = Math.floor(boosterEffect / 2);
    sapperEffect = Math.floor(sapperEffect / 2);
  }

  score += boosterEffect;
  score -= Math.abs(sapperEffect);

  // Step 4: Rock Candy (+2 per hazard card)
  if (hasRockCandy) {
    score += hazardCardCount * 2;
  }

  // Step 5: Hazard penalties
  // Up In Flames: -1 per hazard card
  if (hazardModifiers.includes('hazard-penalty')) {
    score -= hazardCardCount;
  }

  // Brittle Bones: cap at 7
  if (hazardModifiers.includes('cap-7')) {
    score = Math.min(score, 7);
  }

  return { score: Math.max(0, score), traitBonus };
}

/**
 * Apply Score Inversion — swap highest and lowest scores.
 * @param {{ name: string, score: number }[]} playerScores
 * @returns {{ name: string, score: number }[]}
 */
export function applyScoreInversion(playerScores) {
  if (playerScores.length < 2) return playerScores;

  const scores = playerScores.map((p) => ({ ...p }));
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  if (lowest.name === highest.name) return scores;

  // Swap
  const lowScore = lowest.score;
  const highScore = highest.score;

  return scores.map((p) => {
    if (p.name === lowest.name) return { ...p, score: highScore };
    if (p.name === highest.name) return { ...p, score: lowScore };
    return p;
  });
}

/**
 * Check if a player is eliminated by disasters.
 * Eliminated if 3 same type OR 3 different types.
 * Meteors count as wild (all types).
 *
 * @param {{ type: string }[]} disasterCards - Cards in disaster area
 * @returns {{ eliminated: boolean, reason: string }}
 */
export function checkElimination(disasterCards) {
  if (disasterCards.length < 3) {
    return { eliminated: false, reason: '' };
  }

  // Count by type (meteors count as all types)
  const counts = { natural: 0, predator: 0, emotional: 0 };
  const uniqueTypes = new Set();

  for (const card of disasterCards) {
    if (card.type === 'meteor') {
      counts.natural++;
      counts.predator++;
      counts.emotional++;
      uniqueTypes.add('natural');
      uniqueTypes.add('predator');
      uniqueTypes.add('emotional');
    } else {
      counts[card.type]++;
      uniqueTypes.add(card.type);
    }
  }

  // Check 3 of same type
  for (const [type, count] of Object.entries(counts)) {
    if (count >= 3) {
      return { eliminated: true, reason: `3x ${type}` };
    }
  }

  // Check 3 different types
  if (uniqueTypes.size >= 3) {
    return { eliminated: true, reason: '3 different types' };
  }

  return { eliminated: false, reason: '' };
}

/**
 * Advance on escape route.
 * @param {number} currentPosition - Current position (0–50)
 * @param {number} pointsWon - Points from winning the round
 * @param {number} disasterCount - Number of disaster cards (passive advance)
 * @param {boolean} hasSlipperySlope - Whether to move back 1 after
 * @param {number} max - Maximum position
 * @returns {number} New position
 */
export function advanceEscapeRoute(currentPosition, pointsWon, disasterCount, hasSlipperySlope = false, max = 50) {
  let newPos = currentPosition + pointsWon + disasterCount;

  if (hasSlipperySlope) {
    newPos -= 1;
  }

  return Math.min(Math.max(0, newPos), max);
}

/**
 * Check if a player has won by reaching 50.
 * @param {number} position
 * @returns {boolean}
 */
export function checkWin(position) {
  return position >= 50;
}

/**
 * Determine round winner and loser.
 * @param {{ name: string, score: number }[]} playerScores
 * @returns {{ winner: string|null, loser: string|null, tied: boolean }}
 */
export function determineRoundOutcome(playerScores) {
  if (playerScores.length === 0) return { winner: null, loser: null, tied: false };

  const sorted = [...playerScores].sort((a, b) => b.score - a.score);
  const highScore = sorted[0].score;
  const lowScore = sorted[sorted.length - 1].score;

  const winners = sorted.filter((p) => p.score === highScore);
  const losers = sorted.filter((p) => p.score === lowScore);

  return {
    winner: winners.length === 1 ? winners[0].name : null,
    loser: losers.length === 1 ? losers[0].name : null,
    tied: winners.length > 1 || losers.length > 1,
  };
}
