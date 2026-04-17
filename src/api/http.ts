import { getApiBaseUrl } from '@/api/config';
import { ApiError } from '@/api/errors';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken: string;
};

function joinUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function parseErrorMessage(status: number, json: unknown): string {
  if (json && typeof json === 'object' && 'errors' in json) {
    const err = (json as { errors: unknown }).errors;
    if (Array.isArray(err) && err.every((x) => typeof x === 'string')) {
      return err.join('\n');
    }
  }
  if (json && typeof json === 'object' && 'error' in json) {
    const err = (json as { error: unknown }).error;
    if (typeof err === 'string' && err.trim().length > 0) {
      return err.trim();
    }
  }
  return `リクエストに失敗しました (${status})`;
}

/** JSON API。`Authorization: Bearer <Supabase session access_token>` を付与。 */
export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, accessToken } = options;
  const url = joinUrl(path);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  const init: RequestInit = { method, headers };

  if (body !== undefined && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    throw new ApiError(parseErrorMessage(res.status, json), res.status, json);
  }

  return json as T;
}
