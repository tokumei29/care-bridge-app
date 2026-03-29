import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import type { CareRecipient } from '@/features/care-recipients/types';
import {
  calendarDaysUntilIsoDate,
  formatNextAdmissionJa,
  isAdmissionWithinSoonWindow,
} from '@/features/care-recipients/recipientAdmissionDate';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  /** 表示中の被介護者（この方の入所予定のみを対象） */
  recipient: CareRecipient;
  c: CareBridgeColors;
  scheme: 'light' | 'dark';
};

function leadLine(daysUntil: number, dateJa: string): string {
  if (daysUntil <= 0) {
    return `本日（${dateJa}）が入所予定日です。`;
  }
  if (daysUntil === 1) {
    return `本日は入所予定日（${dateJa}）の前日です。`;
  }
  return `入所日（${dateJa}）まであと${daysUntil}日です。`;
}

/**
 * 被介護者の介護記録トップ（カードタップ後のホーム）上部。
 * 入所予定が近いときだけ表示。
 */
export function AdmissionSoonBanner({ recipient, c, scheme }: Props) {
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;

  const { show, daysUntil, dateJa } = useMemo(() => {
    const iso = recipient.nextAdmissionOn;
    if (!iso) return { show: false as const, daysUntil: 0, dateJa: '' };
    const d = calendarDaysUntilIsoDate(iso);
    if (d == null || !isAdmissionWithinSoonWindow(d)) {
      return { show: false as const, daysUntil: 0, dateJa: '' };
    }
    return { show: true as const, daysUntil: d, dateJa: formatNextAdmissionJa(iso) };
  }, [recipient.nextAdmissionOn]);

  if (!show) return null;

  const palette = scheme === 'dark' ? paletteDark : paletteLight;
  const displayName = recipient.name.trim() || 'この方';

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: palette.border,
          marginBottom: layout.isTablet ? 22 : 16,
        },
      ]}
      accessibilityRole="alert">
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
                ios: 'heart.text.square.fill',
                android: 'favorite',
                web: 'favorite',
              }}
              tintColor={palette.icon}
              size={isTablet ? 28 : 24}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.eyebrow, { color: palette.emphasis }]}>{displayName}さん</Text>
            <Text style={[styles.title, { color: c.text }]}>{leadLine(daysUntil, dateJa)}</Text>
            <Text style={[styles.body, { color: c.text }]}>
              最近の体調や、施設の方に伝えておきたい食事・睡眠の様子など、
              <Text style={{ fontWeight: '800', color: c.accent }}>記録の漏れはありませんか？</Text>
            </Text>
            <Text style={[styles.bodySecondary, { color: c.textSecondary }]}>
              まずは下の「一覧・編集」で記録を確認し、PDFにまとめを出力して内容を見直してみましょう。引き継ぎの準備にもきっと役立ちます。
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const paletteLight = {
  gradient: ['rgba(255, 248, 240, 0.98)', 'rgba(255, 232, 210, 0.65)'] as const,
  border: 'rgba(200, 110, 40, 0.42)',
  bar: '#c86a1a',
  icon: '#b85a28',
  iconBg: 'rgba(200, 106, 26, 0.18)',
  emphasis: '#8a4508',
};

const paletteDark = {
  gradient: ['rgba(52, 36, 24, 0.96)', 'rgba(38, 26, 18, 0.94)'] as const,
  border: 'rgba(230, 160, 90, 0.38)',
  bar: '#e8a060',
  icon: '#f0b870',
  iconBg: 'rgba(232, 160, 96, 0.2)',
  emphasis: '#f5c896',
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
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
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
