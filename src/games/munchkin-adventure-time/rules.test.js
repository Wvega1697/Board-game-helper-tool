import { expect } from 'vitest';
import { applyLevelDelta, checkWinner, calculateCombat } from './rules.js';

// Level floor at 1
expect(applyLevelDelta(1, -5), 'level cannot go below 1').toBe(1);

// Normal positive delta
expect(applyLevelDelta(3, 2), 'level increases normally').toBe(5);

// Kill at targetLevel wins
const killWin = checkWinner([{ name: 'Finn', level: 10 }], 10, 'kill');
expect(killWin.isOver, 'kill at level 10 triggers win').toBe(true);
expect(killWin.winners[0]).toBe('Finn');

// Sell at targetLevel does NOT win
const sellNoWin = checkWinner([{ name: 'Jake', level: 10 }], 10, 'sell');
expect(sellNoWin.isOver, 'sell at level 10 never wins').toBe(false);

// Combat: strictly greater wins
const win = calculateCombat(
  { playerLevel: 5, equipment: 2, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
  { monsters: [{ level: 6, modifiers: 0 }] }
);
expect(win.youWin, 'strength 7 beats monster 6').toBe(true);

// Combat: tie goes to monster
const tie = calculateCombat(
  { playerLevel: 5, equipment: 0, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
  { monsters: [{ level: 5, modifiers: 0 }] }
);
expect(tie.youWin, 'tie goes to monster').toBe(false);

// Combat: two monsters summed
const twoMonsters = calculateCombat(
  { playerLevel: 8, equipment: 0, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
  { monsters: [{ level: 4, modifiers: 0 }, { level: 4, modifiers: 1 }] }
);
expect(twoMonsters.youWin, 'two monsters sum to 9, player 8 loses').toBe(false);

console.log('✓ All Munchkin Adventure Time rules checks passed');
