import { test, expect } from 'vitest';
import { applyLevelDelta, checkWinner, calculateCombat } from './rules.js';

test('level cannot go below 1', () => {
  expect(applyLevelDelta(1, -5)).toBe(1);
});

test('level increases normally', () => {
  expect(applyLevelDelta(3, 2)).toBe(5);
});

test('kill at level 10 triggers win', () => {
  const result = checkWinner([{ name: 'Finn', level: 10 }], 10, 'kill');
  expect(result.isOver).toBe(true);
  expect(result.winners[0]).toBe('Finn');
});

test('sell at level 10 never wins', () => {
  const result = checkWinner([{ name: 'Jake', level: 10 }], 10, 'sell');
  expect(result.isOver).toBe(false);
});

test('strength 7 beats monster 6', () => {
  const result = calculateCombat(
    { playerLevel: 5, equipment: 2, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
    { monsters: [{ level: 6, modifiers: 0 }] }
  );
  expect(result.youWin).toBe(true);
});

test('tie goes to monster', () => {
  const result = calculateCombat(
    { playerLevel: 5, equipment: 0, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
    { monsters: [{ level: 5, modifiers: 0 }] }
  );
  expect(result.youWin).toBe(false);
});

test('two monsters sum to 9, player 8 loses', () => {
  const result = calculateCombat(
    { playerLevel: 8, equipment: 0, modifiers: 0, helperLevel: 0, helperEquipment: 0 },
    { monsters: [{ level: 4, modifiers: 0 }, { level: 4, modifiers: 1 }] }
  );
  expect(result.youWin).toBe(false);
});
