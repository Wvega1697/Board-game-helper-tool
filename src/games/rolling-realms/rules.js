/**
 * Rolling Realms — Pure scoring logic.
 * No UI dependencies, fully testable in isolation.
 *
 * Scores are kept in integer tenths internally because unspent resources
 * are worth 0.1 ★ each and plain float addition drifts (0.1 + 0.2 ≠ 0.3).
 */

export const B2C_ID = 'between-two-cities';

/**
 * Stars for each realm in a round, resolving Between Two Cities:
 * it scores the lower of the other two realms, capped by its filled squares.
 *
 * @param {string[]} realmIds - The realms used this round
 * @param {Object} entry      - { [realmId]: stars } (for B2C: filled squares)
 * @returns {Object} { [realmId]: stars }
 */
export function resolveRealmStars(realmIds, entry = {}) {
  const stars = Object.fromEntries(realmIds.map((id) => [id, entry[id] || 0]));
  if (B2C_ID in stars) {
    const others = realmIds.filter((id) => id !== B2C_ID).map((id) => stars[id]);
    stars[B2C_ID] = Math.min(stars[B2C_ID], ...others);
  }
  return stars;
}

/**
 * A player's score for one round: realm stars + 0.1 per unspent resource.
 *
 * @param {string[]} realmIds
 * @param {Object} entry - { [realmId]: number, resources: number }
 * @returns {number} Round score, rounded to tenths
 */
export function calculateRoundScore(realmIds, entry = {}) {
  const stars = Object.values(resolveRealmStars(realmIds, entry)).reduce((a, b) => a + b, 0);
  return (stars * 10 + (entry.resources || 0)) / 10;
}

/**
 * Sum round scores without float drift.
 *
 * @param {number[]} roundScores
 * @returns {number}
 */
export function calculateTotal(roundScores) {
  return roundScores.reduce((a, s) => a + Math.round(s * 10), 0) / 10;
}

/**
 * Determine winners. Ties broken by highest round 3 score, then round 2,
 * then round 1; if still tied the victory is shared.
 *
 * @param {{ totalScore: number, roundScores: number[] }[]} players
 * @returns {number[]} Indices of the winner(s)
 */
export function checkWinner(players) {
  if (!players || players.length === 0) return [];
  let idx = players.map((_, i) => i);
  const keep = (score) => {
    const max = Math.max(...idx.map(score));
    idx = idx.filter((i) => score(i) === max);
  };
  keep((i) => players[i].totalScore);
  const rounds = players[0].roundScores.length;
  for (let r = rounds - 1; r >= 0 && idx.length > 1; r--) keep((i) => players[i].roundScores[r] || 0);
  return idx;
}
