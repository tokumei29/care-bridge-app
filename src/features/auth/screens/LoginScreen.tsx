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
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
                メールアドレスとパスワードでサインインします。テスト用の簡易認証です（のちほど SSO などに差し替え可能）。
              </Text>

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
                editable={!submitting}
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
                editable={!submitting}
                style={[
                  styles.input,
                  { color: c.text, borderColor: c.borderStrong, backgroundColor: c.surfaceSolid },
                ]}
              />

              <Pressable
                onPress={() => void onSubmit()}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  {
                    backgroundColor: c.accent,
                    opacity: submitting ? 0.5 : pressed ? 0.9 : 1,
                  },
                ]}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>ログイン</Text>
                )}
              </Pressable>

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
    marginBottom: 22,
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
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
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
