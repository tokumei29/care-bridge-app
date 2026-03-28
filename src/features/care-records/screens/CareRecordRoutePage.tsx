import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type SymbolViewProps } from 'expo-symbols';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareRecipients } from '@/features/care-recipients';
import type { CareRecordRouteSegment } from '@/features/care-records/careRecordMenu';
import { getCareRecordMenuItem } from '@/features/care-records/careRecordMenu';
import { CareRecordStubScreen } from '@/features/care-records/screens/CareRecordStubScreen';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  segment: CareRecordRouteSegment;
};

export function CareRecordRoutePage({ segment }: Props) {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const layout = useResponsiveLayout();
  const item = getCareRecordMenuItem(segment);

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

  if (!isReady) {
    return (
      <ScreenBackdrop>
        <>
          <Stack.Screen options={{ title: item.screenHeaderTitle }} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        </>
      </ScreenBackdrop>
    );
  }

  if (!recipientId || !recipient) {
    return (
      <ScreenBackdrop>
        <>
          <Stack.Screen options={{ title: item.screenHeaderTitle }} />
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
    <CareRecordStubScreen
      recipientId={recipientId}
      headerTitle={item.screenHeaderTitle}
      heading={item.screenHeading}
      description={item.screenDescription}
      symbol={item.symbol as SymbolViewProps['name']}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
