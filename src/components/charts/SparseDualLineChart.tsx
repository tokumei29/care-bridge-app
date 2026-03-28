import React, { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import {
  buildYTicks,
  defaultFormatYLabel,
  PAD_BOTTOM,
  PAD_LEFT,
  PAD_RIGHT,
  PAD_TOP,
  polylineSegmentsAcrossGaps,
} from '@/components/charts/chartLayoutUtils';

export type SparseDualLineChartPoint = {
  xLabel: string;
  valueA: number | null;
  valueB: number | null;
};

export type SparseDualLineChartProps = {
  points: SparseDualLineChartPoint[];
  width: number;
  height: number;
  lineColorA: string;
  lineColorB: string;
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
 * 欠測のある 2 系列（最高血圧・最低血圧など）。中間スロットが欠測でも有効点同士を結ぶ。
 */
export function SparseDualLineChart({
  points,
  width,
  height,
  lineColorA,
  lineColorB,
  gridColor,
  axisLabelColor,
  minValue: minV,
  maxValue: maxV,
  formatYLabel = defaultFormatYLabel,
  yTickCount = 6,
  yTickSnap,
  emptyLabel = 'この期間に数値がありません',
}: SparseDualLineChartProps) {
  const plotClipId = useId().replace(/\W/g, '_');

  const hasAny = useMemo(() => {
    for (const p of points) {
      if (p.valueA != null && Number.isFinite(p.valueA)) return true;
      if (p.valueB != null && Number.isFinite(p.valueB)) return true;
    }
    return false;
  }, [points]);

  const layout = useMemo(() => {
    const plotW = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
    const plotH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);
    const n = points.length;

    if (n === 0) {
      return { plotW, plotH, xs: [] as number[], yAt: (_v: number) => PAD_TOP };
    }

    const range = Math.max(1e-6, maxV - minV);
    const xAt = (i: number) => {
      if (n <= 1) return PAD_LEFT + plotW / 2;
      return PAD_LEFT + (i / (n - 1)) * plotW;
    };
    const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;
    const xs = points.map((_, i) => xAt(i));

    return { plotW, plotH, xs, yAt };
  }, [height, maxV, minV, points, width]);

  const yTicks = useMemo(() => {
    if (points.length === 0) return [] as number[];
    return buildYTicks(minV, maxV, yTickCount, yTickSnap);
  }, [maxV, minV, points.length, yTickCount, yTickSnap]);

  const segmentsA = useMemo(() => {
    if (points.length === 0) return [] as string[];
    const { xs, yAt } = layout;
    const vals = points.map((p) => p.valueA);
    return polylineSegmentsAcrossGaps(vals, xs, (v) => yAt(v));
  }, [layout, points]);

  const segmentsB = useMemo(() => {
    if (points.length === 0) return [] as string[];
    const { xs, yAt } = layout;
    const vals = points.map((p) => p.valueB);
    return polylineSegmentsAcrossGaps(vals, xs, (v) => yAt(v));
  }, [layout, points]);

  if (points.length === 0) {
    return (
      <View style={[styles.emptyBox, { width, height, minHeight: height }]}>
        <Text style={[styles.emptyText, { color: axisLabelColor }]}>データがありません</Text>
      </View>
    );
  }

  if (!hasAny) {
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
          {segmentsA.map((pts, idx) => (
            <Polyline
              key={`sa-${idx}`}
              points={pts}
              fill="none"
              stroke={lineColorA}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {segmentsB.map((pts, idx) => (
            <Polyline
              key={`sb-${idx}`}
              points={pts}
              fill="none"
              stroke={lineColorB}
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {points.map((p, i) => (
            <React.Fragment key={`pt-${i}`}>
              {p.valueA != null && Number.isFinite(p.valueA) ? (
                <Circle
                  cx={xs[i]}
                  cy={yAt(p.valueA)}
                  r={4}
                  fill={lineColorA}
                  stroke={lineColorA}
                />
              ) : null}
              {p.valueB != null && Number.isFinite(p.valueB) ? (
                <Circle
                  cx={xs[i]}
                  cy={yAt(p.valueB)}
                  r={4}
                  fill={lineColorB}
                  stroke={lineColorB}
                />
              ) : null}
            </React.Fragment>
          ))}
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
