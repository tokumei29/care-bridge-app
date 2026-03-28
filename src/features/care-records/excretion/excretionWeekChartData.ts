import type { ExcretionRecordRecord } from '@/api/types/excretionRecord';
import {
  addJapanCalendarDays,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  parseJapanDateKey,
} from '@/features/care-records/shared';

export type ExcretionWeekChartPoint = {
  dateKey: string;
  xLabel: string;
  urinationCount: number;
  defecationCount: number;
};

/**
 * 日本時間の終端日（省略時は今日）から遡って 7 暦日分、
 * 記録日時（recorded_at の日本暦日）ごとの「排尿あり」「排便あり」の件数。
 * 1 件の記録で両方ありならそれぞれ 1 回ずつ加算する。
 */
export function buildExcretionCountsLast7JapanDays(
  records: ExcretionRecordRecord[],
  endDateKeyJapan?: string
): ExcretionWeekChartPoint[] {
  const end = endDateKeyJapan ?? getJapanNowParts().dateKey;
  const out: ExcretionWeekChartPoint[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dateKey = addJapanCalendarDays(end, offset);
    let urinationCount = 0;
    let defecationCount = 0;
    for (const r of records) {
      if (!isRecordedAtOnJapanDate(r.recorded_at, dateKey)) continue;
      if (r.urination_status === 'present') urinationCount += 1;
      if (r.defecation_status === 'present') defecationCount += 1;
    }
    const parsed = parseJapanDateKey(dateKey);
    const xLabel = parsed ? `${parsed.month}/${parsed.day}` : dateKey;
    out.push({ dateKey, xLabel, urinationCount, defecationCount });
  }
  return out;
}

export type ExcretionDayCountSummary = {
  dateKey: string;
  xLabel: string;
  urinationCount: number;
  defecationCount: number;
};

/**
 * 指定した日本時間の暦日について、「排尿: あり」「排便: あり」の件数（週次グラフと同じルール）。
 */
export function buildExcretionDayCountSummary(
  records: ExcretionRecordRecord[],
  dateKey: string
): ExcretionDayCountSummary {
  let urinationCount = 0;
  let defecationCount = 0;
  for (const r of records) {
    if (!isRecordedAtOnJapanDate(r.recorded_at, dateKey)) continue;
    if (r.urination_status === 'present') urinationCount += 1;
    if (r.defecation_status === 'present') defecationCount += 1;
  }
  const parsed = parseJapanDateKey(dateKey);
  const xLabel = parsed ? `${parsed.month}/${parsed.day}` : dateKey;
  return { dateKey, xLabel, urinationCount, defecationCount };
}
