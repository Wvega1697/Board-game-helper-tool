/**
 * Encrypted BGG credential storage using Web Crypto API (AES-GCM + PBKDF2).
 * The user's PIN is used to derive the key — it is never stored.
 */

const STORAGE_KEY = 'bgg_creds_enc';
const SALT_KEY = 'bgg_creds_salt';

// Derive an AES-GCM key from a PIN using PBKDF2
async function deriveKey(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Store BGG credentials encrypted with the user's PIN. */
export async function encryptCredentials(username, password, pin) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const payload = JSON.stringify({ username, password });
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(payload)
  );

  // Store salt, iv, ciphertext as Base64
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    salt: toB64(salt),
    iv: toB64(iv),
    data: toB64(encrypted),
  }));
}

/** Decrypt and return { username, password }, or null on failure. */
export async function decryptCredentials(pin) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const { salt, iv, data } = JSON.parse(stored);
    const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

    const key = await deriveKey(pin, fromB64(salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(iv) },
      key,
      fromB64(data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null; // Wrong PIN or corrupted data
  }
}

/** Returns true if encrypted credentials exist in localStorage. */
export function hasStoredCredentials() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

/** Remove stored credentials. */
export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
}
