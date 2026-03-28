export const PAD_LEFT = 54;
export const PAD_RIGHT = 10;
export const PAD_TOP = 8;
export const PAD_BOTTOM = 30;

export function defaultFormatYLabel(v: number): string {
  return String(Math.round(v));
}

function niceNumberStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1;
  const exp = Math.floor(Math.log10(rough));
  const f = rough / 10 ** exp;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * 10 ** exp;
}

/** min〜max を覆う Y 目盛り（端は minV / maxV を含む） */
export function buildYTicks(minV: number, maxV: number, tickCount: number, snapTo?: number): number[] {
  const range = maxV - minV;
  if (range <= 0) return [minV];

  const segments = Math.max(2, tickCount - 1);
  let step = range / segments;

  if (snapTo != null && snapTo > 0) {
    step = Math.max(snapTo, Math.ceil(step / snapTo) * snapTo);
  } else {
    step = niceNumberStep(step);
  }

  const ticks: number[] = [minV];
  let v = minV + step;
  while (v < maxV - 1e-6) {
    ticks.push(Math.round(v));
    v += step;
  }
  if (ticks[ticks.length - 1] !== maxV) ticks.push(maxV);

  const deduped: number[] = [];
  for (const t of ticks) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== t) deduped.push(t);
  }
  return deduped;
}

/**
 * 欠測スロットを挟んでも、有効な値同士を時系列順に直線で結ぶ。
 */
export function polylineSegmentsAcrossGaps(
  values: (number | null)[],
  xs: number[],
  yPixel: (dataValue: number) => number
): string[] {
  const idx: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v != null && Number.isFinite(v)) idx.push(i);
  }
  const out: string[] = [];
  for (let k = 0; k < idx.length - 1; k++) {
    const i = idx[k]!;
    const j = idx[k + 1]!;
    const vi = values[i]!;
    const vj = values[j]!;
    out.push(`${xs[i]},${yPixel(vi)} ${xs[j]},${yPixel(vj)}`);
  }
  return out;
}
