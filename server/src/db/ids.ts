import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32
let lastMs = 0;
let counter = 0;

function encode(n: number, len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out = ALPHABET[n % 32] + out;
    n = Math.floor(n / 32);
  }
  return out;
}

/** 26-char id: 10 chars ms timestamp + 6 chars per-ms counter + 10 random chars. Sorts by creation order. */
export function newId(): string {
  const ms = Date.now();
  if (ms === lastMs) counter++;
  else { lastMs = ms; counter = 0; }
  const rand = randomBytes(10);
  let r = '';
  for (const b of rand) r += ALPHABET[b % 32];
  return encode(ms, 10) + encode(counter, 6) + r;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}
