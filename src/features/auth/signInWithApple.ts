import type { Session } from '@supabase/supabase-js';
import 'react-native-get-random-values';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Platform } from 'react-native';
import * as uuid from 'uuid';

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

/**
 * rawNonce: 生の UUID 文字列（uuid v4）
 * Apple: rawNonce をそのまま nonce に渡す
 * Supabase signInWithIdToken: nonce に rawNonce を渡す
 */
export async function signInWithAppleNative(): Promise<{ ok: true; session: Session } | { ok: false }> {
  if (Platform.OS !== 'ios') {
    showAppleAuthError('APPLE_PLATFORM', 'Sign in with Apple は iOS でのみ利用できます。');
    return { ok: false };
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    showAppleAuthError('APPLE_UNAVAILABLE', 'この端末では Sign in with Apple を利用できません。');
    return { ok: false };
  }

  const rawNonce = uuid.v4().toString();

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: rawNonce,
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
