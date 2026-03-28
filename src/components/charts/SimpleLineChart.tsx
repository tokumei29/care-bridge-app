import React, { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import {
  buildYTicks,
  defaultFormatYLabel,
  PAD_BOTTOM,
  PAD_LEFT,
  PAD_RIGHT,
  PAD_TOP,
} from '@/components/charts/chartLayoutUtils';

export type SimpleLineChartPoint = {
  value: number;
  xLabel: string;
};

export type SimpleLineChartProps = {
  points: SimpleLineChartPoint[];
  width: number;
  height: number;
  lineColor: string;
  gridColor: string;
  axisLabelColor: string;
  /** 折れ線下の塗り（半透明推奨） */
  fillUnderColor?: string;
  minValue?: number;
  maxValue?: number;
  formatYLabel?: (v: number) => string;
  emptyLabel?: string;
  /**
   * Y 軸の目盛りのおおよその本数（端点含む）。多いほど横線・左ラベルが増える。
   * @default 6
   */
  yTickCount?: number;
  /**
   * 指定時、目盛り間隔をこの値の倍数に切り上げる（例: 睡眠グラフで 60＝1時間単位）。
   */
  yTickSnap?: number;
};

/**
 * 汎用の単系列折れ線グラフ（他画面でも再利用可）。
 * `points` は左から右へ X 軸順に並べる。
 */
export function SimpleLineChart({
  points,
  width,
  height,
  lineColor,
  gridColor,
  axisLabelColor,
  fillUnderColor,
  minValue,
  maxValue,
  formatYLabel = defaultFormatYLabel,
  emptyLabel = 'データがありません',
  yTickCount = 6,
  yTickSnap,
}: SimpleLineChartProps) {
  const plotClipId = useId().replace(/\W/g, '_');

  const layout = useMemo(() => {
    const plotW = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
    const plotH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);
    const n = points.length;

    if (n === 0) {
      return { plotW, plotH, maxV: 1, minV: 0, range: 1, xs: [] as number[], ys: [] as number[] };
    }

    const minV = minValue ?? 0;
    const dataMax = points.reduce((a, p) => Math.max(a, p.value), 0);
    const computedMax =
      maxValue ??
      Math.max(60, Math.ceil(Math.max(dataMax * 1.12, minV + 60) / 60) * 60);
    const maxV = Math.max(computedMax, minV + 1);
    const range = maxV - minV;

    const xAt = (i: number) => {
      if (n <= 1) return PAD_LEFT + plotW / 2;
      return PAD_LEFT + (i / (n - 1)) * plotW;
    };
    const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;

    const xs = points.map((_, i) => xAt(i));
    const ys = points.map((p) => yAt(p.value));

    return { plotW, plotH, maxV, minV, range, xs, ys };
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

  const { plotW, plotH, maxV, minV, range, xs, ys } = layout;

  const yAt = (v: number) => PAD_TOP + plotH - ((v - minV) / range) * plotH;
  const yAxisLabelSize = yTicks.length > 7 ? 10 : 11;

  const linePointsStr = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const bottomY = PAD_TOP + plotH;
  const fillPointsStr =
    xs.length > 0
      ? `${xs[0]},${bottomY} ${linePointsStr} ${xs[xs.length - 1]},${bottomY}`
      : '';

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
          {fillUnderColor && fillPointsStr ? (
            <Polygon points={fillPointsStr} fill={fillUnderColor} />
          ) : null}
          <Polyline
            points={linePointsStr}
            fill="none"
            stroke={lineColor}
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
