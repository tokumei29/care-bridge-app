import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import type { CareRecordMenuItem } from '@/features/care-records/careRecordMenu';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  item: CareRecordMenuItem;
  onPress: () => void;
  iconSize?: number;
};

export function CareRecordNavTile({ item, onPress, iconSize = 26 }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        {
          backgroundColor: c.surfaceSolid,
          borderColor: c.borderStrong,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: c.accentMuted }]}>
        <SymbolView
          name={item.symbol as SymbolViewProps['name']}
          tintColor={c.accent}
          size={iconSize}
        />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={c.textSecondary}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
