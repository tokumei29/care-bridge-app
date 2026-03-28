import type { SleepRecordRecord } from '@/api/types/sleepRecord';
import {
  addJapanCalendarDays,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  parseJapanDateKey,
} from '@/features/care-records/shared';
import { sleepIntervalMinutes } from '@/features/care-records/sleep/sleepDraft';

export type SleepWeekChartPoint = {
  dateKey: string;
  xLabel: string;
  totalMinutes: number;
};

/**
 * 日本時間の「終端日」（省略時は今日）から遡って 7 暦日分、
 * 臥床日（bedded_at の日本暦日）ごとの睡眠分数**合計**。
 * 同一日内の複数記録（夜間・昼寝など別レコード）はすべて加算する。
 */
export function buildSleepMinutesLast7JapanDays(
  records: SleepRecordRecord[],
  endDateKeyJapan?: string
): SleepWeekChartPoint[] {
  const end = endDateKeyJapan ?? getJapanNowParts().dateKey;
  const out: SleepWeekChartPoint[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dateKey = addJapanCalendarDays(end, offset);
    let total = 0;
    for (const r of records) {
      if (!isRecordedAtOnJapanDate(r.bedded_at, dateKey)) continue;
      const m = sleepIntervalMinutes(r.bedded_at, r.woke_at);
      if (m != null) total += m;
    }
    const parsed = parseJapanDateKey(dateKey);
    const xLabel = parsed ? `${parsed.month}/${parsed.day}` : dateKey;
    out.push({ dateKey, xLabel, totalMinutes: total });
  }
  return out;
}

/** グラフ左軸用（分数 → 「8時間」「30分」など） */
export function formatSleepMinutesAxisLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0 && m === 0) return '0時間';
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}
