import { getJapanNowParts, parseIsoToJapanDateTimeParts } from '@/features/care-records/shared';

import type { MonthKeyCollectionInput } from '@/features/care-records/pdf/monthKeyUtils';

/** 記録がある暦日キー `YYYY-MM-DD`（日本時間） */
export function addDayKeyFromIso(set: Set<string>, iso: string | null | undefined): void {
  if (iso == null || iso === '') return;
  try {
    const { dateKey } = parseIsoToJapanDateTimeParts(iso);
    set.add(dateKey);
  } catch {
    /* ignore */
  }
}

function addSleepRecordDays(set: Set<string>, row: { bedded_at: string; woke_at: string }): void {
  addDayKeyFromIso(set, row.bedded_at);
  addDayKeyFromIso(set, row.woke_at);
}

function addRehabRecordDays(
  set: Set<string>,
  row: { started_at: string; ended_at?: string }
): void {
  addDayKeyFromIso(set, row.started_at);
  addDayKeyFromIso(set, row.ended_at);
}

/** 全カテゴリの記録から「記録がある日」のキーを集約し昇順で返す */
export function collectCareRecordDayKeys(input: MonthKeyCollectionInput): string[] {
  const set = new Set<string>();
  for (const list of input.withRecordedAt) {
    for (const row of list) {
      addDayKeyFromIso(set, row.recorded_at);
    }
  }
  for (const row of input.sleep) {
    addSleepRecordDays(set, row);
  }
  for (const row of input.rehab) {
    addRehabRecordDays(set, row);
  }
  return [...set].sort();
}

/** 表示用（例: 2024年3月8日） */
export function formatJapanDateLabel(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  return `${m[1]}年${mo}月${d}日`;
}

/** `YYYY-MM-DD` の大小（範囲検証用） */
export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

/** 暦日として a から b まで何日含むか（a≦b を前提。同日なら 1） */
export function countInclusiveCalendarDays(startKey: string, endKey: string): number {
  const [ys, ms, ds] = startKey.split('-').map(Number);
  const [ye, me, de] = endKey.split('-').map(Number);
  const s = Date.UTC(ys, ms - 1, ds);
  const e = Date.UTC(ye, me - 1, de);
  return Math.floor((e - s) / 86400000) + 1;
}

/** 暦日に n 日加算（タイムゾーンに依存しない日付キー演算） */
export function addDaysToDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d + deltaDays);
  const yy = new Date(t).getUTCFullYear();
  const mm = String(new Date(t).getUTCMonth() + 1).padStart(2, '0');
  const dd = String(new Date(t).getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** `dayKeys` のうち startKey〜endKey（暦日・含む）に入る最も遅い日。無ければ null */
export function lastDayKeyInInclusiveRange(
  dayKeys: string[],
  startKey: string,
  endKey: string
): string | null {
  const hit = dayKeys.filter(
    (k) => compareDateKeys(k, startKey) >= 0 && compareDateKeys(k, endKey) <= 0
  );
  return hit.length ? hit[hit.length - 1]! : null;
}

/**
 * 日単位PDFの初期選択: 日本時間の「今日」が記録日にあればそれ、なければ今日以前で最新の記録日、なければ最新の記録日。
 */
export function pickDefaultDayKeyForPdfExport(dayKeys: string[]): string | null {
  if (dayKeys.length === 0) return null;
  const today = getJapanNowParts().dateKey;
  if (dayKeys.includes(today)) return today;
  const notAfterToday = dayKeys.filter((k) => compareDateKeys(k, today) <= 0);
  if (notAfterToday.length > 0) {
    return notAfterToday[notAfterToday.length - 1]!;
  }
  return dayKeys[dayKeys.length - 1]!;
}
