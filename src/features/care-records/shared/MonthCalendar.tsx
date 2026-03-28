import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import {
  daysInJapanMonth,
  formatJapanDateKey,
  getJapanNowParts,
  japanDateKeyFromParts,
  japanWeekdaySun0,
  parseJapanDateKey,
  shiftJapanMonth,
} from '@/features/care-records/shared/japanTime';
import { getCareBridgeColors } from '@/theme/careBridge';

const WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

type Props = {
  selectedKey: string;
  onChangeKey: (key: string) => void;
};

/** 日本時間の月カレンダー。新規入力・一覧の日付選択などで共通利用 */
export function MonthCalendar({ selectedKey, onChangeKey }: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const todayKey = useMemo(() => formatJapanDateKey(new Date()), []);

  const parsed = parseJapanDateKey(selectedKey);
  const fallbackYm = getJapanNowParts();
  const initialYm = parsed ?? { year: fallbackYm.year, month: fallbackYm.month, day: fallbackYm.day };

  const [viewYear, setViewYear] = useState(initialYm.year);
  const [viewMonth, setViewMonth] = useState(initialYm.month);

  useEffect(() => {
    const p = parseJapanDateKey(selectedKey);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [selectedKey]);

  const grid = useMemo(() => {
    const dim = daysInJapanMonth(viewYear, viewMonth);
    const startPad = japanWeekdaySun0(viewYear, viewMonth, 1);
    const cells: ({ key: string; d: number } | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) {
      cells.push({ d, key: japanDateKeyFromParts(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth, viewYear]);

  const goPrev = () => {
    const { year, month } = shiftJapanMonth(viewYear, viewMonth, -1);
    setViewYear(year);
    setViewMonth(month);
  };

  const goNext = () => {
    const { year, month } = shiftJapanMonth(viewYear, viewMonth, 1);
    setViewYear(year);
    setViewMonth(month);
  };

  return (
    <View style={[styles.card, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
      <View style={styles.monthRow}>
        <Pressable
          onPress={goPrev}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.65 : 1 }]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={c.accent}
            size={22}
          />
        </Pressable>
        <Text style={[styles.monthTitle, { color: c.text }]}>
          {viewYear}年 {viewMonth}月
        </Text>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.65 : 1 }]}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={c.accent}
            size={22}
          />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEK_LABELS.map((w, i) => (
          <View key={w} style={styles.weekCell}>
            <Text
              style={[
                styles.weekText,
                { color: i === 0 ? c.danger : i === 6 ? c.accent : c.textSecondary },
              ]}>
              {w}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((cell, idx) => {
          if (!cell) {
            return <View key={`e-${idx}`} style={styles.dayCell} />;
          }
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedKey;
          return (
            <Pressable
              key={cell.key}
              onPress={() => onChangeKey(cell.key)}
              style={({ pressed }) => [
                styles.dayCell,
                isSelected && { backgroundColor: c.accent, borderRadius: 12 },
                isToday && !isSelected && { borderWidth: 2, borderColor: c.accent, borderRadius: 12 },
                pressed && { opacity: 0.85 },
              ]}>
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: isSelected ? '#fff' : c.text,
                    fontWeight: isSelected || isToday ? '800' : '600',
                  },
                ]}>
                {cell.d}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  navBtn: {
    padding: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});
