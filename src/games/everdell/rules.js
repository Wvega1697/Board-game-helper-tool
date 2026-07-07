/**
 * Everdell — Pure end-of-game scoring logic.
 * No UI dependencies, fully testable in isolation.
 */

/**
 * Calculate a player's final score.
 * Order matches the rulebook's suggested tallying order.
 *
 * @param {Object} params
 * @param {number} params.baseCardPoints   - VP printed on cards in the city
 * @param {number} params.pointTokens      - Accumulated point tokens (1-pt and 3-pt)
 * @param {number} params.prosperityBonus  - End-game bonus from purple Prosperity cards
 * @param {number} params.journeyPoints    - VP from workers placed on Journey locations
 * @param {number} params.eventPoints      - VP from achieved Basic and Special Events
 * @returns {number} Total VP
 */
export function calculateFinalScore({
  baseCardPoints = 0,
  pointTokens = 0,
  prosperityBonus = 0,
  journeyPoints = 0,
  eventPoints = 0,
}) {
  return baseCardPoints + pointTokens + prosperityBonus + journeyPoints + eventPoints;
}

/**
 * Determine winners from final player standings.
 * Tiebreaker 1: most Events achieved.
 * Tiebreaker 2: most leftover resources.
 *
 * @param {{ name: string, totalScore: number, eventsAchieved: number, leftoverResources: number }[]} players
 * @returns {string[]} Names of the winner(s)
 */
export function checkWinner(players) {
  if (!players || players.length === 0) return [];

  const maxScore = Math.max(...players.map((p) => p.totalScore));
  let winners = players.filter((p) => p.totalScore === maxScore);

  if (winners.length > 1) {
    const maxEvents = Math.max(...winners.map((w) => w.eventsAchieved));
    winners = winners.filter((w) => w.eventsAchieved === maxEvents);
  }

  if (winners.length > 1) {
    const maxResources = Math.max(...winners.map((w) => w.leftoverResources));
    winners = winners.filter((w) => w.leftoverResources === maxResources);
  }

  return winners.map((w) => w.name);
}
