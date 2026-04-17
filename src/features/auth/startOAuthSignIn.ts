import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProviderId = 'apple' | 'google';

function showOAuthError(stageCode: string, message: string, detail?: string): void {
  const suffix = detail?.trim() ? `\n\n詳細: ${detail.trim()}` : '';
  Alert.alert('ログインできません', `[${stageCode}] ${message}${suffix}`);
}

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
    showOAuthError('AUTH_START', 'SSOを開始できませんでした。', error.message);
    return { ok: false };
  }
  if (!data?.url) {
    showOAuthError('AUTH_URL', '認証URLを取得できませんでした。');
    return { ok: false };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false };
  }
  if (result.type !== 'success' || !result.url) {
    showOAuthError(
      'AUTH_CALLBACK',
      '認証の戻り先を受け取れませんでした。Supabase の Redirect URL と iOS の URL Scheme 設定を確認してください。',
      `result.type=${result.type}`
    );
    return { ok: false };
  }

  let parsed: URL;
  try {
    parsed = new URL(result.url);
  } catch {
    showOAuthError('AUTH_PARSE', '認証結果のURLを解釈できませんでした。');
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
    showOAuthError(
      'AUTH_PROVIDER',
      'プロバイダ側で認証を完了できませんでした。Apple/Supabase の OAuth 設定を確認してください。',
      oauthErr ?? hashErr ?? undefined
    );
    return { ok: false };
  }

  // iOS callback URL に `#error=...` が続くケースでは code に断片が混ざることがあるため除去する。
  const code = parsed.searchParams.get('code')?.split('#')[0];
  if (code) {
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError || !exchanged.session) {
      showOAuthError('AUTH_EXCHANGE', 'セッション交換に失敗しました。', exchangeError?.message);
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
        showOAuthError('AUTH_SET_SESSION', 'セッションを確立できませんでした。', setErr?.message);
        return { ok: false };
      }
      return { ok: true, session: setData.session };
    }
  }

  showOAuthError(
    'AUTH_RESULT_EMPTY',
    '認証結果に必要な情報がありません。Redirect URL が一致しているか確認してください。',
    `url=${parsed.origin}${parsed.pathname}`
  );
  return { ok: false };
}
