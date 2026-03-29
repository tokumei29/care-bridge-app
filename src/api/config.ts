/** 本番（Render）。`EXPO_PUBLIC_API_BASE_URL` が無いリリースビルドのフォールバック。 */
export const CARE_BRIDGE_API_PRODUCTION_ORIGIN = 'https://care-bridge-api.onrender.com';

/**
 * Rails API のオリジン（末尾スラッシュなし）。
 * - 優先: `EXPO_PUBLIC_API_BASE_URL`（`.env.local` / EAS Secrets など）
 * - リリースで未設定: 本番オリジン
 * - 開発（__DEV__）で未設定: http://localhost:3000
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, '');
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'http://localhost:3000';
  }
  return CARE_BRIDGE_API_PRODUCTION_ORIGIN;
}
