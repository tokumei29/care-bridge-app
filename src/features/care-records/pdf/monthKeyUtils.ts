import { parseIsoToJapanDateTimeParts } from '@/features/care-records/shared';

/** `recorded_at` 等の ISO から日本時間の暦月キー `YYYY-MM` */
export function isoToJapanMonthKey(iso: string): string | null {
  try {
    const { dateKey } = parseIsoToJapanDateTimeParts(iso);
    return dateKey.slice(0, 7);
  } catch {
    return null;
  }
}

export function addMonthKeyFromIso(set: Set<string>, iso: string | null | undefined): void {
  if (iso == null || iso === '') return;
  const k = isoToJapanMonthKey(iso);
  if (k) set.add(k);
}

export type MonthKeyCollectionInput = {
  withRecordedAt: Array<Array<{ recorded_at: string }>>;
  sleep: Array<{ bedded_at: string; woke_at: string }>;
  rehab: Array<{ started_at: string; ended_at?: string }>;
};

/** 全カテゴリの記録から「記録がある月」のキーを集約し昇順で返す */
export function collectCareRecordMonthKeys(input: MonthKeyCollectionInput): string[] {
  const set = new Set<string>();
  for (const list of input.withRecordedAt) {
    for (const row of list) {
      addMonthKeyFromIso(set, row.recorded_at);
    }
  }
  for (const row of input.sleep) {
    addSleepRecordMonths(set, row);
  }
  for (const row of input.rehab) {
    addRehabRecordMonths(set, row);
  }
  return monthKeysSorted(set);
}

/** 睡眠（bedded_at / woke_at） */
export function addSleepRecordMonths(set: Set<string>, row: { bedded_at: string; woke_at: string }): void {
  addMonthKeyFromIso(set, row.bedded_at);
  addMonthKeyFromIso(set, row.woke_at);
}

/** リハ（started_at） */
export function addRehabRecordMonths(set: Set<string>, row: { started_at: string }): void {
  addMonthKeyFromIso(set, row.started_at);
}

export function monthKeysSorted(set: Set<string>): string[] {
  return [...set].sort();
}

/** 表示用ラベル（例: 2024年3月） */
export function formatJapanMonthLabel(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return ym;
  const mo = parseInt(m[2], 10);
  return `${m[1]}年${mo}月`;
}

/** `YYYY-MM` の大小（範囲検証用） */
export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}
