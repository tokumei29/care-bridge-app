/**
 * Rails API のオリジン（末尾スラッシュなし）。
 * `.env.local` に `EXPO_PUBLIC_API_BASE_URL` を設定（未設定時は http://localhost:3000）。
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}
