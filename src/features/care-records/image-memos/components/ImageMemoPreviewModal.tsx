import { Image } from 'expo-image';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useSignedSupabasePublicStorageUrl } from '@/lib/useAvatarDisplayUri';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  visible: boolean;
  imageUrl: string | null;
  onRequestClose: () => void;
};

export function ImageMemoPreviewModal({ visible, imageUrl, onRequestClose }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const urlForHook = visible && imageUrl?.trim() ? imageUrl.trim() : null;
  const uri = useSignedSupabasePublicStorageUrl(urlForHook);

  const maxW = Math.max(1, width - 24);
  const maxH = Math.max(1, height - insets.top - insets.bottom - 72);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose}
      statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}
        onPress={onRequestClose}
        accessibilityRole="button"
        accessibilityLabel="閉じる">
        <View style={styles.imageSlot} pointerEvents="none">
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: maxW, height: maxH }}
              contentFit="contain"
              transition={200}
            />
          ) : urlForHook ? (
            <ActivityIndicator size="large" color={c.accent} />
          ) : null}
        </View>
        <Text style={[styles.hint, { color: 'rgba(255,255,255,0.85)' }]}>画面をタップして閉じる</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  imageSlot: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
});
