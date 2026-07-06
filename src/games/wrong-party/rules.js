/**
 * Wrong Party — Pure scoring logic.
 * No UI dependencies, fully testable in isolation.
 */

/** All four party theme color types */
export const THEME_TYPES = ['Family-Friendly', 'Political', 'Raid', 'Costume'];

/** All eight scorable attributes */
export const ATTRIBUTES = ['Talking', 'Fighting', 'Children', 'Music', 'Drinks', 'Food', 'Games', 'Late Nights'];

/**
 * Derive the effective theme types for the active round.
 * Party Planners can override (or combine, if house rule is active).
 *
 * @param {string[]} themeTypes       - The base theme card's type(s), e.g. ['Political']
 * @param {string[]} plannerTypes     - All declared types from Party Planner cards this round
 * @param {boolean}  combinePlanners  - House rule: combine planners into a multi-type theme
 * @returns {string[]} effective theme types
 */
export function resolveThemeTypes(themeTypes, plannerTypes = [], combinePlanners = false) {
  if (plannerTypes.length === 0) return themeTypes;

  if (!combinePlanners) {
    // Official rule: last declaration wins — use only the last planner's type
    return [plannerTypes[plannerTypes.length - 1]];
  }

  // House rule: union of all declared types (deduplicated)
  return [...new Set(plannerTypes)];
}

/**
 * Count how many guests in a player's party match the effective theme type(s).
 * Dual-type guests use their declared color stored in guest.declaredType.
 *
 * @param {{ type: string, declaredType?: string }[]} guestCards
 * @param {string[]} effectiveThemeTypes
 * @returns {number}
 */
function countThemeMatches(guestCards, effectiveThemeTypes) {
  return guestCards.filter((g) => {
    const t = g.declaredType || g.type;
    return effectiveThemeTypes.includes(t);
  }).length;
}

/**
 * Check if a guest's attribute set Likes a given attribute, with Influencer injection.
 *
 * @param {{ likes: string[], dislikes: string[] }} guest
 * @param {string|null} influencerAttribute - Extra declared like from Influencer card
 * @returns {{ likes: string[], dislikes: string[] }}
 */
function effectiveLikesDislikes(guest, influencerAttribute) {
  const likes = influencerAttribute
    ? [...new Set([...guest.likes, influencerAttribute])]
    : guest.likes;
  return { likes, dislikes: guest.dislikes };
}

/**
 * Calculate score for a single player's party area for one round.
 *
 * @param {Object}   params
 * @param {{ id: string, name: string, type: string, declaredType?: string,
 *           basePoints: number, likes: string[], dislikes: string[],
 *           isHypnotist: boolean, isInfluencer: boolean, isBaker: boolean,
 *           isCampaignManager: boolean, isCommander: boolean,
 *           isCostumeDesigner: boolean, isPartyPlanner: boolean }[]} params.guestCards
 *           All guest cards currently in this player's Party Area.
 * @param {string[]} params.effectiveThemeTypes
 *           Resolved theme type(s) for the round (after Party Planner overrides).
 * @param {string[]} params.themeAttributes
 *           The three attributes printed on the active Theme card.
 * @param {boolean}  params.swapLikesDislikes
 *           True if an odd number of Hypnotists are active globally this round.
 * @param {string|null} params.influencerAttribute
 *           The attribute declared by this player's Influencer card (null if none).
 * @returns {{ score: number, breakdown: Object }}
 */
