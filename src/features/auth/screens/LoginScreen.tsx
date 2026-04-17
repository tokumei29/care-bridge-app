import { Link, useRouter, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareRecipients } from '@/features/care-recipients';
import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import { supabase } from '@/lib/supabase';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

export function LoginScreen() {
  const router = useRouter();
  const { hydrateAuthSession, isReady, isSignedIn } = useCareRecipients();

  useEffect(() => {
    if (!isReady || !isSignedIn) return;
    router.replace('/' as Href);
  }, [isReady, isSignedIn, router]);
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useExplicitStackBackHeader({ fallback: '/' as Href, tintColor: c.accent });
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<'apple' | null>(null);

  const onSubmit = async () => {
    const e = email.trim();
    if (!e) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return;
    }
    if (!password) {
      Alert.alert('入力エラー', 'パスワードを入力してください。');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: e, password });
      if (error) {
        Alert.alert('ログインできません', error.message);
        return;
      }
      if (data.session) {
        hydrateAuthSession(data.session);
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  };

  const onOAuthPress = async (provider: 'apple') => {
    setOauthBusy(provider);
    try {
      const { signInWithAppleNative } = await import('@/features/auth/signInWithApple');
      const result = await signInWithAppleNative();
      if (result.ok) {
        hydrateAuthSession(result.session);
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
        router.replace('/');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('ログインできません', `Apple認証の呼び出しで失敗しました。\n\n${message}`);
    } finally {
      setOauthBusy(null);
    }
  };

  const authLocked = submitting || oauthBusy !== null;

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24, paddingTop: 12 }]}>
            <ContentRail layout={layout}>
              <Text style={[styles.lead, { color: c.textSecondary }]}>
                メインのサインイン方法です。Apple ID で続けてください。
              </Text>

              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => void onOAuthPress('apple')}
                  disabled={authLocked}
                  style={({ pressed }) => [
                    styles.ssoAppleBtn,
                    {
                      backgroundColor: scheme === 'dark' ? '#ffffff' : '#000000',
                      opacity: authLocked ? 0.5 : pressed ? 0.92 : 1,
                    },
                  ]}>
                  {oauthBusy === 'apple' ? (
                    <ActivityIndicator color={scheme === 'dark' ? '#000000' : '#ffffff'} />
                  ) : (
                    <Text
                      style={[
                        styles.ssoAppleBtnText,
                        { color: scheme === 'dark' ? '#000000' : '#ffffff' },
                      ]}>
                      Apple で続ける
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {/* Google SSO: Google Play 公開・Android 向けに再有効化する際は下をコメント解除。onOAuthPress / oauthBusy の型に google を戻す（styles.ssoGoogleBtn 参照） */}
              {/*
              <Pressable
                onPress={() => void onOAuthPress('google')}
                disabled={authLocked}
                style={({ pressed }) => [
                  styles.ssoGoogleBtn,
                  {
                    borderColor: c.borderStrong,
                    backgroundColor: c.surfaceSolid,
                    opacity: authLocked ? 0.5 : pressed ? 0.92 : 1,
                    marginTop: Platform.OS === 'ios' ? 12 : 0,
                  },
                ]}>
                {oauthBusy === 'google' ? (
                  <ActivityIndicator color={c.accent} />
                ) : (
                  <Text style={[styles.ssoGoogleBtnText, { color: c.text }]}>Google で続ける</Text>
                )}
              </Pressable>
              */}

              <View style={styles.altBlock}>
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: c.borderStrong }]} />
                  <Text style={[styles.altHeading, { color: c.textSecondary }]}>
                    またはメールアドレスで認証
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: c.borderStrong }]} />
                </View>

                <Text style={[styles.label, { color: c.text }]}>メールアドレス</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={c.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!authLocked}
                  style={[
                    styles.input,
                    { color: c.text, borderColor: c.borderStrong, backgroundColor: c.surfaceSolid },
                  ]}
                />

                <Text style={[styles.label, { color: c.text }]}>パスワード</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="パスワード"
                  placeholderTextColor={c.textSecondary}
                  secureTextEntry
                  multiline={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="password"
                  autoComplete="password"
                  editable={!authLocked}
                  style={[
                    styles.input,
                    { color: c.text, borderColor: c.borderStrong, backgroundColor: c.surfaceSolid },
                  ]}
                />

                <Pressable
                  onPress={() => void onSubmit()}
                  disabled={authLocked}
                  style={({ pressed }) => [
                    styles.outlineBtn,
                    {
                      borderColor: c.accent,
                      opacity: authLocked ? 0.5 : pressed ? 0.9 : 1,
                    },
                  ]}>
                  {submitting ? (
                    <ActivityIndicator color={c.accent} />
                  ) : (
                    <Text style={[styles.outlineBtnText, { color: c.accent }]}>ログイン</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: c.textSecondary }]}>アカウントをお持ちでない方</Text>
                <Link href="/auth/sign-up" asChild>
                  <Pressable>
                    <Text style={[styles.link, { color: c.accent }]}>新規登録</Text>
                  </Pressable>
                </Link>
              </View>
            </ContentRail>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  lead: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: 20,
  },
  ssoAppleBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ssoAppleBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  ssoGoogleBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ssoGoogleBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  altBlock: {
    marginTop: 28,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  altHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  outlineBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  link: {
    fontSize: 15,
    fontWeight: '800',
  },
});
