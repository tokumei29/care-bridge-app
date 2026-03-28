import React, { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import {
  buildYTicks,
  defaultFormatYLabel,
  PAD_BOTTOM,
  PAD_LEFT,
  PAD_RIGHT,
  PAD_TOP,
} from '@/components/charts/chartLayoutUtils';

export type DualLineChartPoint = {
  xLabel: string;
  valueA: number;
  valueB: number;
};

export type DualLineChartProps = {
  points: DualLineChartPoint[];
  width: number;
  height: number;
  lineColorA: string;
  lineColorB: string;
  gridColor: string;
  axisLabelColor: string;
  minValue?: number;
  maxValue?: number;
  formatYLabel?: (v: number) => string;
  emptyLabel?: string;
  yTickCount?: number;
  yTickSnap?: number;
};

/**
 * 同じ X 軸に 2 系列の折れ線（排尿・排便の回数など）。
 */
export function DualLineChart({
  points,
  width,
  height,
  lineColorA,
  lineColorB,
  gridColor,
  axisLabelColor,
  minValue,
  maxValue,
  formatYLabel = defaultFormatYLabel,
  emptyLabel = 'データがありません',
  yTickCount = 6,
  yTickSnap,
}: DualLineChartProps) {
  const plotClipId = useId().replace(/\W/g, '_');

  const layout = useMemo(() => {
    const plotW = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
    const plotH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);
    const n = points.length;

    if (n === 0) {
      return {
        plotW,
        plotH,
        maxV: 1,
        minV: 0,
        range: 1,
        xs: [] as number[],
        ysA: [] as number[],
        ysB: [] as number[],
      };
    }

    const minV = minValue ?? 0;
    const dataMax = points.reduce((a, p) => Math.max(a, p.valueA, p.valueB), 0);
    const computedMax =
      maxValue ??
      Math.max(4, Math.ceil(Math.max(dataMax * 1.12, minV + 1)));
    const maxV = Math.max(computedMax, minV + 1);
    const range = maxV - minV;

    const xAt = (i: number) => {
      if (n <= 1) return PAD_LEFT + plotW / 2;
      return PAD_LEFT + (i / (n - 1)) * plotW;
    };
    const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;

    const xs = points.map((_, i) => xAt(i));
    const ysA = points.map((p) => yAt(p.valueA));
    const ysB = points.map((p) => yAt(p.valueB));

    return { plotW, plotH, maxV, minV, range, xs, ysA, ysB };
  }, [height, maxValue, minValue, points, width]);

  const yTicks = useMemo(() => {
    if (points.length === 0) return [] as number[];
    const { maxV, minV } = layout;
    return buildYTicks(minV, maxV, yTickCount, yTickSnap);
  }, [layout, points.length, yTickCount, yTickSnap]);

  if (points.length === 0) {
    return (
      <View style={[styles.emptyBox, { width, height, minHeight: height }]}>
        <Text style={[styles.emptyText, { color: axisLabelColor }]}>{emptyLabel}</Text>
      </View>
    );
  }

  const { plotW, plotH, maxV, minV, range, xs, ysA, ysB } = layout;

  const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;
  const yAxisLabelSize = yTicks.length > 7 ? 10 : 11;

  const lineStrA = xs.map((x, i) => `${x},${ysA[i]}`).join(' ');
  const lineStrB = xs.map((x, i) => `${x},${ysB[i]}`).join(' ');

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
          <Polyline
            points={lineStrA}
            fill="none"
            stroke={lineColorA}
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polyline
            points={lineStrB}
            fill="none"
            stroke={lineColorB}
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
            fontSize={10}
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
