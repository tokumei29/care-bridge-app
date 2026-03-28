import type { MealRecordRecord } from '@/api/types/mealRecord';
import {
  addJapanCalendarDays,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  parseJapanDateKey,
} from '@/features/care-records/shared';
import { MEAL_SLOTS_FOR_DAILY_AMOUNT_AVG, type MealSlotForDailyAmountAvg } from '@/features/care-records/meals/mealConstants';

export type MealDayChartSlot = {
  dateKey: string;
  /** グラフの X 軸ラベル（例: 3/28） */
  xLabel: string;
  /** その日の朝食・昼食・夕食の記録件数の合計 */
  mainMealCount: number;
  /** その日の間食の記録件数 */
  snackCount: number;
  /** 間食を除く各食事の主食量の平均（0〜10）。対象記録がない日は null */
  stapleAvg: number | null;
  /** 同上・副食量 */
  sideAvg: number | null;
  /** その日の水分記録の合計（ml）。数値が1件もない日は null */
  waterTotalMl: number | null;
};

function isMealSlotForDailyAmountAvg(slot: string): slot is MealSlotForDailyAmountAvg {
  return (MEAL_SLOTS_FOR_DAILY_AMOUNT_AVG as readonly string[]).includes(slot);
}

function xLabelForJapanDateKey(dateKey: string): string {
  const p = parseJapanDateKey(dateKey);
  if (!p) return '—';
  return `${p.month}/${p.day}`;
}

/**
 * カレンダーで選んだ日本時間の1日分（`dateKey`）の集計。
 */
export function buildMealDayChartSlot(records: MealRecordRecord[], dateKey: string): MealDayChartSlot {
  const dayRecords = records.filter((r) => isRecordedAtOnJapanDate(r.recorded_at, dateKey));

  const mainMealCount = dayRecords.filter((r) => isMealSlotForDailyAmountAvg(r.meal_slot)).length;
  const snackCount = dayRecords.filter((r) => r.meal_slot === 'snack').length;

  const amountRows = dayRecords.filter((r) => isMealSlotForDailyAmountAvg(r.meal_slot));

  let stapleAvg: number | null = null;
  let sideAvg: number | null = null;
  if (amountRows.length > 0) {
    const stapleSum = amountRows.reduce((s, r) => s + r.staple_amount, 0);
    const sideSum = amountRows.reduce((s, r) => s + r.side_amount, 0);
    const n = amountRows.length;
    stapleAvg = stapleSum / n;
    sideAvg = sideSum / n;
  }

  const waterParts = dayRecords
    .map((r) => r.water_ml)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const waterTotalMl = waterParts.length === 0 ? null : waterParts.reduce((a, b) => a + b, 0);

  return {
    dateKey,
    xLabel: xLabelForJapanDateKey(dateKey),
    mainMealCount,
    snackCount,
    stapleAvg,
    sideAvg,
    waterTotalMl,
  };
}

/**
 * 日本時間の「今日」を含む直近7暦日（古い→新しい＝グラフ左→右）。
 * 各日の集計は `buildMealDayChartSlot` と同じ。
 */
export function buildMealLast7DaysChartSlots(records: MealRecordRecord[]): MealDayChartSlot[] {
  const todayKey = getJapanNowParts().dateKey;
  const slots: MealDayChartSlot[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateKey = addJapanCalendarDays(todayKey, -i);
    slots.push(buildMealDayChartSlot(records, dateKey));
  }
  return slots;
}

function finiteNumbers(...vals: (number | null | undefined)[]): number[] {
  return vals.filter((v): v is number => v != null && Number.isFinite(v));
}

/** 主食・副食の平均（0〜10）用 Y 軸 */
export function boundsForStapleSideDailyAvgChart(slots: MealDayChartSlot[]): { min: number; max: number } {
  const vals = finiteNumbers(...slots.flatMap((s) => [s.stapleAvg, s.sideAvg]));
  if (vals.length === 0) return { min: 0, max: 10 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(0.25, (hi - lo) * 0.08);
  return {
    min: Math.max(0, lo - pad),
    max: Math.min(10, hi + pad),
  };
}

/** 水分（ml）合計用 Y 軸 */
export function boundsForWaterDailyTotalChart(slots: MealDayChartSlot[]): { min: number; max: number } {
  const vals = finiteNumbers(...slots.map((s) => s.waterTotalMl));
  if (vals.length === 0) return { min: 0, max: 800 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(50, Math.ceil((hi - lo) * 0.12));
  return {
    min: Math.max(0, lo - pad),
    max: hi + pad,
  };
}

export function formatStapleSideAvgAxisLabel(v: number): string {
  return `${v.toFixed(1)}`;
}

/** 表示用の数値文字列（一覧行など） */
export function formatMealDaySummaryLine(slot: MealDayChartSlot): string {
  const staple =
    slot.stapleAvg != null && Number.isFinite(slot.stapleAvg) ? `${slot.stapleAvg.toFixed(1)}` : '—';
  const side =
    slot.sideAvg != null && Number.isFinite(slot.sideAvg) ? `${slot.sideAvg.toFixed(1)}` : '—';
  const water =
    slot.waterTotalMl != null && Number.isFinite(slot.waterTotalMl)
      ? `${Math.round(slot.waterTotalMl)} ml`
      : '—';
  return `${slot.xLabel}　朝・昼・夕 ${slot.mainMealCount}回／間食 ${slot.snackCount}回／主食平均 ${staple}／副食平均 ${side}／水分 ${water}`;
}

export type MealDaySummaryDisplayStrings = {
  stapleAvg: string;
  sideAvg: string;
  waterTotal: string;
};

export function mealDaySummaryDisplayStrings(slot: MealDayChartSlot): MealDaySummaryDisplayStrings {
  return {
    stapleAvg:
      slot.stapleAvg != null && Number.isFinite(slot.stapleAvg) ? slot.stapleAvg.toFixed(1) : '—',
    sideAvg: slot.sideAvg != null && Number.isFinite(slot.sideAvg) ? slot.sideAvg.toFixed(1) : '—',
    waterTotal:
      slot.waterTotalMl != null && Number.isFinite(slot.waterTotalMl)
        ? `${Math.round(slot.waterTotalMl)} ml`
        : '—',
  };
}
