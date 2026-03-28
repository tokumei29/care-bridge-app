import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ScrollPickerColumn } from '@/features/care-records/shared/ScrollPickerColumn';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_LABELS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const TIME_WHEEL_HOUR_LABELS = HOUR_LABELS;
export const TIME_WHEEL_MINUTE_LABELS = MINUTE_LABELS;

type Props = {
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  /** 未指定時は `c.borderStrong` */
  borderColor?: string;
};

/**
 * 時・分のスクロールピッカー（1行）。新規記録・一覧の時間帯フィルタなどで共通利用。
 */
export function TimeWheelsRow({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  layout,
  c,
  borderColor,
}: Props) {
  const wheelWidth = useMemo(() => (layout.isTablet ? 64 : 56), [layout.isTablet]);
  const border = borderColor ?? c.borderStrong;

  return (
    <View style={[styles.timeRow, { borderColor: border }]}>
      <ScrollPickerColumn
        data={HOUR_LABELS}
        selectedIndex={hour}
        onChangeIndex={onHourChange}
        width={wheelWidth}
      />
      <Text style={[styles.colon, { color: c.text }]}>:</Text>
      <ScrollPickerColumn
        data={MINUTE_LABELS}
        selectedIndex={minute}
        onChangeIndex={onMinuteChange}
        width={wheelWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  colon: {
    fontSize: 28,
    fontWeight: '800',
    marginHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
});
