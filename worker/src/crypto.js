// Password hashing, session-secret generation and constant-time comparison.
// Pure helpers: no request, env or mutable state.
export const encoder = new TextEncoder();

export function secureRandomHex(byteCount = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function randomId() {
  return crypto.randomUUID();
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function equalSecret(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function decodeBase64(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

export function encodeBase64(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}

export async function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2-sha256$${iterations}$${encodeBase64(salt)}$${encodeBase64(bits)}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (iterations !== 100000) return false;
  const salt = decodeBase64(parts[2]);
  const expected = decodeBase64(parts[3]);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.length * 8));
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

export function parseDeviceName(userAgent) {
  const agent = String(userAgent || '');
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Unknown browser';
  const platform = /Windows/.test(agent) ? 'Windows' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Mac OS/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : 'Unknown device';
  return `${browser} on ${platform}`;
}

// Invitation tokens. Was called by /api/auth/invite but never defined, which made
// that route throw a ReferenceError and return 500.
export function generateToken(byteCount = 32) {
  return secureRandomHex(byteCount);
}
