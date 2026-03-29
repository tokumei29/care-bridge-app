import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  formatNextAdmissionJa,
  isoToLocalCalendarDate,
  localCalendarDateToIso,
} from '@/features/care-recipients/recipientAdmissionDate';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

export type NextAdmissionDateFieldProps = {
  value: string | null;
  onChange: (next: string | null) => void;
};

export function NextAdmissionDateField({ value, onChange }: NextAdmissionDateFieldProps) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const layout = useResponsiveLayout();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = layout.isTablet;
  const iosPickerWidth = Math.min(windowWidth - 32, isTablet ? 520 : 380);
  const fontSize = isTablet ? 19 : 17;
  const padV = isTablet ? 16 : 12;

  const [showIosModal, setShowIosModal] = useState(false);
  const [iosWorking, setIosWorking] = useState(() => isoToLocalCalendarDate(value));
  const [showAndroid, setShowAndroid] = useState(false);

  const openPicker = () => {
    setIosWorking(isoToLocalCalendarDate(value));
    if (Platform.OS === 'ios') {
      setShowIosModal(true);
    } else {
      setShowAndroid(true);
    }
  };

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowAndroid(false);
    if (event.type === 'dismissed') return;
    if (date) onChange(localCalendarDateToIso(date));
  };

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="次の入所日を選ぶ"
          onPress={openPicker}
          style={({ pressed }) => [
            styles.field,
            {
              backgroundColor: c.surfaceElevated,
              borderColor: c.border,
              paddingVertical: padV,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <Text style={{ color: value ? c.text : c.textSecondary, fontSize, fontWeight: '600' }}>
            {value ? formatNextAdmissionJa(value) : '日付を選択'}
          </Text>
        </Pressable>
        {value ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(null)}
            style={({ pressed }) => [
              styles.clearChip,
              { backgroundColor: c.dangerMuted, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={[styles.clearChipText, { color: c.danger }]}>クリア</Text>
          </Pressable>
        ) : null}
      </View>

      {showAndroid ? (
        <DateTimePicker
          value={isoToLocalCalendarDate(value)}
          mode="date"
          display="default"
          onChange={onAndroidChange}
        />
      ) : null}

      <Modal visible={showIosModal} transparent animationType="fade" onRequestClose={() => setShowIosModal(false)}>
        <Pressable style={styles.iosBackdrop} onPress={() => setShowIosModal(false)}>
          <Pressable
            style={[
              styles.iosSheet,
              {
                backgroundColor: c.surfaceSolid,
                borderColor: c.borderStrong,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.iosPickerWrap}>
              <DateTimePicker
                value={iosWorking}
                mode="date"
                display="spinner"
                locale="ja_JP"
                themeVariant={scheme === 'dark' ? 'dark' : 'light'}
                style={[styles.iosPicker, { width: iosPickerWidth }]}
                onChange={(_, d) => {
                  if (d) setIosWorking(d);
                }}
              />
            </View>
            <View style={styles.iosActions}>
              <Pressable
                onPress={() => setShowIosModal(false)}
                style={({ pressed }) => [styles.iosBtn, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: 17 }}>キャンセル</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(localCalendarDateToIso(iosWorking));
                  setShowIosModal(false);
                }}
                style={({ pressed }) => [styles.iosBtn, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={{ color: c.accent, fontWeight: '800', fontSize: 17 }}>決定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  field: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 48,
  },
  clearChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  clearChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  iosBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  iosSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingTop: 8,
  },
  iosPickerWrap: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** UIDatePicker（spinner）はデフォルトで左寄せになりやすいので幅を抑えてラッパー中央に載せる */
  iosPicker: {
    alignSelf: 'center',
    flexGrow: 0,
  },
  iosActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  iosBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
