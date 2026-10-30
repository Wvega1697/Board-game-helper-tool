/**
 * Resolve the end of an Excalibur game from who holds each sword chip.
 * @param {number} playerCount
 * @param {{excalibur: number|null, cursed: number|null, squire: number|null, squireLeft?: number|null}} holders
 *   player index or null (chip in Avalon/trashed); squireLeft = the player sitting to the left of the Squire holder
 * @returns {{type: 'chaos'|'tainted'|'normal', winners: number[], loser: number|null}}
 */
export function resolveOutcome(playerCount, { excalibur, cursed, squire, squireLeft }) {
    const all = Array.from({ length: playerCount }, (_, i) => i);
    let type = 'normal';
    let winners;

    if (excalibur == null) {
        return { type: 'chaos', winners: [], loser: cursed ?? null };
    } else if (excalibur === cursed) {
        type = 'tainted';
        winners = all.filter((i) => i !== excalibur);
    } else {
        winners = [excalibur];
    }

    // Squire Sword: also wins if the player on your left wins (not in 2-3 player games)
    if (squire != null && squire !== cursed && playerCount >= 4 && winners.includes(squireLeft)) {
        winners = [...new Set([...winners, squire])];
    }
    return { type, winners, loser: cursed ?? null };
}

/** Squire Sword only matters when someone holds it, isn't the Cursed holder, and the game has 4+ players. */
export const needsSquireLeft = (playerCount, { squire, cursed }) =>
    squire != null && squire !== cursed && playerCount >= 4;
