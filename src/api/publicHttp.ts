import { getApiBaseUrl } from '@/api/config';
import { ApiError } from '@/api/errors';
import { parseErrorMessage } from '@/api/http';

type PublicRequestOptions = {
  method?: 'POST';
  body: unknown;
};

function joinUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** 認証ヘッダーなしの JSON POST（公開お問い合わせなど）。 */
export async function publicJsonRequest<T>(path: string, options: PublicRequestOptions): Promise<T> {
  const url = joinUrl(path);
  const init: RequestInit = {
    method: options.method ?? 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options.body),
  };

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
