import React, { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  type ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { getCareBridgeColors } from '@/theme/careBridge';

const ITEM_H = 40;
const VISIBLE = 5;

type Props = {
  data: readonly string[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  width?: number;
};

export function ScrollPickerColumn({ data, selectedIndex, onChangeIndex, width = 56 }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const listRef = useRef<FlatList<string>>(null);
  const pad = ((VISIBLE - 1) * ITEM_H) / 2;
  const height = VISIBLE * ITEM_H;

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const clamped = Math.max(0, Math.min(data.length - 1, index));
      listRef.current?.scrollToOffset({ offset: clamped * ITEM_H, animated });
    },
    [data.length]
  );

  useEffect(() => {
    const t = requestAnimationFrame(() => scrollToIndex(selectedIndex, false));
    return () => cancelAnimationFrame(t);
  }, [scrollToIndex, selectedIndex]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_H);
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      if (clamped !== selectedIndex) onChangeIndex(clamped);
      scrollToIndex(clamped, true);
    },
    [data.length, onChangeIndex, scrollToIndex, selectedIndex]
  );

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item, index }) => {
      const active = index === selectedIndex;
      return (
        <View style={[styles.item, { height: ITEM_H, width }]}>
          <Text
            style={[
              styles.itemText,
              { color: active ? c.text : c.textSecondary, fontWeight: active ? '800' : '600' },
            ]}>
            {item}
          </Text>
        </View>
      );
    },
    [c.text, c.textSecondary, selectedIndex, width]
  );

  return (
    <View style={[styles.wrap, { width, height }]}>
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            top: pad,
            height: ITEM_H,
            borderColor: c.borderStrong,
            backgroundColor: c.accentMuted,
          },
        ]}
      />
      <FlatList
        ref={listRef}
        data={[...data]}
        keyExtractor={(_, i) => `${i}`}
        renderItem={renderItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * index,
          index,
        })}
        contentContainerStyle={{ paddingVertical: pad }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  list: {
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 0,
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
