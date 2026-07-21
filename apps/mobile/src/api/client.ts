import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Lightweight fetch wrapper. Reads the JWT from SecureStore, attaches it as a
 * Bearer token, parses JSON, and surfaces typed errors. Keep it small — domain
 * modules build typed call-sites on top of `request<T>()`.
 */

const ACCESS_KEY = 'softglow.access';
const REFRESH_KEY = 'softglow.refresh';

function resolveBaseUrl(): string {
  const fromExtra =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.apiBaseUrl;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;

  // In Expo Go the debugger host tells us the Mac's LAN IP — use that so the
  // phone can reach the API instead of hitting its own localhost.
  const debuggerHost = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (typeof debuggerHost === 'string') {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost') return `http://${ip}:8000/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function _fetch(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
}

async function _refresh(): Promise<boolean> {
  const refresh = await getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    await clearTokens();
    return false;
  }
  const tokens = (await res.json()) as { access_token: string; refresh_token: string };
  await setTokens(tokens.access_token, tokens.refresh_token);
  return true;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await _fetch(path, opts);
  if (res.status === 401 && opts.auth !== false && (await _refresh())) {
    res = await _fetch(path, opts);
  }
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text().catch(() => undefined);
    }
    const message =
      (detail && typeof detail === 'object' && 'detail' in detail
        ? String((detail as { detail: unknown }).detail)
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
