import React, { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import {
  SPARSE_CHART_GAP_STROKE_DASHARRAY,
  buildSparseLineSegmentsAcrossGaps,
  buildYTicks,
  defaultFormatYLabel,
  PAD_BOTTOM,
  PAD_LEFT,
  PAD_RIGHT,
  PAD_TOP,
} from '@/components/charts/chartLayoutUtils';

export type SparseLineChartPoint = {
  xLabel: string;
  value: number | null;
};

export type SparseLineChartProps = {
  points: SparseLineChartPoint[];
  width: number;
  height: number;
  lineColor: string;
  gridColor: string;
  axisLabelColor: string;
  minValue: number;
  maxValue: number;
  formatYLabel?: (v: number) => string;
  yTickCount?: number;
  yTickSnap?: number;
  emptyLabel?: string;
};

/**
 * 各 X に値が無い場合もある折れ線。中間スロットが欠測でも、前後に値があればその間を結ぶ。
 * 隣接以外をまたぐ区間は点線（記録のないスロットを飛ばしていることを示す）。
 */
export function SparseLineChart({
  points,
  width,
  height,
  lineColor,
  gridColor,
  axisLabelColor,
  minValue: minV,
  maxValue: maxV,
  formatYLabel = defaultFormatYLabel,
  yTickCount = 6,
  yTickSnap,
  emptyLabel = 'この期間に数値がありません',
}: SparseLineChartProps) {
  const plotClipId = useId().replace(/\W/g, '_');

  const finiteValues = useMemo(
    () => points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v)),
    [points]
  );

  const layout = useMemo(() => {
    const plotW = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
    const plotH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);
    const n = points.length;

    if (n === 0) {
      return { plotW, plotH, range: 1, xs: [] as number[], yAt: (_v: number) => PAD_TOP };
    }

    const range = Math.max(1e-6, maxV - minV);
    const xAt = (i: number) => {
      if (n <= 1) return PAD_LEFT + plotW / 2;
      return PAD_LEFT + (i / (n - 1)) * plotW;
    };
    const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;
    const xs = points.map((_, i) => xAt(i));

    return { plotW, plotH, range, xs, yAt };
  }, [height, maxV, minV, points, width]);

  const yTicks = useMemo(() => {
    if (points.length === 0) return [] as number[];
    return buildYTicks(minV, maxV, yTickCount, yTickSnap);
  }, [maxV, minV, points.length, yTickCount, yTickSnap]);

  const lineSegments = useMemo(() => {
    if (points.length === 0) return [] as ReturnType<typeof buildSparseLineSegmentsAcrossGaps>;
    const { xs, yAt } = layout;
    const vals = points.map((p) => p.value);
    return buildSparseLineSegmentsAcrossGaps(vals, xs, (v) => yAt(v));
  }, [layout, points]);

  const markerIndices = useMemo(() => {
    const idx: number[] = [];
    points.forEach((p, i) => {
      if (p.value != null && Number.isFinite(p.value)) idx.push(i);
    });
    return idx;
  }, [points]);

  if (points.length === 0) {
    return (
      <View style={[styles.emptyBox, { width, height, minHeight: height }]}>
        <Text style={[styles.emptyText, { color: axisLabelColor }]}>データがありません</Text>
      </View>
    );
  }

  if (finiteValues.length === 0) {
    return (
      <View style={[styles.emptyBox, { width, height, minHeight: height }]}>
        <Text style={[styles.emptyText, { color: axisLabelColor }]}>{emptyLabel}</Text>
      </View>
    );
  }

  const { plotW, plotH, xs, yAt } = layout;
  const yAxisLabelSize = yTicks.length > 7 ? 10 : 11;

  return (
    <View style={{ width, overflow: 'hidden' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id={plotClipId}>
            <Rect x={PAD_LEFT} y={PAD_TOP} width={plotW} height={plotH} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${plotClipId})`}>
          {yTicks.map((tickV, idx) => {
            const gy = yAt(tickV);
            return (
              <Line
                key={`g-${tickV}-${idx}`}
                x1={PAD_LEFT}
                y1={gy}
                x2={PAD_LEFT + plotW}
                y2={gy}
                stroke={gridColor}
                strokeWidth={StyleSheet.hairlineWidth}
              />
            );
          })}
          {lineSegments.map((seg, idx) => (
            <Polyline
              key={`seg-${idx}`}
              points={seg.points}
              fill="none"
              stroke={lineColor}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={seg.bridgesSkippedSlots ? SPARSE_CHART_GAP_STROKE_DASHARRAY : undefined}
            />
          ))}
          {markerIndices.map((i) => {
            const v = points[i]?.value;
            if (v == null) return null;
            return (
              <Circle
                key={`m-${i}`}
                cx={xs[i]}
                cy={yAt(v)}
                r={4}
                fill={lineColor}
                stroke={lineColor}
              />
            );
          })}
        </G>
        {yTicks.map((tickV, idx) => (
          <SvgText
            key={`yl-${tickV}-${idx}`}
            x={PAD_LEFT - 6}
            y={yAt(tickV) + 4}
            fontSize={yAxisLabelSize}
            fontWeight="600"
            fill={axisLabelColor}
            textAnchor="end">
            {formatYLabel(tickV)}
          </SvgText>
        ))}
        {points.map((p, i) => (
          <SvgText
            key={`xl-${p.xLabel}-${i}`}
            x={xs[i]}
            y={height - 8}
            fontSize={9}
            fontWeight="600"
            fill={axisLabelColor}
            textAnchor="middle">
            {p.xLabel}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
