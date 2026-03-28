import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

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

  const dashboardHref = useMemo(() => '/' as Href, []);
  useExplicitStackBackHeader({ fallback: dashboardHref, tintColor: c.accent });

  const recipient = recipientId ? getRecipientById(recipientId) : undefined;

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
  const menuColumns = useMemo(() => {
    const count = layout.columnCount > 1 ? layout.columnCount : 1;
    return { count, itemWidth: count > 1 ? layout.gridItemWidth : '100%' as const };
  }, [layout.columnCount, layout.gridItemWidth]);

  const menuInput = useMemo(
    () => CARE_RECORD_MENU.filter((i) => i.menuSection === 'input'),
    []
  );
  const menuList = useMemo(() => CARE_RECORD_MENU.filter((i) => i.menuSection === 'list'), []);

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
        <ContentRail layout={layout}>
          <View style={[styles.body, layout.isTablet && styles.bodyTablet]}>
            <LinearGradient
              colors={[...heroShineGradient[themeKey].colors]}
              start={heroShineGradient[themeKey].start}
              end={heroShineGradient[themeKey].end}
              style={[styles.hero, { borderColor: c.borderStrong }]}>
              <View style={styles.heroRow}>
                {recipient.avatarUrl ? (
                  <Image
                    source={{ uri: recipient.avatarUrl }}
                    style={[
                      styles.heroAvatar,
                      { width: layout.isTablet ? 64 : 56, height: layout.isTablet ? 64 : 56 },
                    ]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.heroAvatarPlaceholder,
                      {
                        width: layout.isTablet ? 64 : 56,
                        height: layout.isTablet ? 64 : 56,
                        backgroundColor: c.avatarBg,
                      },
                    ]}>
                    <Text style={[styles.heroGlyph, { color: c.accent }]}>
                      {recipient.name.trim().slice(0, 1) || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.heroText}>
                  <Text style={[styles.heroEyebrow, { color: c.accent }]}>介護記録のトップ</Text>
                  <Text
                    style={[
                      styles.heroTitle,
                      {
                        color: c.text,
                        fontSize: heroTitleSize,
                        lineHeight: Math.round(heroTitleSize * 1.15),
                      },
                    ]}>
                    {recipient.name}さん
                  </Text>
                  <Text
                    style={[
                      styles.heroSubtitle,
                      { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 14 },
                    ]}>
                    「入力」から各カテゴリの記録を追加。「一覧・編集」から食事の一覧やPDF出力に進めます。
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' }}
                  tintColor={c.accent}
                  size={layout.isTablet ? 28 : 24}
                />
              </View>
            </LinearGradient>

            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>入力</Text>
            {renderMenuGrid(menuInput, recipient.id)}
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, { color: c.textSecondary }]}>
              一覧・編集
            </Text>
            {renderMenuGrid(menuList, recipient.id)}
          </View>
        </ContentRail>
      </>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 32,
  },
  bodyTablet: {
    paddingTop: 16,
    paddingBottom: 48,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroAvatar: {
    borderRadius: 999,
  },
  heroAvatarPlaceholder: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
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
