import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareRecipients } from '@/features/care-recipients';
import { useAvatarDisplayUri } from '@/lib/useAvatarDisplayUri';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { heroShineGradient } from '@/theme/gradients';

type Props = {
  recipientId: string;
  /** ナビゲーションバーに表示する短いタイトル */
  headerTitle: string;
  /** 画面内の見出し */
  heading: string;
  description: string;
  symbol: SymbolViewProps['name'];
};

export function CareRecordStubScreen({
  recipientId,
  headerTitle,
  heading,
  description,
  symbol,
}: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const { getRecipientById } = useCareRecipients();
  const recipient = getRecipientById(recipientId);
  const avatarDisplayUri = useAvatarDisplayUri(recipient?.avatarUrl);

  return (
    <ScreenBackdrop>
      <>
        <Stack.Screen options={{ title: headerTitle }} />
        <ContentRail layout={layout}>
          <View style={[styles.body, layout.isTablet && styles.bodyTablet]}>
            {avatarDisplayUri ? (
              <Image
                source={{ uri: avatarDisplayUri }}
                style={[
                  styles.avatar,
                  { width: layout.isTablet ? 72 : 64, height: layout.isTablet ? 72 : 64 },
                ]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    width: layout.isTablet ? 72 : 64,
                    height: layout.isTablet ? 72 : 64,
                    backgroundColor: c.avatarBg,
                  },
                ]}>
                <SymbolView name={symbol} tintColor={c.accent} size={layout.isTablet ? 32 : 28} />
              </View>
            )}
            <Text
              style={[
                styles.recipientLabel,
                { color: c.textSecondary, fontSize: layout.isTablet ? 15 : 14 },
              ]}>
              {recipient?.name ?? '…'}さん
            </Text>
            <LinearGradient
              colors={[...heroShineGradient[themeKey].colors]}
              start={heroShineGradient[themeKey].start}
              end={heroShineGradient[themeKey].end}
              style={[styles.card, { borderColor: c.borderStrong }]}>
              <View style={[styles.cardIcon, { backgroundColor: c.accentMuted }]}>
                <SymbolView name={symbol} tintColor={c.accent} size={layout.isTablet ? 36 : 30} />
              </View>
              <Text style={[styles.heading, { color: c.text, fontSize: layout.isTablet ? 22 : 19 }]}>
                {heading}
              </Text>
              <Text
                style={[
                  styles.copy,
                  { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                ]}>
                {description}
              </Text>
            </LinearGradient>
          </View>
        </ContentRail>
      </>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bodyTablet: {
    paddingTop: 24,
    paddingBottom: 48,
  },
  avatar: {
    borderRadius: 999,
  },
  avatarPlaceholder: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientLabel: {
    marginTop: 10,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  copy: {
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 560,
  },
});
