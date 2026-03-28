import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareRecipients } from '@/features/care-recipients';
import { supabase } from '@/lib/supabase';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { heroShineGradient } from '@/theme/gradients';

/** 設定・アカウント */
export default function SettingsTabScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;
  const { isSignedIn, isReady } = useCareRecipients();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = () => {
    Alert.alert('ログアウト', 'サインアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSigningOut(true);
            try {
              await supabase.auth.signOut();
            } finally {
              setSigningOut(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScreenBackdrop>
      <ContentRail layout={layout}>
        <View style={[styles.topPad, isTablet && styles.topPadTablet]}>
          <LinearGradient
            colors={[...heroShineGradient[themeKey].colors]}
            start={heroShineGradient[themeKey].start}
            end={heroShineGradient[themeKey].end}
            style={[styles.card, { borderColor: c.borderStrong }]}>
            <View style={[styles.iconWrap, { backgroundColor: c.accentMuted }]}>
              <SymbolView
                name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                tintColor={c.accent}
                size={isTablet ? 36 : 30}
              />
            </View>
            <Text style={[styles.title, { color: c.text, fontSize: isTablet ? 30 : 26 }]}>設定</Text>
            <Text
              style={[
                styles.body,
                { color: c.textSecondary, fontSize: isTablet ? 17 : 15, maxWidth: isTablet ? 560 : undefined },
              ]}>
              アカウント・通知・家族との共有などは、今後ここにまとめていきます。
            </Text>

            <View style={[styles.accountBlock, { borderColor: c.borderStrong }]}>
              <Text style={[styles.accountLabel, { color: c.text }]}>アカウント</Text>
              {!isReady ? (
                <ActivityIndicator color={c.accent} style={styles.accountSpinner} />
              ) : isSignedIn ? (
                <>
                  <Text style={[styles.accountStatus, { color: c.textSecondary }]}>
                    サインイン済み（メール／パスワード）
                  </Text>
                  <Pressable
                    onPress={onSignOut}
                    disabled={signingOut}
                    style={({ pressed }) => [
                      styles.signOutBtn,
                      { borderColor: c.danger, opacity: signingOut || pressed ? 0.75 : 1 },
                    ]}>
                    {signingOut ? (
                      <ActivityIndicator color={c.danger} />
                    ) : (
                      <Text style={[styles.signOutText, { color: c.danger }]}>ログアウト</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={[styles.accountStatus, { color: c.textSecondary }]}>
                    未サインインです。ホームのバナーからログインするか、下のボタンを使ってください。
                  </Text>
                  <View style={styles.authRow}>
                    <Pressable
                      onPress={() => router.push('/auth/login')}
                      style={({ pressed }) => [
                        styles.signInBtn,
                        { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 },
                      ]}>
                      <Text style={styles.signInBtnText}>ログイン</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/auth/sign-up')}
                      style={({ pressed }) => [
                        styles.signUpOutline,
                        { borderColor: c.accent, opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <Text style={[styles.signUpOutlineText, { color: c.accent }]}>新規登録</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </LinearGradient>
        </View>
      </ContentRail>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  topPad: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  topPadTablet: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 26,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  body: {
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 22,
  },
  accountBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 4,
  },
  accountLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  accountStatus: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: 14,
  },
  accountSpinner: {
    marginVertical: 12,
  },
  authRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signInBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  signUpOutline: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  signUpOutlineText: {
    fontSize: 15,
    fontWeight: '800',
  },
  signOutBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 140,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
