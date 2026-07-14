/**
 * Lightweight typed API client for the Hello Sara backend.
 * Bearer token pulled from secure storage; every /api call is prefixed here.
 */
import { storage } from '@/src/utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
export const TOKEN_KEY = 'hs.auth.token';

export interface ApiError {
  status: number;
  detail: string;
}

async function readToken(): Promise<string | null> {
  return await storage.secureGet<string>(TOKEN_KEY, '' as string);
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await readToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const detail = (data && typeof data === 'object' && 'detail' in data) ? (data as any).detail : res.statusText;
    const err: ApiError = { status: res.status, detail: String(detail || 'Request failed') };
    throw err;
  }
  return data as T;
}

export const AuthApi = {
  register: (email: string, password: string, name: string) =>
    api<{ token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    api<{ token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  googleSession: (session_token: string) =>
    api<{ token: string; token_type: string; user: any }>('/auth/google/session', {
      method: 'POST',
      body: JSON.stringify({ session_token }),
    }),
  me: () => api<any>('/auth/me'),
  logout: () => api<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

export const ProfileApi = {
  update: (payload: Record<string, unknown>) =>
    api<any>('/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const SettingsApi = {
  get: () => api<any>('/settings'),
  update: (payload: Record<string, unknown>) =>
    api<any>('/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const MemoriesApi = {
  list: (q?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api<any[]>(`/memories${qs}`);
  },
  create: (payload: { title: string; content: string; tags: string[] }) =>
    api<any>('/memories', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id: string) => api<any>(`/memories/${id}`, { method: 'DELETE' }),
};

export const HistoryApi = {
  list: (q?: string) => api<any[]>(`/history${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  clear: () => api<any>('/history', { method: 'DELETE' }),
};

export const NotesApi = {
  list: (q?: string) => api<any[]>(`/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (payload: { title: string; content: string; tags: string[]; color?: string; pinned?: boolean }) =>
    api<any>('/notes', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    api<any>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: string) => api<any>(`/notes/${id}`, { method: 'DELETE' }),
};

export const RemindersApi = {
  list: () => api<any[]>('/reminders'),
  create: (payload: { title: string; notes?: string; remind_at: string }) =>
    api<any>('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id: string) => api<any>(`/reminders/${id}`, { method: 'DELETE' }),
};

export const ChatApi = {
  send: (messages: { role: string; content: string }[], save_history = true) =>
    api<{ reply: string; provider: string; model: string; history_id?: string }>(
      '/chat', { method: 'POST', body: JSON.stringify({ messages, save_history }) },
    ),
};

export const BriefingApi = {
  get: () => api<any>('/briefing'),
};

export const DeviceApi = {
  listCommands: () => api<any[]>('/device/commands'),
  logCommand: (payload: { action: string; payload?: object; status?: string }) =>
    api<any>('/device/commands', { method: 'POST', body: JSON.stringify(payload) }),
  listComms: () => api<any[]>('/device/comms'),
  logComm: (payload: any) =>
    api<any>('/device/comms', { method: 'POST', body: JSON.stringify(payload) }),
};

export const AutomationsApi = {
  list: () => api<any[]>('/automations'),
  create: (payload: any) => api<any>('/automations', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => api<any>(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  run: (id: string) => api<any>(`/automations/${id}/run`, { method: 'POST' }),
  remove: (id: string) => api<any>(`/automations/${id}`, { method: 'DELETE' }),
  recordUsage: (kind: string, key: string) =>
    api<any>('/usage', { method: 'POST', body: JSON.stringify({ kind, key }) }),
  topUsage: (kind?: string, limit = 5) => {
    const params = new URLSearchParams();
    if (kind) params.set('kind', kind);
    params.set('limit', String(limit));
    return api<any[]>(`/usage/top?${params.toString()}`);
  },
  backup: () => api<any>('/backup'),
};

export const OcrApi = {
  run: (image_base64: string) => api<any>('/ocr', { method: 'POST', body: JSON.stringify({ image_base64 }) }),
};

export const MetaApi = {
  providers: () => api<any[]>('/ai/providers'),
  health: () => api<any>('/health'),
};
