// Cloudflare Worker acting as BGG proxy
export const BGG_WORKER_URL = 'https://bgg-proxy.williamsv1697.workers.dev';

// ponytail: only the username is stored locally — no password, no PIN, no session token
const BGG_USERNAME_KEY = 'bgg_username';
export const getStoredUsername = () => localStorage.getItem(BGG_USERNAME_KEY) || '';
export const setStoredUsername = (u) => localStorage.setItem(BGG_USERNAME_KEY, u);
export const clearStoredUsername = () => localStorage.removeItem(BGG_USERNAME_KEY);
