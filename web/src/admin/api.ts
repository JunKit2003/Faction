import type { MediaView } from '@faction/shared';

export interface Issue { path: string; message: string }

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: { issues?: Issue[]; usedIn?: string[] } = {}) {
    super(message);
  }
}

export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; issues?: Issue[]; usedIn?: string[] };
    if (res.status === 401 && url.startsWith('/api/admin')) window.dispatchEvent(new Event('faction:signed-out'));
    throw new ApiError(res.status, d.error ?? `Request failed (${res.status})`, d);
  }
  return data as T;
}

export interface Me { id: string; email: string; name: string }
export interface LibraryItem extends MediaView { originalName: string; createdAt: string; usedIn: string[] }
export interface AdminUser { id: string; email: string; name: string; createdAt: string; lastLoginAt: string | null; disabledAt: string | null }
export interface AuditItem {
  id: string; at: string; userId: string | null; userEmail: string; action: string;
  targetType: 'section' | 'media' | 'user'; targetKey: string; before: unknown; after: unknown; ip: string;
}
