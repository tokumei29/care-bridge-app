import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareRecipients } from '@/features/care-recipients';
import {
  CARE_RECORD_MENU,
  CARE_RECORD_PATHNAME,
  type CareRecordMenuItem,
  type CareRecordRouteSegment,
} from '@/features/care-records/careRecordMenu';
import { CareRecordNavTile } from '@/features/care-records/components/CareRecordNavTile';
import { useAvatarDisplayUri } from '@/lib/useAvatarDisplayUri';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { heroShineGradient } from '@/theme/gradients';

/** 被介護者1人分の介護記録のトップ（アプリ全体の `/` ではない） */
export function RecipientCareHomeScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const dashboardHref = useMemo(() => '/' as Href, []);
  useExplicitStackBackHeader({ fallback: dashboardHref, tintColor: c.accent });

  const recipient = recipientId ? getRecipientById(recipientId) : undefined;
  const heroAvatarUri = useAvatarDisplayUri(recipient?.avatarUrl);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      router.replace('/auth/login');
      return;
    }
    if (recipientId && !recipient) {
      router.replace('/');
    }
  }, [isReady, isSignedIn, recipient, recipientId, router]);

  const heroTitleSize = layout.isTablet ? 28 : 24;
  const heroAvatarPx = layout.isTablet ? 120 : 96;
  const heroAvatarRadius = heroAvatarPx / 2;
  const menuColumns = useMemo(() => {
    const count = layout.columnCount > 1 ? layout.columnCount : 1;
    return { count, itemWidth: count > 1 ? layout.gridItemWidth : '100%' as const };
  }, [layout.columnCount, layout.gridItemWidth]);

  const menuInput = useMemo(
    () => CARE_RECORD_MENU.filter((i) => i.menuSection === 'input'),
    []
  );
  const menuList = useMemo(() => CARE_RECORD_MENU.filter((i) => i.menuSection === 'list'), []);
  const menuOther = useMemo(() => CARE_RECORD_MENU.filter((i) => i.menuSection === 'other'), []);

  const openCareRecord = useCallback(
    (segment: CareRecordRouteSegment, recipientIdParam: string) => {
      router.push({
        pathname: CARE_RECORD_PATHNAME[segment],
        params: { recipientId: recipientIdParam },
      } as Href);
    },
    [router]
  );

  const renderMenuGrid = (items: CareRecordMenuItem[], rid: string) => (
    <View
      style={[
        styles.menuGrid,
        {
          flexDirection: menuColumns.count > 1 ? 'row' : 'column',
          flexWrap: menuColumns.count > 1 ? 'wrap' : 'nowrap',
          gap: layout.gap,
        },
      ]}>
      {items.map((item) => (
        <View key={item.segment} style={{ width: menuColumns.itemWidth }}>
          <CareRecordNavTile
            item={item}
            iconSize={layout.isTablet ? 28 : 26}
            onPress={() => openCareRecord(item.segment, rid)}
          />
        </View>
      ))}
    </View>
  );

  if (!isReady) {
    return (
      <ScreenBackdrop>
        <>
          <Stack.Screen options={{ title: '読み込み中' }} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        </>
      </ScreenBackdrop>
    );
  }

  if (!recipient) {
    return (
      <ScreenBackdrop>
        <>
          <Stack.Screen options={{ title: 'エラー' }} />
          <View style={styles.centered}>
            <Text style={{ color: c.textSecondary, fontSize: layout.isTablet ? 17 : 15 }}>
              被介護者が見つかりませんでした。
            </Text>
          </View>
        </>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
      <>
        <Stack.Screen options={{ title: `${recipient.name}さん` }} />
        <ContentRail layout={layout} style={styles.contentRailFill}>
          <View style={styles.railScrollHost}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.body,
                layout.isTablet && styles.bodyTablet,
                { paddingBottom: (layout.isTablet ? 48 : 32) + insets.bottom },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator>
            <LinearGradient
              colors={[...heroShineGradient[themeKey].colors]}
              start={heroShineGradient[themeKey].start}
              end={heroShineGradient[themeKey].end}
              style={[styles.hero, { borderColor: c.borderStrong }]}>
              <View style={styles.heroStack}>
                <View style={[styles.heroAvatarWrap, { width: heroAvatarPx, height: heroAvatarPx }]}>
                  {heroAvatarUri ? (
                    <Image
                      source={{ uri: heroAvatarUri }}
                      style={{
                        width: heroAvatarPx,
                        height: heroAvatarPx,
                        borderRadius: heroAvatarRadius,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.heroAvatarPlaceholder,
                        {
                          width: heroAvatarPx,
                          height: heroAvatarPx,
                          borderRadius: heroAvatarRadius,
                          backgroundColor: c.avatarBg,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.heroGlyph,
                          { color: c.accent, fontSize: Math.round(heroAvatarPx * 0.36) },
                        ]}>
                        {recipient.name.trim().slice(0, 1) || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.heroText}>
                  <Text style={[styles.heroEyebrow, { color: c.accent }]}>介護記録のトップ</Text>
                  <View style={styles.heroTitleRow}>
                    <Text
                      style={[
                        styles.heroTitle,
                        {
                          color: c.text,
                          fontSize: heroTitleSize,
                          lineHeight: Math.round(heroTitleSize * 1.15),
                          flex: 1,
                        },
                      ]}>
                      {recipient.name}さん
                    </Text>
                    <SymbolView
                      name={{ ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' }}
                      tintColor={c.accent}
                      size={layout.isTablet ? 26 : 22}
                    />
                  </View>
                  <Text
                    style={[
                      styles.heroSubtitle,
                      { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 14 },
                    ]}>
                    「入力」から各カテゴリの記録を追加。「一覧・編集」で過去の記録を確認・修正。「その他」からPDF出力などに進めます。
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>入力</Text>
            {renderMenuGrid(menuInput, recipient.id)}
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, { color: c.textSecondary }]}>
              一覧・編集
            </Text>
            {renderMenuGrid(menuList, recipient.id)}
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, { color: c.textSecondary }]}>
              その他
            </Text>
            {renderMenuGrid(menuOther, recipient.id)}
            </ScrollView>
          </View>
        </ContentRail>
      </>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  contentRailFill: {
    flex: 1,
    minHeight: 0,
  },
  /** Stack から渡る高さの中で ScrollView が伸びるようにする */
  railScrollHost: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingTop: 12,
  },
  bodyTablet: {
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    marginBottom: 22,
    overflow: 'hidden',
  },
  heroStack: {
    alignItems: 'center',
  },
  heroAvatarWrap: {
    marginBottom: 16,
  },
  heroAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {
    fontWeight: '800',
  },
  heroText: {
    width: '100%',
    minWidth: 0,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 8,
    lineHeight: 22,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 22,
  },
  menuGrid: {
    width: '100%',
  },
});
