/**
 * Guest session: flag + journal entries persisted in cookies (chunked; large payloads split across keys).
 * Browser limits ~4KB per cookie; we shard the URI-encoded JSON across echo_ge_0, echo_ge_1, …
 */

const FLAG = 'echo_guest_mode';
const CHUNK_PREFIX = 'echo_ge_';
const MAX_AGE_SEC = 365 * 24 * 60 * 60;
const MAX_CHUNK = 3200;
const MAX_ENTRIES = 120;

function getCookieRaw(name) {
  if (typeof document === 'undefined') return '';
  const prefixed = `; ${document.cookie}`;
  const key = `; ${name}=`;
  const i = prefixed.indexOf(key);
  if (i === -1) return '';
  const start = i + key.length;
  const end = prefixed.indexOf(';', start);
  const v = end === -1 ? prefixed.slice(start) : prefixed.slice(start, end);
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function setCookieRaw(name, value, maxAgeSec) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function deleteCookieRaw(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function isGuestMode() {
  return getCookieRaw(FLAG) === '1';
}

export function setGuestModeEnabled(enabled) {
  if (enabled) {
    setCookieRaw(FLAG, '1', MAX_AGE_SEC);
  } else {
    deleteCookieRaw(FLAG);
    clearGuestEntryCookies();
  }
}

function clearGuestEntryCookies() {
  const n = parseInt(getCookieRaw(`${CHUNK_PREFIX}n`) || '0', 10);
  for (let i = 0; i < n; i++) {
    deleteCookieRaw(`${CHUNK_PREFIX}${i}`);
  }
  deleteCookieRaw(`${CHUNK_PREFIX}n`);
}

/** Remove guest flag and all stored guest entries. */
export function clearGuestStorage() {
  deleteCookieRaw(FLAG);
  clearGuestEntryCookies();
}

export function readGuestEntries() {
  const n = parseInt(getCookieRaw(`${CHUNK_PREFIX}n`) || '0', 10);
  if (!n || Number.isNaN(n)) return [];
  let raw = '';
  for (let i = 0; i < n; i++) {
    raw += getCookieRaw(`${CHUNK_PREFIX}${i}`);
  }
  try {
    const json = decodeURIComponent(raw);
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeGuestEntries(entries) {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  const encoded = encodeURIComponent(JSON.stringify(trimmed));
  const chunks = [];
  for (let i = 0; i < encoded.length; i += MAX_CHUNK) {
    chunks.push(encoded.slice(i, i + MAX_CHUNK));
  }
  const oldN = parseInt(getCookieRaw(`${CHUNK_PREFIX}n`) || '0', 10);
  for (let i = chunks.length; i < oldN; i++) {
    deleteCookieRaw(`${CHUNK_PREFIX}${i}`);
  }
  setCookieRaw(`${CHUNK_PREFIX}n`, String(chunks.length), MAX_AGE_SEC);
  for (let i = 0; i < chunks.length; i++) {
    setCookieRaw(`${CHUNK_PREFIX}${i}`, chunks[i], MAX_AGE_SEC);
  }
}

export function appendGuestEntry(entry) {
  const prev = readGuestEntries();
  writeGuestEntries([entry, ...prev]);
  return entry;
}

export function deleteGuestEntry(id) {
  writeGuestEntries(readGuestEntries().filter((e) => e.id !== id));
}
