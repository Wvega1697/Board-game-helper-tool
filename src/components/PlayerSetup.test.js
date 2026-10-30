import { describe, it, expect } from 'vitest';
import { initialPlayers, initialRules } from './PlayerSetup.jsx';

describe('initialPlayers', () => {
  it('starts blank with no saved names', () => {
    expect(initialPlayers(null, 2, 6).map((p) => p.name)).toEqual(['', '']);
  });
  it('reuses saved names, keeping blanks blank', () => {
    expect(initialPlayers(['Ana', '', 'Luis'], 2, 6).map((p) => p.name)).toEqual(['Ana', '', 'Luis']);
  });
  it('pads to minPlayers and clamps to maxPlayers', () => {
    expect(initialPlayers(['Ana'], 3, 6).map((p) => p.name)).toEqual(['Ana', '', '']);
    expect(initialPlayers(['A', 'B', 'C', 'D'], 2, 3).map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });
});

describe('initialRules', () => {
  const cfg = [{ id: 'a', default: true }, { id: 'b', default: false }];
  it('uses defaults when nothing was saved', () => {
    expect([...initialRules(cfg, null)]).toEqual(['a']);
  });
  it('restores saved rules, including all-off, and ignores unknown ids', () => {
    expect([...initialRules(cfg, ['b', 'zzz'])]).toEqual(['b']);
    expect([...initialRules(cfg, [])]).toEqual([]);
  });
  it('is empty for games without house rules', () => {
    expect(initialRules(undefined, ['a']).size).toBe(0);
  });
});