export function calculateRoundScore({
  guestCards = [],
  effectiveThemeTypes = [],
  themeAttributes = [],
  swapLikesDislikes = false,
  influencerAttribute = null,
}) {
  let basePoints = 0;
  let themeBonus = 0;
  let likePoints = 0;
  let dislikePoints = 0;
  let typeBoostPoints = 0;
  let synergyBonus = 0;
  let rainbowBonus = 0;

  // --- Effect card flags (scoring-phase effects) ---
  const hasBaker = guestCards.some((g) => g.isBaker);
  const hasCampaignManager = guestCards.some((g) => g.isCampaignManager);
  const hasCommander = guestCards.some((g) => g.isCommander);
  const hasCostumeDesigner = guestCards.some((g) => g.isCostumeDesigner);

  for (const guest of guestCards) {
    // Base points
    basePoints += guest.basePoints ?? 0;

    // Theme color match → +2
    const guestType = guest.declaredType || guest.type;
    if (guestType !== 'gray' && guestType !== 'dual' && guestType !== 'rainbow') {
      if (effectiveThemeTypes.includes(guestType)) {
        themeBonus += 2;
      }
    }

    // Likes / Dislikes against theme attributes
    const { likes, dislikes } = effectiveLikesDislikes(guest, influencerAttribute);
    for (const attr of themeAttributes) {
      if (swapLikesDislikes) {
        // Hypnotist is active: likes count as -1, dislikes as +1
        if (likes.includes(attr)) likePoints -= 1;
        if (dislikes.includes(attr)) dislikePoints += 1;
      } else {
        if (likes.includes(attr)) likePoints += 1;
        if (dislikes.includes(attr)) dislikePoints -= 1;
      }
    }

    // Scoring-phase type boosters
    if (hasBaker && guestType === 'Family-Friendly') typeBoostPoints += 1;
    if (hasCampaignManager && guestType === 'Political') typeBoostPoints += 1;
    if (hasCommander && guestType === 'Raid') typeBoostPoints += 1;
    if (hasCostumeDesigner && guestType === 'Costume') typeBoostPoints += 1;
  }

  // --- Synergy bonus (cards of the same non-gray type) ---
  // ponytail: only count non-gray, non-rainbow cards; if ≥3 gray present, no synergy
  const grayCount = guestCards.filter((g) => g.type === 'gray').length;
  if (grayCount < 3) {
    const typeCounts = {};
    for (const g of guestCards) {
      const t = g.declaredType || g.type;
      if (t && t !== 'gray' && t !== 'dual' && t !== 'rainbow') {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      }
    }
    const maxSame = Math.max(0, ...Object.values(typeCounts));
    if (maxSame === 3) synergyBonus = 3;
    else if (maxSame === 4) synergyBonus = 5;
    else if (maxSame >= 5) synergyBonus = 10;
  }

  // --- Rainbow party bonus (+5 if ≥1 card of each of the 4 types) ---
  const presentTypes = new Set(
    guestCards
      .map((g) => g.declaredType || g.type)
      .filter((t) => THEME_TYPES.includes(t))
  );
  if (presentTypes.size === 4) rainbowBonus = 5;

  const score =
    basePoints +
    themeBonus +
    likePoints +
    dislikePoints +
    typeBoostPoints +
    synergyBonus +
    rainbowBonus;

  return {
    score: Math.max(0, score),
    breakdown: {
      basePoints,
      themeBonus,
      likePoints,
      dislikePoints,
      typeBoostPoints,
      synergyBonus,
      rainbowBonus,
    },
  };
}

/**
 * Determine whether likes/dislikes are swapped this round based on Hypnotist cards.
 *
 * Official rule: any Hypnotist in any player's party area activates the swap.
 * House rule (stackRule=true): odd number of Hypnotists activates, even cancels.
 *
 * @param {{ guestCards: { isHypnotist: boolean }[] }[]} allPlayerAreas
 * @param {boolean} stackRule - true = odd/even toggle (house rule); false = any presence
 * @returns {boolean}
 */
export function resolveHypnotist(allPlayerAreas, stackRule = false) {
  const total = allPlayerAreas.reduce((sum, area) => {
    return sum + area.guestCards.filter((g) => g.isHypnotist).length;
  }, 0);
  // ponytail: stackRule ceiling — O(n) scan, no change needed for the common case
  return stackRule ? total % 2 === 1 : total > 0;
}

/**
 * Determine the winner(s) at the end of the game.
 * The player(s) with the highest score wins.
 *
 * @param {{ name: string, totalScore: number }[]} players
 * @returns {string[]} list of winning player names
 */
export function checkWinner(players) {
  if (players.length === 0) return [];
  const max = Math.max(...players.map((p) => p.totalScore));
  return players.filter((p) => p.totalScore === max).map((p) => p.name);
}
