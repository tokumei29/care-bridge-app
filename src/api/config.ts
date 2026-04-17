import * as Device from 'expo-device';

/** 本番（Render）。`EXPO_PUBLIC_API_BASE_URL` が無いリリースビルドのフォールバック。 */
export const CARE_BRIDGE_API_PRODUCTION_ORIGIN = 'https://care-bridge-api.onrender.com';

let warnedLocalhostOnDevice = false;

function warnLocalhostOnPhysicalDevice(url: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (warnedLocalhostOnDevice) return;
  if (!Device.isDevice) return;
  if (!/localhost|127\.0\.0\.1/.test(url)) return;

  warnedLocalhostOnDevice = true;
  // eslint-disable-next-line no-console -- 開発時の実機向けトラブルシュート
  console.warn(
    [
      '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '[Care Bridge] 実機で API が localhost になっています（この端末からは PC に届きません）。',
      '1) Mac のターミナルで IP を確認: ipconfig getifaddr en0 など',
      '2) プロジェクト直下の .env.local に例の一行を書く:',
      '   EXPO_PUBLIC_API_BASE_URL=http://あなたのLANのIP:3000',
      '3) Rails を全インターフェースで起動: bin/rails s -b 0.0.0.0',
      '4) npx expo start を止めてから再度起動（環境変数の再読込）',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
    ].join('\n')
  );
}

/**
 * Rails API のオリジン（末尾スラッシュなし）。
 * - 優先: `EXPO_PUBLIC_API_BASE_URL`（`.env.local` / EAS Secrets など）
 * - リリースで未設定: 本番オリジン
 * - 開発（__DEV__）で未設定: http://localhost:3000
 */
export function getApiBaseUrl(): string {
  const isRelease = typeof __DEV__ !== 'undefined' && !__DEV__;
  if (isRelease) {
    return CARE_BRIDGE_API_PRODUCTION_ORIGIN;
  }

  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  let url: string;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    url = raw.trim().replace(/\/$/, '');
  } else {
    url = 'http://localhost:3000';
  }
  warnLocalhostOnPhysicalDevice(url);
  return url;
}
