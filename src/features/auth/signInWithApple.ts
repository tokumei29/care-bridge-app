import type { Session } from '@supabase/supabase-js';
import { Alert, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

function showAppleAuthError(stageCode: string, message: string, detail?: string): void {
  const suffix = detail?.trim() ? `\n\n詳細: ${detail.trim()}` : '';
  Alert.alert('ログインできません', `[${stageCode}] ${message}${suffix}`);
}

function formatUnknownError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function isAppleUserCancelled(e: unknown): boolean {
  if (e == null || typeof e !== 'object') return false;
  const code = 'code' in e && typeof (e as { code: unknown }).code === 'string' ? (e as { code: string }).code : '';
  return code === 'ERR_CANCELED' || code === 'ERR_REQUEST_CANCELED';
}

function createRawNonce(): string {
  // ネイティブ RNG 依存を避けるため、JSのみで十分な長さの nonce を生成する。
  const p1 = Math.random().toString(36).slice(2, 12);
  const p2 = Math.random().toString(36).slice(2, 12);
  return `${Date.now().toString(36)}-${p1}-${p2}`;
}

/**
 * rawNonce: 生の nonce 文字列
 * Apple: SHA256(rawNonce) を nonce に渡す
 * Supabase signInWithIdToken: nonce に rawNonce を渡す
 */
export async function signInWithAppleNative(): Promise<{ ok: true; session: Session } | { ok: false }> {
  if (Platform.OS !== 'ios') {
    showAppleAuthError('APPLE_PLATFORM', 'Sign in with Apple は iOS でのみ利用できます。');
    return { ok: false };
  }

  let AppleAuthentication: typeof import('expo-apple-authentication');
  try {
    AppleAuthentication = await import('expo-apple-authentication');
  } catch (e: unknown) {
    showAppleAuthError('APPLE_MODULE', 'Sign in with Apple を読み込めませんでした。', formatUnknownError(e));
    return { ok: false };
  }

  let expoCrypto: typeof import('expo-crypto');
  try {
    expoCrypto = await import('expo-crypto');
  } catch (e: unknown) {
    showAppleAuthError('CRYPTO_MODULE', 'expo-crypto を読み込めませんでした。', formatUnknownError(e));
    return { ok: false };
  }

  const rawNonce = createRawNonce();
  const hashedNonce = await expoCrypto.digestStringAsync(
    expoCrypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const identityToken = credential.identityToken;
    if (!identityToken) {
      showAppleAuthError('APPLE_NO_TOKEN', 'Apple から ID トークンを取得できませんでした。');
      return { ok: false };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      showAppleAuthError('APPLE_SUPABASE', 'サインインに失敗しました。', error?.message);
      return { ok: false };
    }

    return { ok: true, session: data.session };
  } catch (e: unknown) {
    if (isAppleUserCancelled(e)) {
      return { ok: false };
    }
    showAppleAuthError('APPLE_NATIVE', 'Sign in with Apple を完了できませんでした。', formatUnknownError(e));
    return { ok: false };
  }
}
