import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';

type Props = {
  layout: ResponsiveLayout;
  children: React.ReactNode;
};

/**
 * Centers content on tablets with a max width; phones use full width minus gutters.
 */
export function ContentRail({ layout, children }: Props) {
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
