import { hash, verify } from '@node-rs/argon2';
import { z } from 'zod';

export const passwordSchema = z.string().min(10, 'Use at least 10 characters').max(200, 'Use at most 200 characters');

export const hashPassword = (pw: string) => hash(pw); // argon2id defaults

export async function verifyPassword(hashed: string, pw: string): Promise<boolean> {
  try { return await verify(hashed, pw); } catch { return false; }
}

// Used when the email is unknown so response time doesn't reveal which emails exist.
let dummy: Promise<string> | null = null;
export async function burnVerify(pw: string) {
  dummy ??= hash('dummy-password-for-timing');
  await verifyPassword(await dummy, pw);
}
