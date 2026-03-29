import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

type Props = {
  visible: boolean;
  /** 登録したお名前（応援の一文などに使う） */
  recipientName: string;
  onDismiss: () => void;
};

const em = (c: ReturnType<typeof getCareBridgeColors>, children: React.ReactNode) => (
  <Text style={{ fontWeight: '800', color: c.text }}>{children}</Text>
);

/**
 * 被介護者の新規登録が成功した直後。記録の価値・PDF・共有・チーム介護を熱量高く伝える。
 */
export function NewRecipientGuideModal({ visible, recipientName, onDismiss }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const maxCardW = layout.isTablet ? 520 : undefined;
  const displayName = recipientName.trim() || 'この方';

  const { maxCardHeight, scrollMaxHeight } = useMemo(() => {
    const winH = Dimensions.get('window').height;
    const verticalPad = insets.top + insets.bottom + 24;
    const maxCard = Math.min(Math.round(winH * 0.92), Math.max(320, winH - verticalPad));
    // アイコン・見出し・（任意）名前一行・リード文・CTA ぶん。少し多めに取り、本文は ScrollView に収める
    const baseChrome = layout.isTablet ? 368 : 332;
    const nameLineChrome = displayName !== 'この方' ? 34 : 0;
    const chrome = baseChrome + nameLineChrome;
    const scrollMax = Math.max(160, maxCard - chrome);
    return { maxCardHeight: maxCard, scrollMaxHeight: scrollMax };
  }, [displayName, insets.bottom, insets.top, layout.isTablet]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          {Platform.OS !== 'web' ? (
            <BlurView
              intensity={layout.isTablet ? 55 : 45}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
        </Pressable>

        <View
          pointerEvents="box-none"
          style={[
            styles.sheetWrap,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: layout.isTablet ? 32 : 20,
            },
          ]}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.card,
              {
                backgroundColor: c.surfaceSolid,
                borderColor: c.borderStrong,
                maxWidth: maxCardW,
                maxHeight: maxCardHeight,
              },
            ]}>
            <View style={styles.cardColumn}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconRow, { backgroundColor: c.accentMuted }]}>
                  <SymbolView
                    name={{ ios: 'heart.text.square.fill', android: 'favorite', web: 'favorite' }}
                    tintColor={c.accent}
                    size={layout.isTablet ? 36 : 32}
                  />
                </View>

                <Text style={[styles.title, { color: c.text }]}>準備が整いました！</Text>
                {displayName !== 'この方' ? (
                  <Text style={[styles.nameCheer, { color: c.textSecondary }]}>
                    {displayName}さん、ここからがスタートです。
                  </Text>
                ) : null}
                <Text style={[styles.lead, { color: c.accent }]}>被介護者カードをタップして、記録を始めましょう。</Text>
              </View>

              <ScrollView
                style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                bounces>
                <Text style={[styles.intro, { color: c.textSecondary }]}>
                  記録がどう役に立つか、{em(c, '3つのステップ')}で説明します。
                </Text>

                <Text style={[styles.bodyP, { color: c.textSecondary }]}>
                  まずはホーム画面にある被介護者の{em(c, 'カードをタップ')}してください。食事・排泄・バイタルなど、日々の様子を
                  {em(c, '簡単に記録')}できる画面に進みます。
                </Text>

                <Text style={[styles.bodyP, { color: c.textSecondary }]}>
                  記録がたまると、日々の変化を{em(c, 'グラフで振り返ったり')}、日ごと・月ごとの
                  {em(c, '「成長・ケア記録」')}を{em(c, 'PDFとして自動生成')}できるようになります。
                </Text>

                <Text style={[styles.bodyP, { color: c.textSecondary }]}>
                  生成したPDFは、そのまま{em(c, 'ダウンロード')}・{em(c, 'メール')}・{em(c, 'LINE')}
                  で家族や施設へ共有可能です。
                </Text>
                <Text style={[styles.bodyP, { color: c.textSecondary, marginBottom: 16 }]}>
                  情報を{em(c, '正確に伝える')}ことで、スタッフとの連携がスムーズになり、
                  {em(c, 'より手厚く、その人に合ったケア')}を受けられるようになります。
                </Text>

                <View style={[styles.hintBox, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
                  <Text style={[styles.hintTitle, { color: c.text }]}>介護を「チーム」の力に</Text>
                  <Text style={[styles.hintBullet, { color: c.textSecondary }]}>
                    ・ひとりで抱え込まず、記録を{em(c, '「共通言語」')}にしましょう
                  </Text>
                  <Text style={[styles.hintBullet, { color: c.textSecondary }]}>
                    ・施設への引き継ぎが、{em(c, '驚くほど楽')}になります
                  </Text>
                  <Text style={[styles.hintBullet, { color: c.textSecondary }]}>
                    ・小さな変化の気づきが、{em(c, 'より良いケアプラン')}に繋がります
                  </Text>
                  <Text style={[styles.hintNote, { color: c.textSecondary }]}>
                    私たちは、あなたの「記録する頑張り」を全力でサポートします。
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.cardFooter}>
                <Pressable
                  onPress={onDismiss}
                  style={({ pressed }) => [styles.ctaWrap, { opacity: pressed ? 0.88 : 1 }]}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                  <LinearGradient
                    colors={[...ctaGradient[themeKey].colors]}
                    start={ctaGradient[themeKey].start}
                    end={ctaGradient[themeKey].end}
                    style={styles.cta}>
                    <Text style={styles.ctaText}>わかりました</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetWrap: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    flexDirection: 'column',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  cardColumn: {
    flexDirection: 'column',
  },
  cardHeader: {
    flexShrink: 0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardFooter: {
    flexShrink: 0,
    paddingTop: 12,
  },
  iconRow: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  nameCheer: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  lead: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 0,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  intro: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  bodyP: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  hintBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 4,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  hintBullet: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 10,
  },
  hintNote: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cta: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
