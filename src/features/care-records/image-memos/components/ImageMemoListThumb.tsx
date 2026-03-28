import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useSignedSupabasePublicStorageUrl } from '@/lib/useAvatarDisplayUri';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  imageUrl: string;
  size: number;
  c: Pick<CareBridgeColors, 'surfaceSolid' | 'textSecondary' | 'borderStrong'>;
};

export function ImageMemoListThumb({ imageUrl, size, c }: Props) {
  const uri = useSignedSupabasePublicStorageUrl(imageUrl);
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderColor: c.borderStrong,
          backgroundColor: c.surfaceSolid,
        },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
