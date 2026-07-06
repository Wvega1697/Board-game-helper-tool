import { describe, it, expect } from 'vitest';
import {
  resolveThemeTypes,
  resolveHypnotist,
  calculateRoundScore,
  checkWinner,
} from './rules.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal guest card for testing. */
const g = (overrides) => ({
  id: 'test',
  name: 'Test',
  type: 'Political',
  basePoints: 3,
  likes: [],
  dislikes: [],
  isHypnotist: false,
  isInfluencer: false,
  isBaker: false,
  isCampaignManager: false,
  isCommander: false,
  isCostumeDesigner: false,
  isPartyPlanner: false,
  ...overrides,
});

// ── resolveThemeTypes ─────────────────────────────────────────────────────────

describe('resolveThemeTypes', () => {
  it('returns base types when no planners active', () => {
    expect(resolveThemeTypes(['Political'], [])).toEqual(['Political']);
  });

  it('last planner wins (official rule)', () => {
    expect(resolveThemeTypes(['Political'], ['Raid', 'Costume'], false)).toEqual(['Costume']);
  });

  it('combines distinct planners when house rule is on', () => {
    const result = resolveThemeTypes(['Political'], ['Raid', 'Costume'], true);
    expect(result).toContain('Raid');
    expect(result).toContain('Costume');
    expect(result).toHaveLength(2);
  });

  it('deduplicates planners when house rule is on and both declare same type', () => {
    expect(resolveThemeTypes(['Political'], ['Raid', 'Raid'], true)).toEqual(['Raid']);
  });
});

// ── resolveHypnotist ──────────────────────────────────────────────────────────

describe('resolveHypnotist — official rule (any presence activates)', () => {
  it('no hypnotists → no swap', () => {
    expect(resolveHypnotist([{ guestCards: [g()] }, { guestCards: [g()] }])).toBe(false);
  });

  it('1 hypnotist → swap', () => {
    expect(
      resolveHypnotist([
        { guestCards: [g({ isHypnotist: true })] },
        { guestCards: [g()] },
      ])
    ).toBe(true);
  });

  it('2 hypnotists → still swap (official: any presence = active)', () => {
    expect(
      resolveHypnotist([
        { guestCards: [g({ isHypnotist: true })] },
        { guestCards: [g({ isHypnotist: true })] },
      ])
    ).toBe(true);
  });
});

describe('resolveHypnotist — house rule: odd/even stacking', () => {
  const stackRule = true;

  it('1 hypnotist → swap', () => {
    expect(
      resolveHypnotist([{ guestCards: [g({ isHypnotist: true })] }], stackRule)
    ).toBe(true);
  });

  it('2 hypnotists → cancelled (even = no swap)', () => {
    expect(
      resolveHypnotist([
        { guestCards: [g({ isHypnotist: true })] },
        { guestCards: [g({ isHypnotist: true })] },
      ], stackRule)
    ).toBe(false);
  });

  it('3 hypnotists → swap again', () => {
    expect(
      resolveHypnotist([
        { guestCards: [g({ isHypnotist: true }), g({ isHypnotist: true })] },
        { guestCards: [g({ isHypnotist: true })] },
      ], stackRule)
    ).toBe(true);
  });
});

// ── calculateRoundScore ───────────────────────────────────────────────────────

describe('calculateRoundScore — base points only', () => {
  it('sums base points with no bonuses', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ basePoints: 3 }), g({ basePoints: 2 })],
      effectiveThemeTypes: ['Raid'],
      themeAttributes: [],
    });
    expect(score).toBe(5);
  });
});

describe('calculateRoundScore — theme bonus', () => {
  it('+2 per card matching theme type', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ type: 'Political', basePoints: 3 })],
      effectiveThemeTypes: ['Political'],
      themeAttributes: [],
    });
    expect(score).toBe(5); // 3 base + 2 theme
  });

  it('gray cards never match theme type', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ type: 'gray', basePoints: 1 })],
      effectiveThemeTypes: ['Political'],
      themeAttributes: [],
    });
    expect(score).toBe(1);
  });
});

