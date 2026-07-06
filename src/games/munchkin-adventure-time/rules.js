/**
 * Munchkin Adventure Time — Pure game logic.
 * No UI dependencies, fully testable in isolation.
 */

/**
 * Apply a level delta, floored at 1.
 * The ceiling (10) is enforced by the win-condition check, not here,
 * so levels above 10 are technically valid until checked.
 * @param {number} currentLevel
 * @param {number} delta
 * @returns {number}
 */
export function applyLevelDelta(currentLevel, delta) {
  return Math.max(1, currentLevel + delta);
}

/**
 * Check if any player has reached the target level via a kill.
 * Only source='kill' can trigger a win — selling items and Go Up a Level
 * cards cannot win the game (rules p.3 and p.2 respectively).
 * @param {{ name: string, level: number }[]} players
 * @param {number} targetLevel - Default 10
 * @param {'kill'|'sell'|'card'|'set'} source - How the level was gained
 * @returns {{ isOver: boolean, winners: string[] }}
 */
export function checkWinner(players, targetLevel = 10, source = 'kill') {
  if (source !== 'kill') return { isOver: false, winners: [] };
  const winners = players.filter((p) => p.level >= targetLevel);
  return { isOver: winners.length > 0, winners: winners.map((w) => w.name) };
}

/**
 * Calculate combat strengths and determine the winner.
 * Monsters win ties — your strength must be strictly greater.
 *
 * @param {Object} yourSide
 * @param {number} yourSide.playerLevel - Active player's current level
 * @param {number} [yourSide.equipment=0] - Your equipment bonus
 * @param {number} [yourSide.modifiers=0] - Other modifiers on your side
 * @param {number} [yourSide.helperLevel=0] - Helper's level (0 if no helper)
 * @param {number} [yourSide.helperEquipment=0] - Helper's equipment bonus
 * @param {Object} monsterSide
 * @param {{ level: number, modifiers: number }[]} monsterSide.monsters - One or two monsters
 * @returns {{ yourStrength: number, monsterStrength: number, youWin: boolean }}
 */
export function calculateCombat(yourSide, monsterSide) {
  const {
    playerLevel,
    equipment = 0,
    modifiers = 0,
    helperLevel = 0,
    helperEquipment = 0,
  } = yourSide;

  const yourStrength = playerLevel + equipment + modifiers + helperLevel + helperEquipment;
  const monsterStrength = monsterSide.monsters.reduce(
    (sum, m) => sum + (m.level || 0) + (m.modifiers || 0),
    0
  );

  return {
    yourStrength,
    monsterStrength,
    youWin: yourStrength > monsterStrength, // monsters win ties
  };
}
