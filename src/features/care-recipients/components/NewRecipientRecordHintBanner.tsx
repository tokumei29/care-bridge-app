import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { isWithin24HoursOfRecipientCreatedAt } from '@/features/care-recipients/recipientCreationWindow';
import type { CareRecipient } from '@/features/care-recipients/types';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipient: CareRecipient;
  c: CareBridgeColors;
  scheme: 'light' | 'dark';
};

/**
 * 登録から24時間以内の被介護者向け。入所が近いアラートの直下に置く（二重表示可）。
 */
export function NewRecipientRecordHintBanner({ recipient, c, scheme }: Props) {
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;

  const show = useMemo(
    () => isWithin24HoursOfRecipientCreatedAt(recipient.createdAt),
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
      ]}
    >
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
                ios: 'square.and.pencil',
                android: 'edit',
                web: 'edit',
              }}
              tintColor={palette.icon}
              size={isTablet ? 28 : 24}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: c.text }]}>記録をはじめましょう</Text>
            <Text style={[styles.body, { color: c.text }]}>
              食事量の単位など、実際の施設の記録内容に準拠しています。まずは気になるところから記録してみましょう。
            </Text>
            <Text style={[styles.bodySecondary, { color: c.textSecondary }]}>
              一覧で記録を振り返れます。PDFを出力して、LINEやメールで遠く離れたご家族や施設と情報を共有できます。ダウンロードして直接渡すこともできます。
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const paletteLight = {
  gradient: ['rgba(240, 250, 247, 0.98)', 'rgba(220, 242, 236, 0.75)'] as const,
  border: 'rgba(45, 122, 110, 0.35)',
  bar: '#2d7a6e',
  icon: '#2d7a6e',
  iconBg: 'rgba(45, 122, 110, 0.16)',
};

const paletteDark = {
  gradient: ['rgba(28, 42, 38, 0.96)', 'rgba(22, 36, 32, 0.94)'] as const,
  border: 'rgba(94, 184, 168, 0.35)',
  bar: '#5eb8a8',
  icon: '#7fd4c4',
  iconBg: 'rgba(94, 184, 168, 0.2)',
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
