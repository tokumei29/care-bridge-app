import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCareRecipients } from '@/features/care-recipients';
import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import { supabase } from '@/lib/supabase';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { heroShineGradient } from '@/theme/gradients';

/** 設定・アカウント */
const HOME_TAB_HREF = '/' as Href;

/** 設定タブのネイティブヘッダー左に「‹ 戻る」（ホームタブへ） */
export default function SettingsTabScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;
  const { isSignedIn, isReady, deleteMyAccountAndSignOut } = useCareRecipients();

  useExplicitStackBackHeader({
    fallback: HOME_TAB_HREF,
    tintColor: Colors[scheme === 'dark' ? 'dark' : 'light'].tint,
  });
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const ACCOUNT_DELETE_INTRO =
    '削除すると元に戻せません。\n\n' +
    '・このアカウントに紐づく、登録されている被介護者（利用者）\n' +
    '・各利用者の介護記録（食事・排泄・バイタル・入浴・睡眠・リハビリ・画像メモ・その他メモなど）\n\n' +
    'は、サーバー側のデータベースでカスケード削除（関連テーブルごとまとめて削除）される想定です。顔写真などストレージの画像も、運用設定に応じて削除されます。\n\n' +
    'バックエンドで「アカウント削除」APIが有効な場合は、ログイン用の認証情報も含めて完全に削除されます。APIが未実装の場合は、利用者をすべて削除したうえでログアウトします（認証の完全削除はサーバー設定が必要な場合があります）。\n\n' +
    '続ける場合は「内容を確認して続ける」を選んでください。';

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

  const runDeleteAccount = () => {
    void (async () => {
      setDeletingAccount(true);
      try {
        const result = await deleteMyAccountAndSignOut();
        if (result.ok) {
          Alert.alert(
            '削除しました',
            'アカウントに紐づくデータの削除処理を行い、ログアウトしました。'
          );
        } else {
          Alert.alert('削除できませんでした', result.reason);
        }
      } finally {
        setDeletingAccount(false);
      }
    })();
  };

  const onDeleteAccount = () => {
    Alert.alert('アカウントを削除', ACCOUNT_DELETE_INTRO, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '内容を確認して続ける',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            '最終確認',
            '本当にアカウントと関連データをすべて削除しますか？この操作は取り消せません。',
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '削除する', style: 'destructive', onPress: runDeleteAccount },
            ]
          );
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

            <View style={[styles.legalBlock, { borderColor: c.borderStrong }]}>
              <Text style={[styles.accountLabel, { color: c.text }]}>法令・ポリシー</Text>
              <Text style={[styles.legalSub, { color: c.textSecondary }]}>
                プライバシーポリシー、利用規約、特定商取引法に基づく表記を表示します。
              </Text>
              <Pressable
                onPress={() => router.push('/settings/privacy')}
                style={({ pressed }) => [styles.legalRow, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={[styles.legalRowLabel, { color: c.accent }]}>プライバシーポリシー</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor={c.textSecondary}
                  size={18}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings/terms')}
                style={({ pressed }) => [styles.legalRow, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={[styles.legalRowLabel, { color: c.accent }]}>利用規約</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor={c.textSecondary}
                  size={18}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings/commerce')}
                style={({ pressed }) => [styles.legalRow, { opacity: pressed ? 0.75 : 1 }]}>
                <Text style={[styles.legalRowLabel, { color: c.accent }]}>特定商取引法に基づく表記</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor={c.textSecondary}
                  size={18}
                />
              </Pressable>
            </View>

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
                    disabled={signingOut || deletingAccount}
                    style={({ pressed }) => [
                      styles.signOutBtn,
                      {
                        borderColor: c.danger,
                        opacity: signingOut || deletingAccount || pressed ? 0.75 : 1,
                      },
                    ]}>
                    {signingOut ? (
                      <ActivityIndicator color={c.danger} />
                    ) : (
                      <Text style={[styles.signOutText, { color: c.danger }]}>ログアウト</Text>
                    )}
                  </Pressable>
                  <Text style={[styles.deleteAccountHint, { color: c.textSecondary }]}>
                    アカウントを削除すると、紐づく介護データもサーバー上で消去されます（カスケード削除）。ログアウトより強い操作です。
                  </Text>
                  <Pressable
                    onPress={onDeleteAccount}
                    disabled={signingOut || deletingAccount}
                    style={({ pressed }) => [
                      styles.deleteAccountBtn,
                      {
                        borderColor: c.danger,
                        backgroundColor: c.dangerMuted,
                        opacity: signingOut || deletingAccount || pressed ? 0.75 : 1,
                      },
                    ]}>
                    {deletingAccount ? (
                      <ActivityIndicator color={c.danger} />
                    ) : (
                      <Text style={[styles.deleteAccountBtnText, { color: c.danger }]}>
                        アカウントを削除
                      </Text>
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
  legalBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  legalSub: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 12,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 8,
  },
  legalRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
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
  deleteAccountHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
  },
  deleteAccountBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 180,
    alignItems: 'center',
  },
  deleteAccountBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
