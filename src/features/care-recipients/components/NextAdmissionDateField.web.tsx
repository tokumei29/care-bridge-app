import type { ChangeEvent, CSSProperties } from 'react';
import { createElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { formatNextAdmissionJa } from '@/features/care-recipients/recipientAdmissionDate';
import { getCareBridgeColors } from '@/theme/careBridge';

type Props = {
  value: string | null;
  onChange: (next: string | null) => void;
};

export function NextAdmissionDateField({ value, onChange }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);

  return (
    <View style={styles.wrap}>
      <View style={[styles.inputShell, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
        {createElement('input', {
          type: 'date',
          value: value ?? '',
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            onChange(v.length > 0 ? v : null);
          },
          style: {
            width: '100%',
            border: 'none',
            backgroundColor: 'transparent',
            color: c.text,
            fontSize: 17,
            padding: '12px 16px',
            outline: 'none',
            minHeight: 48,
            boxSizing: 'border-box',
          } as CSSProperties,
        })}
      </View>
      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: c.textSecondary }]}>
          {value ? formatNextAdmissionJa(value) : 'ブラウザの日付ピッカーで選べます'}
        </Text>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
            <Text style={{ color: c.danger, fontWeight: '700', fontSize: 14 }}>クリア</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  inputShell: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
