/**
 * Shared BGG player profile helpers.
 * Profiles are stored in localStorage as { name, bggUsername }[].
 */
const LS_PLAYERS = 'bgg_player_profiles';

function _load() {
  try { return JSON.parse(localStorage.getItem(LS_PLAYERS) || '[]'); } catch { return []; }
}

/** @returns {{ name: string, bggUsername: string }[]} */
export function getPlayerProfiles() {
  return _load();
}

/**
 * Save or update a name → bggUsername mapping.
 * Existing entries with the same name are replaced; list capped at 30.
 */
export function savePlayerProfile(name, bggUsername) {
  if (!name?.trim()) return;
  const list = _load().filter((p) => p.name !== name.trim());
  localStorage.setItem(
    LS_PLAYERS,
    JSON.stringify([{ name: name.trim(), bggUsername: (bggUsername || '').trim() }, ...list].slice(0, 30))
  );
}

/**
 * Case-insensitive lookup of a BGG username by display name.
 * @returns {string | null}
 */
export function findBggUsername(name) {
  if (!name?.trim()) return null;
  const lower = name.trim().toLowerCase();
  const match = _load().find((p) => p.name.toLowerCase() === lower);
  return match?.bggUsername || null;
}
