import { router, type Href, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_CARE_RECIPIENTS } from '@/features/care-recipients/constants';
import { useCareRecipients } from '@/features/care-recipients/CareRecipientsProvider';
import type { RecipientAvatarSubmit } from '@/features/care-recipients/types';
import { CareBridgeWelcomeModal } from '@/features/care-recipients/components/CareBridgeWelcomeModal';
import { NewRecipientGuideModal } from '@/features/care-recipients/components/NewRecipientGuideModal';
import { NameFormModal } from '@/features/care-recipients/components/NameFormModal';
import { RecipientCard } from '@/features/care-recipients/components/RecipientCard';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient, heroShineGradient } from '@/theme/gradients';

export function DashboardScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const {
    recipients,
    isReady,
    isSignedIn,
    canAddMore,
    refreshRecipients,
    addRecipient,
    updateRecipient,
    removeRecipient,
  } = useCareRecipients();

  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [newRecipientGuide, setNewRecipientGuide] = useState<{ open: boolean; name: string }>({
    open: false,
    name: '',
  });
  const editing = editId ? recipients.find((r) => r.id === editId) : undefined;

  /** 未ログインでホームタブに来るたび表示（ローカル保存しない。コンセプトの再確認用） */
  useFocusEffect(
    useCallback(() => {
      if (!isReady || isSignedIn) {
        setWelcomeOpen(false);
        return;
      }
      setWelcomeOpen(true);
    }, [isReady, isSignedIn])
  );

  const handleWelcomeDismiss = useCallback(() => {
    setWelcomeOpen(false);
  }, []);

  const handleWelcomeLogin = useCallback(() => {
    setWelcomeOpen(false);
    router.push('/auth/login');
  }, []);

  const handleWelcomeSignUp = useCallback(() => {
    setWelcomeOpen(false);
    router.push('/auth/sign-up');
  }, []);

  const handleAdd = async (payload: {
    name: string;
    avatar: RecipientAvatarSubmit;
    nextAdmissionOn: string | null;
  }) => {
    const r = await addRecipient(payload.name, payload.avatar, payload.nextAdmissionOn);
    if (!r.ok) {
      Alert.alert('登録できません', r.reason);
      return;
    }
    setAddOpen(false);
    setNewRecipientGuide({ open: true, name: payload.name.trim() });
  };

  const handleEdit = async (payload: {
    name: string;
    avatar: RecipientAvatarSubmit;
    nextAdmissionOn: string | null;
  }) => {
    if (!editId) return;
    const r = await updateRecipient(editId, payload.name, payload.avatar, payload.nextAdmissionOn);
    if (!r.ok) {
      Alert.alert('更新できません', r.reason);
      return;
    }
    setEditId(null);
  };

  const onRefresh = async () => {
    if (!isSignedIn) return;
    setRefreshing(true);
    try {
      await refreshRecipients();
    } finally {
      setRefreshing(false);
    }
  };

  if (!isReady) {
    return (
      <ScreenBackdrop>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      </ScreenBackdrop>
    );
  }

  const heroTitle = layout.isTablet ? 36 : 30;
  const heroSub = layout.isTablet ? 17 : 15;

  return (
    <ScreenBackdrop>
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + (layout.isTablet ? 36 : 28) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }>
          <ContentRail layout={layout}>
            {!isSignedIn ? (
              <View style={[styles.authBanner, { backgroundColor: c.accentMuted, borderColor: c.borderStrong }]}>
                <Text style={[styles.authBannerTitle, { color: c.text }]}>ログインが必要です</Text>
                <Text style={[styles.authBannerBody, { color: c.textSecondary }]}>
                  ログインすると、サーバーに保存された被介護者一覧を表示・編集できます。
                </Text>
                <View style={styles.authBannerActions}>
                  <Pressable
                    onPress={() => router.push('/auth/login')}
                    style={({ pressed }) => [
                      styles.authBtnPrimary,
                      { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 },
                    ]}>
                    <Text style={styles.authBtnPrimaryText}>ログイン</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/auth/sign-up')}
                    style={({ pressed }) => [
                      styles.authBtnSecondary,
                      {
                        borderColor: c.accent,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <Text style={[styles.authBtnSecondaryText, { color: c.accent }]}>新規登録</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <LinearGradient
              colors={[...heroShineGradient[themeKey].colors]}
              start={heroShineGradient[themeKey].start}
              end={heroShineGradient[themeKey].end}
              style={[
                styles.hero,
                {
                  borderColor: c.borderStrong,
                  ...layout.isTablet && styles.heroTablet,
                },
              ]}>
              <View style={styles.heroTop}>
                <View style={styles.heroTitles}>
                  <Text style={[styles.heroEyebrow, { color: c.accent }]}>家族の介護を、ひとつに</Text>
                  <Text
                    style={[
                      styles.heroTitle,
                      { color: c.text, fontSize: heroTitle, lineHeight: Math.round(heroTitle * 1.12) },
                    ]}>
                    Care Bridge
                  </Text>
                  <Text
                    style={[
                      styles.heroSubtitle,
                      { color: c.textSecondary, fontSize: heroSub, maxWidth: layout.isTablet ? 480 : 300 },
                    ]}>
                    登録した方を選ぶと、その方の介護記録へ進みます。ご家族で最大{MAX_CARE_RECIPIENTS}名まで。
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: c.accentMuted, borderColor: c.borderStrong }]}>
                  <SymbolView
                    name={{ ios: 'heart.text.square.fill', android: 'favorite', web: 'favorite' }}
                    tintColor={c.accent}
                    size={layout.isTablet ? 26 : 22}
                  />
                  <Text style={[styles.badgeText, { color: c.accent }]}>
                    {recipients.length}/{MAX_CARE_RECIPIENTS}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {recipients.length === 0 ? (
              <LinearGradient
                colors={[c.surfaceSolid, c.surfaceElevated]}
                style={[styles.empty, { borderColor: c.borderStrong }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.accentMuted }]}>
                  <SymbolView
                    name={{ ios: 'person.2.fill', android: 'people', web: 'people' }}
                    tintColor={c.accent}
                    size={layout.isTablet ? 48 : 40}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text, fontSize: layout.isTablet ? 22 : 19 }]}>
                  {!isSignedIn ? '一覧を読み込めません' : 'まだ登録がありません'}
                </Text>
                <Text
                  style={[
                    styles.emptyBody,
                    { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                  ]}>
                  {!isSignedIn
                    ? 'サインインすると、サーバーに保存された被介護者がここに表示されます。'
                    : `下のボタンから、お世話されている方を追加してください。おじいちゃん・おばあちゃんなど、最大${MAX_CARE_RECIPIENTS}名まで登録できます。`}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[styles.recipientStack, { gap: layout.gap }]}>
                {recipients.map((r) => (
                  <View key={r.id} style={styles.recipientStackItem}>
                    <RecipientCard
                      recipient={r}
                      onOpenCare={() => {
                        const rid = String(r.id ?? '').trim();
                        if (!rid) {
                          Alert.alert(
                            '開けません',
                            'この被介護者のデータに問題があります。一覧を更新してから再度お試しください。'
                          );
                          void refreshRecipients();
                          return;
                        }
                        router.push({
                          pathname: '/care/[recipientId]',
                          params: { recipientId: rid },
                        } as unknown as Href);
                      }}
                      onEdit={() => setEditId(r.id)}
                      onDelete={() => {
                        void removeRecipient(r.id);
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

        <Pressable
          onPress={() => (canAddMore && isSignedIn ? setAddOpen(true) : undefined)}
          disabled={!canAddMore || !isSignedIn}
              style={({ pressed }) => [
                styles.ctaOuter,
                {
                  opacity: !canAddMore || !isSignedIn ? 0.45 : pressed ? 0.92 : 1,
                  marginTop: layout.isTablet ? 32 : 28,
                },
              ]}>
              <LinearGradient
                colors={[...ctaGradient[themeKey].colors]}
                start={ctaGradient[themeKey].start}
                end={ctaGradient[themeKey].end}
                style={[styles.ctaGradient, layout.isTablet && styles.ctaGradientTablet]}>
                <SymbolView
                  name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                  tintColor="rgba(255,255,255,0.95)"
                  size={layout.isTablet ? 26 : 22}
                />
                <Text style={styles.ctaText}>
                  {!isSignedIn
                    ? 'ログイン後に追加できます'
                    : canAddMore
                      ? '被介護者を追加する'
                      : `登録上限（${MAX_CARE_RECIPIENTS}名）に達しています`}
                </Text>
              </LinearGradient>
            </Pressable>
          </ContentRail>
        </ScrollView>
      </View>

      <CareBridgeWelcomeModal
        visible={welcomeOpen}
        onDismiss={handleWelcomeDismiss}
        onPressLogin={handleWelcomeLogin}
        onPressSignUp={handleWelcomeSignUp}
      />
      <NewRecipientGuideModal
        visible={newRecipientGuide.open}
        recipientName={newRecipientGuide.name}
        onDismiss={() => setNewRecipientGuide({ open: false, name: '' })}
      />
      <NameFormModal
        visible={addOpen}
        mode="add"
        title="被介護者を追加"
        submitLabel="登録"
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
      <NameFormModal
        visible={!!editId}
        mode="edit"
        title="登録を編集"
        initialName={editing?.name ?? ''}
        initialAvatarUrl={editing?.avatarUrl ?? null}
        initialNextAdmissionOn={editing?.nextAdmissionOn ?? null}
        submitLabel="保存"
        onClose={() => setEditId(null)}
        onSubmit={handleEdit}
      />
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    marginBottom: 22,
    overflow: 'hidden',
  },
  heroTablet: {
    padding: 28,
    borderRadius: 28,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTitles: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSubtitle: {
    marginTop: 10,
    lineHeight: 23,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  recipientStack: {
    width: '100%',
    flexDirection: 'column',
  },
  recipientStackItem: {
    width: '100%',
  },
  empty: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    maxWidth: 520,
  },
  authBanner: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  authBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  authBannerBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  authBannerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  authBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  authBtnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  authBtnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 120,
    alignItems: 'center',
  },
  authBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '800',
  },
  ctaOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  ctaGradientTablet: {
    paddingVertical: 20,
    borderRadius: 20,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
