import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProviderId = 'apple' | 'google';

export async function startOAuthSignIn(
  provider: OAuthProviderId
): Promise<{ ok: true; session: Session } | { ok: false }> {
  const redirectTo = 'carebridgeapp://';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) {
    Alert.alert('ログインできません', error.message);
    return { ok: false };
  }
  if (!data?.url) {
    Alert.alert('ログインできません', '認証URLを取得できませんでした。');
    return { ok: false };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false };
  }
  if (result.type !== 'success' || !result.url) {
    Alert.alert('ログインできません', '認証を完了できませんでした。');
    return { ok: false };
  }

  let parsed: URL;
  try {
    parsed = new URL(result.url);
  } catch {
    Alert.alert('ログインできません', '認証結果のURLを解釈できませんでした。');
    return { ok: false };
  }

  const oauthErr =
    parsed.searchParams.get('error_description')?.trim() ||
    parsed.searchParams.get('error')?.trim() ||
    parsed.searchParams.get('error_code')?.trim();
  const hash = parsed.hash.replace(/^#/, '');
  const hashParams = new URLSearchParams(hash);
  const hashErr =
    hashParams.get('error_description')?.trim() ||
    hashParams.get('error')?.trim() ||
    hashParams.get('error_code')?.trim();
  if (oauthErr || hashErr) {
    Alert.alert('ログインできません', oauthErr ?? hashErr ?? '認証を完了できませんでした。');
    return { ok: false };
  }

  // iOS callback URL に `#error=...` が続くケースでは code に断片が混ざることがあるため除去する。
  const code = parsed.searchParams.get('code')?.split('#')[0];
  if (code) {
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError || !exchanged.session) {
      Alert.alert('ログインできません', exchangeError?.message ?? 'セッションを確立できませんでした。');
      return { ok: false };
    }
    return { ok: true, session: exchanged.session };
  }

  if (hash) {
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    if (access_token && refresh_token) {
      const { data: setData, error: setErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setErr || !setData.session) {
        Alert.alert('ログインできません', setErr?.message ?? 'セッションを確立できませんでした。');
        return { ok: false };
      }
      return { ok: true, session: setData.session };
    }
  }

  Alert.alert(
    'ログインできません',
    '認証結果に必要な情報がありません。'
  );
  return { ok: false };
}
