/**
 * 介護記録の日付・時刻（日本時間 Asia/Tokyo）。
 * 食事・排泄など他カテゴリでも共通利用する。
 */

const TZ = 'Asia/Tokyo';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Rails `recorded_at` 用。日本時間の暦日（YYYY-MM-DD）と時・分を `+09:00` 付き ISO8601 にする。
 */
export function buildRecordedAtIsoInJapan(dateKey: string, hour: number, minute: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) {
    throw new Error(`Invalid dateKey: ${dateKey}`);
  }
  const y = m[1];
  const mo = m[2];
  const d = m[3];
  return `${y}-${mo}-${d}T${pad2(hour)}:${pad2(minute)}:00+09:00`;
}

/** API の ISO8601 を日本時間の暦・時分に分解 */
export function parseIsoToJapanDateTimeParts(iso: string): {
  dateKey: string;
  hour: number;
  minute: number;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO datetime: ${iso}`);
  }
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const num = (t: Intl.DateTimeFormatPart['type']) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  const y = num('year');
  const mo = num('month');
  const day = num('day');
  const hour = num('hour');
  const minute = num('minute');
  return {
    dateKey: `${y}-${pad2(mo)}-${pad2(day)}`,
    hour,
    minute,
  };
}

/**
 * 記録の `recorded_at` が、指定した日本時間の「日付」かつ「時刻の区間」に含まれるか。
 * 開始・終了の両端を含む。開始が終了より後なら区間を入れ替えて判定する。
 */
export function isRecordedAtInJapanDayWindow(
  recordedAtIso: string,
  dateKey: string,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): boolean {
  let parts: { dateKey: string; hour: number; minute: number };
  try {
    parts = parseIsoToJapanDateTimeParts(recordedAtIso);
  } catch {
    return false;
  }
  if (parts.dateKey !== dateKey) return false;
  const t = parts.hour * 60 + parts.minute;
  let t0 = startHour * 60 + startMinute;
  let t1 = endHour * 60 + endMinute;
  if (t0 > t1) {
    const s = t0;
    t0 = t1;
    t1 = s;
  }
  return t >= t0 && t <= t1;
}

/** `recorded_at` の日本時間の暦日が `dateKey` と一致するか（その日の記録すべて） */
export function isRecordedAtOnJapanDate(recordedAtIso: string, dateKey: string): boolean {
  try {
    const parts = parseIsoToJapanDateTimeParts(recordedAtIso);
    return parts.dateKey === dateKey;
  } catch {
    return false;
  }
}

/** 一覧・詳細用の表示文字列（日本時間） */
export function formatRecordedAtDisplayJa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatJapanDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

export type JapanNowParts = {
  year: number;
  month: number;
  day: number;
  dateKey: string;
  hour: number;
  minute: number;
};

export function getJapanNowParts(date: Date = new Date()): JapanNowParts {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const num = (t: Intl.DateTimeFormatPart['type']) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  const year = num('year');
  const month = num('month');
  const day = num('day');
  const hour = num('hour');
  const minute = num('minute');
  const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;
  return { year, month, day, dateKey, hour, minute };
}

export function japanDateKeyFromParts(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function isValidJapanDate(y: number, m: number, d: number): boolean {
  const ms = Date.parse(`${y}-${pad2(m)}-${pad2(d)}T12:00:00+09:00`);
  if (Number.isNaN(ms)) return false;
  return formatJapanDateKey(new Date(ms)) === japanDateKeyFromParts(y, m, d);
}

export function daysInJapanMonth(year: number, month: number): number {
  for (let d = 31; d >= 28; d--) {
    if (isValidJapanDate(year, month, d)) return d;
  }
  return 28;
}

/** 月の1日の曜日（0=日 … 6=土）— JST の暦日 */
export function japanWeekdaySun0(year: number, month: number, day: number): number {
  const ms = Date.parse(`${year}-${pad2(month)}-${pad2(day)}T12:00:00+09:00`);
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(new Date(ms));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

export function parseJapanDateKey(key: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (!isValidJapanDate(year, month, day)) return null;
  return { year, month, day };
}

export function shiftJapanMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return { year: y, month: m };
}

/** 日本時間の暦日 `dateKey` の翌日（YYYY-MM-DD） */
export function addOneJapanCalendarDay(dateKey: string): string {
  const p = parseJapanDateKey(dateKey);
  if (!p) {
    throw new Error(`Invalid dateKey: ${dateKey}`);
  }
  const ms = Date.parse(`${p.year}-${pad2(p.month)}-${pad2(p.day)}T12:00:00+09:00`);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid dateKey: ${dateKey}`);
  }
  return formatJapanDateKey(new Date(ms + 24 * 60 * 60 * 1000));
}
