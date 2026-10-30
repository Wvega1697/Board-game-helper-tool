import { describe, it, expect } from 'vitest';
import { resolveOutcome, needsSquireLeft } from './rules.js';

describe('excalibur resolveOutcome', () => {
  it('chaos when nobody holds Excalibur', () => {
    expect(resolveOutcome(4, { excalibur: null, cursed: 1, squire: null })).toEqual({ type: 'chaos', winners: [], loser: 1 });
  });
  it('Excalibur holder wins, cursed is loser', () => {
    expect(resolveOutcome(4, { excalibur: 2, cursed: 0, squire: null })).toEqual({ type: 'normal', winners: [2], loser: 0 });
  });
  it('holding both gives everyone else a tainted win', () => {
    expect(resolveOutcome(3, { excalibur: 1, cursed: 1, squire: null }).winners).toEqual([0, 2]);
  });
  it('squire wins with the chosen left neighbour only at 4+ players', () => {
    expect(resolveOutcome(4, { excalibur: 0, cursed: null, squire: 3, squireLeft: 0 }).winners).toEqual([0, 3]);
    expect(resolveOutcome(4, { excalibur: 0, cursed: null, squire: 3, squireLeft: 1 }).winners).toEqual([0]);
    expect(resolveOutcome(3, { excalibur: 0, cursed: null, squire: 2, squireLeft: 0 }).winners).toEqual([0]);
  });
  it('needsSquireLeft only for a non-cursed squire holder at 4+ players', () => {
    expect(needsSquireLeft(4, { squire: 1, cursed: 2 })).toBe(true);
    expect(needsSquireLeft(4, { squire: 1, cursed: 1 })).toBe(false);
    expect(needsSquireLeft(3, { squire: 1, cursed: null })).toBe(false);
  });
});
