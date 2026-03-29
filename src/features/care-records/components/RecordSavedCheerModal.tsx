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

export type RecordSavedCheerMode = 'create' | 'update';

type Props = {
  visible: boolean;
  mode: RecordSavedCheerMode;
  onDismiss: () => void;
};

/**
 * 記録の新規保存・更新成功直後。サーバー保存の事実より、継続のモチベーションを伝える。
 */
export function RecordSavedCheerModal({ visible, mode, onDismiss }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const maxCardW = layout.isTablet ? 480 : undefined;

  const { maxCardHeight, scrollMaxHeight } = useMemo(() => {
    const winH = Dimensions.get('window').height;
    const verticalPad = insets.top + insets.bottom + 24;
    const maxCard = Math.min(Math.round(winH * 0.9), Math.max(300, winH - verticalPad));
    const chrome = layout.isTablet ? 280 : 248;
    const scrollMax = Math.max(140, maxCard - chrome);
    return { maxCardHeight: maxCard, scrollMaxHeight: scrollMax };
  }, [insets.bottom, insets.top, layout.isTablet]);

  const title = mode === 'create' ? '記録を保存しました！' : '記録を更新しました！';

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
                    name={{ ios: 'sparkles', android: 'star', web: 'star' }}
                    tintColor={c.accent}
                    size={layout.isTablet ? 34 : 30}
                  />
                </View>
                <Text style={[styles.title, { color: c.text }]}>{title}</Text>
                <Text style={[styles.lead, { color: c.accent }]}>お疲れ様です。また一つ、ピースが積み重なりました。</Text>
              </View>

              <ScrollView
                style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                bounces>
                <Text style={[styles.p, { color: c.textSecondary }]}>
                  今日の記録は、施設への
                  <Text style={{ fontWeight: '700', color: c.text }}>「最高の引き継ぎ書」を作る大切なピース</Text>
                  になります。
                </Text>
                <Text style={[styles.p, { color: c.textSecondary }]}>
                  あなたのひとことが、ご本人の
                  <Text style={{ fontWeight: '700', color: c.text }}>より良いケア</Text>
                  に直接つながります。
                </Text>

                <View style={[styles.hintBox, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
                  <Text style={[styles.hintTitle, { color: c.text }]}>記録のちから</Text>
                  <Text style={[styles.hintLine, { color: c.textSecondary }]}>
                    ・3日で生活リズムが見えてきます{'\n'}
                    ・1週間でPDFにぐっと深みが出ます
                  </Text>
                  <Text style={[styles.hintNote, { color: c.textSecondary }]}>
                    今日も一歩前進です。ゆっくり休んでくださいね。
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
                    <Text style={styles.ctaText}>閉じる</Text>
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
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  lead: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
    paddingHorizontal: 4,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  p: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
    fontWeight: '500',
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
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  hintLine: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  hintNote: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
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
