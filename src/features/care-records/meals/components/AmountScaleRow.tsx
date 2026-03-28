import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { AMOUNT_MAX, AMOUNT_MIN } from '@/features/care-records/meals/mealConstants';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  label: string;
  value: number;
  onChange: (v: number) => void;
};

const VALUES = Array.from({ length: AMOUNT_MAX - AMOUNT_MIN + 1 }, (_, i) => AMOUNT_MIN + i);

export function AmountScaleRow({ label, value, onChange }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);

  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        <Text style={[styles.hint, { color: c.textSecondary }]}>10＝全部</Text>
      </View>
      <View style={styles.row}>
        {VALUES.map((n) => {
          const on = n === value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: on ? c.accent : c.borderStrong,
                  backgroundColor: on ? c.accentMuted : c.surfaceElevated,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.chipText, { color: on ? c.accent : c.text }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 40,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
