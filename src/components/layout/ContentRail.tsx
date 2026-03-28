import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';

type Props = {
  layout: ResponsiveLayout;
  children: React.ReactNode;
  /** 例: 画面いっぱいに伸ばして内側を ScrollView で埋めるとき `{ flex: 1, minHeight: 0 }` */
  style?: StyleProp<ViewStyle>;
};

/**
 * Centers content on tablets with a max width; phones use full width minus gutters.
 */
export function ContentRail({ layout, children, style }: Props) {
  return (
    <View
      style={[
        styles.rail,
        {
          paddingHorizontal: layout.horizontalGutter,
          maxWidth: layout.contentMaxWidth,
          width: '100%',
          alignSelf: 'center',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexGrow: 1,
  },
});
