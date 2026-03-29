const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 端末ローカル暦の日付を API 用 `YYYY-MM-DD` に（タイムゾーンずれを避けるため日単位のみ）。 */
export function localCalendarDateToIso(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** ピッカー初期値用。未設定・不正なら「今日」（正午ローカル、DST 回避）。 */
export function isoToLocalCalendarDate(iso: string | null): Date {
  if (!iso) {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0);
  }
  const m = iso.match(ISO_DATE);
  if (!m) {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d, 12, 0, 0, 0);
}

/**
 * 次の入所日（任意）。空欄は null。`YYYY-MM-DD` のみ許可。
 */
export function parseNextAdmissionOnInput(raw: string): { ok: true; value: string | null } | { ok: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };

  const m = t.match(ISO_DATE);
  if (!m) {
    return {
      ok: false,
      message: '日付は YYYY-MM-DD（例: 2026-05-01）の形式で入力するか、空欄にしてください。',
    };
  }

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return { ok: false, message: '存在しない日付です。' };
  }

  return { ok: true, value: t };
}

export function formatNextAdmissionJa(isoDate: string): string {
  const m = isoDate.match(ISO_DATE);
  if (!m) return isoDate;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return `${y}年${mo}月${d}日`;
}

/** ローカル暦の「今日」から見た、入所予定日までの日数。当日 0・明日 1。過去は負。不正なら null。 */
export function calendarDaysUntilIsoDate(iso: string): number | null {
  const m = iso.match(ISO_DATE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const admissionStart = new Date(y, mo - 1, d);
  return Math.round((admissionStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
}

/** 入所リマインドを出す「あと N 日以内」か（当日〜5 日前まで：5・4・3・2・1 日前と当日） */
export const ADMISSION_SOON_MAX_DAYS = 5;

export function isAdmissionWithinSoonWindow(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= ADMISSION_SOON_MAX_DAYS;
}
