import type { VitalRecordRecord } from '@/api/types/vitalRecord';
import { pad2, parseIsoToJapanDateTimeParts } from '@/features/care-records/shared';

export type VitalLast7ChartSlot = {
  xLabel: string;
  recordedAt: string;
  body_temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse_rate: number | null;
  spo2: number | null;
};

/**
 * `recorded_at` が新しい順の一覧から、直近 7 件を古い順（グラフ左→右）に並べ替えたスロット。
 * 件数が 7 未満のときはその件数分だけ。
 */
export function buildVitalLast7ChartSlots(records: VitalRecordRecord[]): VitalLast7ChartSlot[] {
  const sorted = [...records].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );
  const slice = sorted.slice(0, 7).reverse();

  return slice.map((r) => {
    let xLabel = '—';
    try {
      const p = parseIsoToJapanDateTimeParts(r.recorded_at);
      const [, mo, day] = p.dateKey.split('-');
      const moNum = parseInt(mo ?? '0', 10);
      const dNum = parseInt(day ?? '0', 10);
      xLabel = `${moNum}/${dNum} ${pad2(p.hour)}:${pad2(p.minute)}`;
    } catch {
      xLabel = '—';
    }
    return {
      xLabel,
      recordedAt: r.recorded_at,
      body_temperature: r.body_temperature,
      blood_pressure_systolic: r.blood_pressure_systolic,
      blood_pressure_diastolic: r.blood_pressure_diastolic,
      pulse_rate: r.pulse_rate,
      spo2: r.spo2,
    };
  });
}

function finiteNumbers(...vals: (number | null | undefined)[]): number[] {
  return vals.filter((v): v is number => v != null && Number.isFinite(v));
}

/** 体温グラフの Y 軸（℃） */
export function boundsForBodyTemperatureChart(slots: VitalLast7ChartSlot[]): { min: number; max: number } {
  const vals = finiteNumbers(...slots.map((s) => s.body_temperature));
  if (vals.length === 0) return { min: 35, max: 38 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (lo === hi) return { min: lo - 0.3, max: hi + 0.3 };
  const pad = 0.25;
  const min = Math.floor((lo - pad) * 10) / 10;
  const max = Math.ceil((hi + pad) * 10) / 10;
  return { min, max };
}

/** 整数メトリクス用（脈拍・SpO₂ など） */
export function boundsForIntegerChart(
  slots: VitalLast7ChartSlot[],
  pick: (s: VitalLast7ChartSlot) => number | null,
  options?: { defaultMax?: number; minFloor?: number; maxCeil?: number }
): { min: number; max: number } {
  const vals = finiteNumbers(...slots.map(pick));
  const defMax = options?.defaultMax ?? 10;
  const minFloor = options?.minFloor;
  const maxCeil = options?.maxCeil;
  if (vals.length === 0) return { min: 0, max: defMax };
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (minFloor != null) lo = Math.min(lo, minFloor);
  if (maxCeil != null) hi = Math.max(hi, maxCeil);
  const pad = Math.max(1, Math.ceil((hi - lo) * 0.12));
  return {
    min: Math.max(0, lo - pad),
    max: hi + pad,
  };
}

/** 血圧（最高・最低 mmHg）共通 Y 軸 */
export function boundsForBloodPressureChart(slots: VitalLast7ChartSlot[]): { min: number; max: number } {
  const vals = finiteNumbers(
    ...slots.flatMap((s) => [s.blood_pressure_systolic, s.blood_pressure_diastolic])
  );
  if (vals.length === 0) return { min: 60, max: 160 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(5, Math.ceil((hi - lo) * 0.1));
  return {
    min: Math.max(40, lo - pad),
    max: hi + pad,
  };
}

export function formatTempAxisLabel(v: number): string {
  return `${v.toFixed(1)}`;
}
