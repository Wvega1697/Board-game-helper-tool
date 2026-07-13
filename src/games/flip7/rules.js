/**
 * Flip 7 — Pure scoring logic.
 * No UI dependencies, fully testable in isolation.
 */

/**
 * Check if a set of number cards contains a duplicate (bust).
 * @param {number[]} numberCards - Array of card values (0–12)
 * @returns {boolean}
 */
export function checkBust(numberCards) {
  const seen = new Set();
  for (const card of numberCards) {
    if (seen.has(card)) return true;
    seen.add(card);
  }
  return false;
}

/**
 * Calculate the score for a single round.
 * Order: sum numbers → apply x2 multipliers → add modifiers → add 7-card bonus.
 * @param {Object} params
 * @param {number[]} params.numberCards - Array of number card values
 * @param {number} params.multiplierCount - Number of x2 multiplier cards (0, 1, 2...)
 * @param {number} params.modifierTotal - Sum of modifier card values
 * @param {boolean} params.isBust - Whether the player busted
 * @param {boolean} params.hasSecondChance - Whether Second Chance was used to avoid bust
 * @returns {{ score: number, hasBonus: boolean }}
 */
export function calculateRoundScore({
  numberCards = [],
  multiplierCount = 0,
  modifierTotal = 0,
  isBust = false,
}) {
  if (isBust) {
    return { score: 0, hasBonus: false };
  }

  // Step 1: Sum number cards
  let sum = numberCards.reduce((acc, val) => acc + val, 0);

  // Step 2: Apply x2 multipliers (only to number card sum)
  for (let i = 0; i < multiplierCount; i++) {
    sum *= 2;
  }

  // Step 3: Add modifier values
  sum += modifierTotal;

  // Step 4: Check for 7-card bonus (7 unique number cards)
  const uniqueNumbers = new Set(numberCards);
  const hasBonus = uniqueNumbers.size >= 7;
  if (hasBonus) {
    sum += 15;
  }

  return { score: Math.max(0, sum), hasBonus };
}

/**
 * Calculate the total score across multiple rounds.
 * @param {number[]} roundScores - Array of scores per round
 * @returns {number}
 */
export function calculateGameTotal(roundScores) {
  return roundScores.reduce((acc, s) => acc + s, 0);
}

/**
 * Check if any player has reached or exceeded the target score.
 * @param {{ name: string, totalScore: number }[]} players
 * @param {number} targetScore - Default 200
 * @returns {{ isOver: boolean, winners: string[] }}
 */
export function checkWinner(players, targetScore = 200) {
  const winners = players.filter((p) => p.totalScore >= targetScore);
  if (winners.length === 0) {
    return { isOver: false, winners: [] };
  }
  // If multiple players cross 200 in the same round, highest score wins
  const maxScore = Math.max(...winners.map((w) => w.totalScore));
  return {
    isOver: true,
    winners: winners.filter((w) => w.totalScore === maxScore).map((w) => w.name),
  };
}
