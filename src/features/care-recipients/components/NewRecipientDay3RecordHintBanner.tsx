import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { isWithinThird24HoursOfRecipientCreatedAt } from '@/features/care-recipients/recipientCreationWindow';
import type { CareRecipient } from '@/features/care-recipients/types';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipient: CareRecipient;
  c: CareBridgeColors;
  scheme: 'light' | 'dark';
};

/**
 * 登録から48〜72時間の被介護者向け（PDF 体験のすすめ）。入所・1日目・2日目バナーの下。
 */
export function NewRecipientDay3RecordHintBanner({ recipient, c, scheme }: Props) {
  const layout = useResponsiveLayout();
  const isTablet = layout.isTablet;

  const show = useMemo(
    () => isWithinThird24HoursOfRecipientCreatedAt(recipient.createdAt),
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
                ios: 'doc.richtext.fill',
                android: 'picture_as_pdf',
                web: 'description',
              }}
              tintColor={palette.icon}
              size={isTablet ? 28 : 24}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.eyebrow, { color: palette.emphasis }]}>
              PDFの価値を体験してもらう
            </Text>
            <Text style={[styles.title, { color: c.text }]}>3日間の記録を、PDFで見てみませんか？</Text>
            <Text style={[styles.body, { color: c.text }]}>
              3日分たまると、生活のリズムや変化がグラフとはっきりした数値で見えてきます。これがそのまま施設への「最高の報告書」になります。
            </Text>
            <Text style={[styles.bodySecondary, { color: c.textSecondary }]}>
              今すぐ「記録一覧」からPDFを出力して、LINEやメールで自分宛てに送ってみてください。手書きでは難しい、プロ仕様の資料に驚くはずです。
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const paletteLight = {
  gradient: ['rgba(238, 248, 252, 0.98)', 'rgba(215, 235, 245, 0.78)'] as const,
  border: 'rgba(45, 110, 130, 0.32)',
  bar: '#2a6b7e',
  icon: '#256384',
  iconBg: 'rgba(42, 107, 126, 0.16)',
  emphasis: '#1a4d5c',
};

const paletteDark = {
  gradient: ['rgba(22, 36, 44, 0.96)', 'rgba(18, 30, 38, 0.94)'] as const,
  border: 'rgba(120, 190, 215, 0.32)',
  bar: '#7ec8e0',
  icon: '#a8dff4',
  iconBg: 'rgba(126, 200, 224, 0.18)',
  emphasis: '#c8eefc',
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
