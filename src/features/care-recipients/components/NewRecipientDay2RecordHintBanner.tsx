import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { isWithinSecond24HoursOfRecipientCreatedAt } from '@/features/care-recipients/recipientCreationWindow';
import type { CareRecipient } from '@/features/care-recipients/types';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipient: CareRecipient;
  c: CareBridgeColors;
  scheme: 'light' | 'dark';
};

/**
 * 登録から24〜48時間の被介護者向け（1日目バナーの翌枠）。入所アラート・1日目バナーの下。
 */
export function NewRecipientDay2RecordHintBanner({ recipient, c, scheme }: Props) {
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;

  const show = useMemo(
    () => isWithinSecond24HoursOfRecipientCreatedAt(recipient.createdAt),
    [recipient.createdAt]
  );

  if (!show) return null;

  const palette = scheme === 'dark' ? paletteDark : paletteLight;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: palette.border,
          marginBottom: layout.isTablet ? 22 : 16,
        },
      ]}>
      <LinearGradient
        colors={palette.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={[styles.accentBar, { backgroundColor: palette.bar }]} />
        <View style={styles.inner}>
          <View style={[styles.iconBadge, { backgroundColor: palette.iconBg }]}>
            <SymbolView
              name={{
                ios: 'leaf.fill',
                android: 'eco',
                web: 'eco',
              }}
              tintColor={palette.icon}
              size={isTablet ? 28 : 24}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.eyebrow, { color: palette.emphasis }]}>気楽に続けよう</Text>
            <Text style={[styles.title, { color: c.text }]}>昨日の分も、資産になります</Text>
            <Text style={[styles.body, { color: c.text }]}>
              記録は「完璧」でなくて大丈夫です。一言のメモや、食事の量だけでも、数日分重なれば
              <Text style={{ fontWeight: '800', color: c.accent }}>立派な「生活リズム」</Text>
              が見えてきます。
            </Text>
            <Text style={[styles.bodySecondary, { color: c.textSecondary }]}>
              入力した内容は、自動的に「施設への引き継ぎ書」に反映されています。まずは3日間、一箇所だけでも埋めてみることから始めてみましょう。
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const paletteLight = {
  gradient: ['rgba(245, 252, 248, 0.98)', 'rgba(225, 245, 235, 0.72)'] as const,
  border: 'rgba(55, 140, 120, 0.32)',
  bar: '#3d9a88',
  icon: '#2d7a6e',
  iconBg: 'rgba(61, 154, 136, 0.18)',
  emphasis: '#1e5c52',
};

const paletteDark = {
  gradient: ['rgba(26, 40, 36, 0.96)', 'rgba(20, 34, 30, 0.94)'] as const,
  border: 'rgba(127, 212, 196, 0.32)',
  bar: '#7fd4c4',
  icon: '#9ee8d8',
  iconBg: 'rgba(127, 212, 196, 0.18)',
  emphasis: '#b8f0e4',
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 17,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.15,
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 24,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  bodySecondary: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});
