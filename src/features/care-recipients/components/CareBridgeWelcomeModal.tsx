import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onPressLogin: () => void;
  onPressSignUp: () => void;
};

/**
 * 未ログイン時。Care Bridge の立ち位置と PDF 共有の価値を伝える。
 * カードは中身の高さに合わせ、長文だけ ScrollView 内でスクロールする。
 */
export function CareBridgeWelcomeModal({ visible, onDismiss, onPressLogin, onPressSignUp }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const maxCardW = layout.isTablet ? 520 : undefined;

  const { maxCardHeight, scrollMaxHeight } = useMemo(() => {
    const winH = Dimensions.get('window').height;
    const verticalPad = insets.top + insets.bottom + 24;
    const maxCard = Math.min(Math.round(winH * 0.92), Math.max(320, winH - verticalPad));
    // アイコン・見出し・ボタン列のおおよその高さを除き、本文エリアの上限だけ与える
    const chrome = layout.isTablet ? 300 : 268;
    const scrollMax = Math.max(160, maxCard - chrome);
    return { maxCardHeight: maxCard, scrollMaxHeight: scrollMax };
  }, [insets.bottom, insets.top, layout.isTablet]);

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
                    name={{ ios: 'link.circle.fill', android: 'link', web: 'link' }}
                    tintColor={c.accent}
                    size={layout.isTablet ? 36 : 32}
                  />
                </View>

                <Text style={[styles.title, { color: c.text }]}>Care Bridge へようこそ</Text>
                <Text style={[styles.lead, { color: c.accent }]}>介護のバトンタッチを、もっとスムーズに</Text>
              </View>

              <ScrollView
                style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                bounces>
                <Text style={[styles.p, { color: c.textSecondary }]}>
                  Care Bridgeは、単なる記録アプリではありません。日々の体調や様子を積み上げ、
                  <Text style={{ fontWeight: '700', color: c.text }}>
                    「最高の引き継ぎ書」を自動で作成するツール
                  </Text>
                  です。
                </Text>
                <Text style={[styles.p, { color: c.textSecondary }]}>
                  ショートステイや通所介護の当日、忙しい朝に説明資料を準備する必要はありません。蓄積されたデータは
                  <Text style={{ fontWeight: '700', color: c.text }}> ワンタップでPDF出力 </Text>
                  でき、そのまま施設へ渡せます。現場と情報をスムーズに共有し、
                  <Text style={{ fontWeight: '700', color: c.text }}> 家族の負担を減らすこと </Text>
                  が私たちの目的です。
                </Text>
                <View style={[styles.hintBox, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
                  <Text style={[styles.hintTitle, { color: c.text }]}>継続を支えるパートナーとして</Text>
                  <Text style={[styles.hintLine, { color: c.textSecondary }]}>
                    ・予定日に合わせた「引き継ぎ準備」の開始合図{'\n'}
                    ・記録が増えるほど、PDFの精度が上がる手応え{'\n'}
                    ・施設に渡した後の「伝わった」という達成感
                  </Text>
                  <Text style={[styles.hintNote, { color: c.textSecondary }]}>
                    書く苦労を減らし、伝える質を高める仕組みを順次お届けします。
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.cardFooter}>
                <View style={styles.actions}>
                  <Pressable
                    onPress={onPressLogin}
                    style={({ pressed }) => [
                      styles.btnPrimary,
                      { backgroundColor: c.accent, opacity: pressed ? 0.9 : 1 },
                    ]}>
                    <Text style={styles.btnPrimaryText}>ログイン</Text>
                  </Pressable>
                  <Pressable
                    onPress={onPressSignUp}
                    style={({ pressed }) => [
                      styles.btnSecondary,
                      { borderColor: c.accent, opacity: pressed ? 0.88 : 1 },
                    ]}>
                    <Text style={[styles.btnSecondaryText, { color: c.accent }]}>新規登録</Text>
                  </Pressable>
                </View>
                <Pressable onPress={onDismiss} hitSlop={12} style={styles.dismissHit}>
                  <Text style={[styles.dismissText, { color: c.textSecondary }]}>あとで閉じる</Text>
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
  lead: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 0,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  p: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 14,
  },
  hintBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginTop: 4,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  hintLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  hintNote: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  btnPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    minWidth: 132,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  btnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 132,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dismissHit: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
