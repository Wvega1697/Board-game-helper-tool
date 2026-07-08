/**
 * Harmonies — Pure end-of-game scoring logic.
 * No UI dependencies, fully testable in isolation.
 *
 * Scoring reference (from rulebook player aid):
 *   Trees    (green)  — height 1: 3 pts, height 2: 7 pts, height 3: 12 pts
 *   Mountains (gray)  — must be adjacent to another mountain; height 1: 1 pt, height 2: 3 pts, height 3: 7 pts
 *   Fields   (yellow) — each distinct group of 2+ contiguous tokens = 5 pts
 *   Buildings (red)   — each building surrounded by 3+ different-color top tokens = 5 pts
 *   Rivers   (blue)   — longest river: length 1→1, 2→2, 3→4, 4→7, 5→11, 6→15, then +4 per token beyond 6
 *   Animal cards      — sum of VP on completed cards
 */

/** Points per tree height (index = height, 1-based). */
export const TREE_POINTS = [0, 3, 7, 12];

/** Points per mountain height (index = height, 1-based) — requires adjacency. */
export const MOUNTAIN_POINTS = [0, 1, 3, 7];

/** Points for a river of the given length (index = length, 1-based, up to 6). */
export const RIVER_POINTS = [0, 1, 2, 4, 7, 11, 15];

/**
 * Points for a river of a given length.
 * Beyond length 6, each additional token is worth 4 pts.
 *
 * @param {number} length
 * @returns {number}
 */
export function riverScore(length) {
  if (length <= 0) return 0;
  if (length <= 6) return RIVER_POINTS[length];
  return RIVER_POINTS[6] + (length - 6) * 4;
}

/**
 * Calculate a player's final score.
 * Players enter landscape subtotals they counted on their physical board.
 *
 * @param {Object} params
 * @param {number} params.treePoints      - Sum of all tree scores
 * @param {number} params.mountainPoints  - Sum of all qualifying mountain scores
 * @param {number} params.fieldPoints     - 5 × number of distinct fields
 * @param {number} params.buildingPoints  - 5 × number of qualifying buildings
 * @param {number} params.riverPoints     - Score from longest river
 * @param {number} params.animalPoints    - Sum of VP from completed animal cards
 * @returns {number} Total VP
 */
export function calculateFinalScore({
  treePoints = 0,
  mountainPoints = 0,
  fieldPoints = 0,
  buildingPoints = 0,
  riverPoints = 0,
  animalPoints = 0,
}) {
  return treePoints + mountainPoints + fieldPoints + buildingPoints + riverPoints + animalPoints;
}

/**
 * Determine winner(s) from final standings.
 * Tiebreaker 1: most animal cubes placed.
 * Tiebreaker 2: most completed animal cards.
 * Tiebreaker 3: fewest unplaced animal cubes.
 *
 * @param {{ name: string, totalScore: number, animalCubesPlaced: number, completedCards: number, unplacedCubes: number }[]} players
 * @returns {string[]} Names of the winner(s)
 */
export function checkWinner(players) {
  if (!players || players.length === 0) return [];

  const maxScore = Math.max(...players.map((p) => p.totalScore));
  let winners = players.filter((p) => p.totalScore === maxScore);

  if (winners.length > 1) {
    const max = Math.max(...winners.map((w) => w.animalCubesPlaced));
    winners = winners.filter((w) => w.animalCubesPlaced === max);
  }

  if (winners.length > 1) {
    const max = Math.max(...winners.map((w) => w.completedCards));
    winners = winners.filter((w) => w.completedCards === max);
  }

  if (winners.length > 1) {
    const min = Math.min(...winners.map((w) => w.unplacedCubes));
    winners = winners.filter((w) => w.unplacedCubes === min);
  }

  return winners.map((w) => w.name);
}

/**
 * Return true if a tie in total score exists among the given players.
 *
 * @param {{ totalScore: number }[]} players
 * @returns {boolean}
 */
export function hasTie(players) {
  if (!players || players.length < 2) return false;
  const maxScore = Math.max(...players.map((p) => p.totalScore));
  return players.filter((p) => p.totalScore === maxScore).length > 1;
}
