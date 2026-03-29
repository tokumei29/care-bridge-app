const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 被介護者登録から24時間以内か（介護記録トップの「はじめの案内」バナー用）。
 * `created_at` は API の ISO 文字列を想定。
 */
export function isWithin24HoursOfRecipientCreatedAt(createdAtIso: string): boolean {
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (now < t) return false;
  return now - t <= DAY_MS;
}

/**
 * 登録から24時間超〜48時間以内（「2日目」案内バナー用）。1日目バナーと排他。
 */
export function isWithinSecond24HoursOfRecipientCreatedAt(createdAtIso: string): boolean {
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (now < t) return false;
  const age = now - t;
  return age > DAY_MS && age <= 2 * DAY_MS;
}

/**
 * 登録から48時間超〜72時間以内（「3日目」PDF 案内バナー用）。1日目・2日目と排他。
 */
export function isWithinThird24HoursOfRecipientCreatedAt(createdAtIso: string): boolean {
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (now < t) return false;
  const age = now - t;
  return age > 2 * DAY_MS && age <= 3 * DAY_MS;
}