describe('calculateRoundScore — likes / dislikes', () => {
  it('+1 per matching like attribute', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ type: 'Political', basePoints: 3, likes: ['Games', 'Children'] })],
      effectiveThemeTypes: ['Political'],
      themeAttributes: ['Games', 'Children', 'Late Nights'],
    });
    // 3 base + 2 theme + 1 (Games) + 1 (Children) = 7
    expect(score).toBe(7);
  });

  it('-1 per matching dislike attribute', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ type: 'Political', basePoints: 4, dislikes: ['Games'] })],
      effectiveThemeTypes: ['Political'],
      themeAttributes: ['Games', 'Children', 'Late Nights'],
    });
    // 4 base + 2 theme - 1 (Games) = 5
    expect(score).toBe(5);
  });

  it('hypnotist swap reverses likes/dislikes', () => {
    const { score } = calculateRoundScore({
      guestCards: [g({ type: 'Political', basePoints: 3, likes: ['Games'], dislikes: ['Children'] })],
      effectiveThemeTypes: ['Political'],
      themeAttributes: ['Games', 'Children', 'Late Nights'],
      swapLikesDislikes: true,
    });
    // 3 base + 2 theme - 1 (Games like→penalty) + 1 (Children dislike→bonus) = 5
    expect(score).toBe(5);
  });
});

describe('calculateRoundScore — Influencer', () => {
  it('adds declared attribute as a Like for all cards', () => {
    const { score } = calculateRoundScore({
      guestCards: [
        g({ type: 'Political', basePoints: 3, likes: [] }),
        g({ type: 'Political', basePoints: 3, likes: [] }),
      ],
      effectiveThemeTypes: ['Political'],
      themeAttributes: ['Games', 'Children', 'Late Nights'],
      influencerAttribute: 'Games',
    });
    // Each card: 3 base + 2 theme + 1 (Games via Influencer) = 6. Total = 12
    expect(score).toBe(12);
  });
});

describe('calculateRoundScore — type booster effects', () => {
  it('Baker adds +1 per Family-Friendly card', () => {
    const { score, breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Family-Friendly', basePoints: 2, isBaker: true }),
        g({ type: 'Family-Friendly', basePoints: 2 }),
      ],
      effectiveThemeTypes: ['Family-Friendly'],
      themeAttributes: [],
    });
    // 4 base + 4 theme + 2 baker bonus (2 FF cards) = 10
    expect(breakdown.typeBoostPoints).toBe(2);
    expect(score).toBe(10);
  });

  it('Commander adds +1 per Raid card', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Raid', basePoints: 3, isCommander: true }),
        g({ type: 'Raid', basePoints: 3 }),
      ],
      effectiveThemeTypes: ['Raid'],
      themeAttributes: [],
    });
    expect(breakdown.typeBoostPoints).toBe(2);
  });
});

describe('calculateRoundScore — synergy bonus', () => {
  it('+3 for 3 same-type cards', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
      ],
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.synergyBonus).toBe(3);
  });

  it('+5 for 4 same-type cards', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: Array(4).fill(g({ type: 'Costume', basePoints: 1 })),
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.synergyBonus).toBe(5);
  });

  it('+10 for 5 same-type cards', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: Array(5).fill(g({ type: 'Political', basePoints: 1 })),
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.synergyBonus).toBe(10);
  });

  it('no synergy bonus if 3+ gray cards are present', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'gray', basePoints: 1 }),
        g({ type: 'gray', basePoints: 1 }),
        g({ type: 'gray', basePoints: 1 }),
      ],
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.synergyBonus).toBe(0);
  });
});

describe('calculateRoundScore — rainbow bonus', () => {
  it('+5 when 1 card of each of the 4 types is present', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Family-Friendly', basePoints: 1 }),
        g({ type: 'Political', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
        g({ type: 'Costume', basePoints: 1 }),
      ],
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.rainbowBonus).toBe(5);
  });

  it('no rainbow when only 3 types', () => {
    const { breakdown } = calculateRoundScore({
      guestCards: [
        g({ type: 'Family-Friendly', basePoints: 1 }),
        g({ type: 'Political', basePoints: 1 }),
        g({ type: 'Raid', basePoints: 1 }),
      ],
      effectiveThemeTypes: [],
      themeAttributes: [],
    });
    expect(breakdown.rainbowBonus).toBe(0);
  });
});

describe('checkWinner', () => {
  it('returns winning player names by highest score', () => {
    expect(checkWinner([{ name: 'A', totalScore: 25 }, { name: 'B', totalScore: 20 }])).toEqual(['A']);
  });

  it('tied winners when both have the same highest score', () => {
    const result = checkWinner([
      { name: 'A', totalScore: 27 },
      { name: 'B', totalScore: 27 },
    ]);
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).toHaveLength(2);
  });
});
