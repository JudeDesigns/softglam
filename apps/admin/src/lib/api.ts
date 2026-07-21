/**
 * Central API client. Reads the base URL from env or falls back to /api
 * (proxied by Vite to localhost:8000 in dev).
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

let accessToken: string | null = sessionStorage.getItem('sg_access_token');

export function setToken(token: string) {
  accessToken = token;
  sessionStorage.setItem('sg_access_token', token);
}

export function clearToken() {
  accessToken = null;
  sessionStorage.removeItem('sg_access_token');
  sessionStorage.removeItem('sg_refresh_token');
}

export function setRefreshToken(token: string) {
  sessionStorage.setItem('sg_refresh_token', token);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem('sg_refresh_token');
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) { clearToken(); return null; }
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token;
  } catch {
    clearToken();
    return null;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* noop */ }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });
