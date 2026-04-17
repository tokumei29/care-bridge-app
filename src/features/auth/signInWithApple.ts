import type { Session } from '@supabase/supabase-js';
import { Alert, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

function createRawNonce(): string {
  const p1 = Math.random().toString(36).slice(2, 12);
  const p2 = Math.random().toString(36).slice(2, 12);
  return `${Date.now().toString(36)}-${p1}-${p2}`;
}

export async function signInWithAppleNative(): Promise<{ ok: true; session: Session } | { ok: false }> {
  if (Platform.OS !== 'ios') {
    Alert.alert('ログインできません', 'Sign in with Apple は iOS でのみ利用できます。');
    return { ok: false };
  }

  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    const expoCrypto = await import('expo-crypto');
    const rawNonce = createRawNonce();
    const hashedNonce = await expoCrypto.digestStringAsync(
      expoCrypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const identityToken = credential.identityToken;
    if (!identityToken) {
      Alert.alert('ログインできません', 'Apple から ID トークンを取得できませんでした。');
      return { ok: false };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
      nonce: rawNonce,
    });

    if (error || !data.session) {
      Alert.alert('ログインできません', error?.message ?? 'サインインに失敗しました。');
      return { ok: false };
    }

    return { ok: true, session: data.session };
  } catch (e: unknown) {
    if (
      e != null &&
      typeof e === 'object' &&
      'code' in e &&
      ((e as { code?: string }).code === 'ERR_CANCELED' ||
        (e as { code?: string }).code === 'ERR_REQUEST_CANCELED')
    ) {
      return { ok: false };
    }
    const message = e instanceof Error ? e.message : String(e);
    Alert.alert('ログインできません', `Sign in with Apple を実行できませんでした。\n\n${message}`);
    return { ok: false };
  }
}
