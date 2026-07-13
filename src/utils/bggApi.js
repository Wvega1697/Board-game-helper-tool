import { BGG_WORKER_URL } from './bggConfig.js';

/**
 * Authenticate with BGG via CF Worker → n8n → BGG login API.
 * The worker hashes the PIN before forwarding; raw PIN never leaves HTTPS.
 * @returns {Promise<{success: boolean}>}
 * @throws on network error or invalid credentials
 */
export async function bggLogin(username, password, pin) {
  const res = await fetch(`${BGG_WORKER_URL}/bgg/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, pin }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text) throw new Error('Empty response from server');
  const data = JSON.parse(text);
  if (!data.success) throw new Error(data.error || 'Login failed');
  return data;
}

/**
 * Log a play to BGG via CF Worker → n8n → geekplay.php.
 * The worker hashes the PIN; n8n verifies against stored hash and looks up the session.
 * @param {string} username - BGG username (stored in localStorage)
 * @param {string} pin - User's PIN (hashed by worker before forwarding)
 * @param {object} playData
 * @param {number} playData.bggId
 * @param {string} playData.playDate - 'YYYY-MM-DD'
 * @param {string} [playData.location]
 * @param {string|number} [playData.quantity]
 * @param {string|number} [playData.length] - minutes
 * @param {boolean} [playData.incomplete]
 * @param {boolean} [playData.nowinstats]
 * @param {string} [playData.comments]
 * @param {Array<{name:string, username?:string, color?:string, score:number, win:boolean, new?:boolean}>} playData.players
 * @returns {Promise<{success:boolean}>}
 */
export async function bggLogPlay(username, pin, playData) {
  const res = await fetch(`${BGG_WORKER_URL}/bgg/log-play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pin, ...playData }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text) throw new Error('Empty response from server');
  const data = JSON.parse(text);
  if (!data.success) throw new Error(data.error || 'Log play failed');
  return data;
}

/**
 * Search games from the Supabase bgg_catalog via CF Worker → n8n.
 * @param {string} query
 * @returns {Promise<Array<{bgg_id:number, name:string, year_published:number}>>}
 */
export async function searchGames(query) {
  const res = await fetch(
    `${BGG_WORKER_URL}/bgg/search-games?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  // ponytail: normalize n8n shape {id, title} → canonical {bgg_id, name, year_published}
  return (Array.isArray(data) ? data : []).map((g) => ({
    bgg_id: g.bgg_id ?? g.id,
    name: g.name ?? g.title,
    year_published: g.year_published ?? null,
  }));
}
