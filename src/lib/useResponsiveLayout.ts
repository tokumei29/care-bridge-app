import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Compact tablet / large phone landscape */
export const TABLET_MIN_WIDTH = 600;
/** iPad landscape, large tablets（レール幅・「大きい端末」判定） */
export const WIDE_TABLET_MIN_WIDTH = 900;
/**
 * スマホの「横長」で 3 列にするときの幅の下限（iPad は短辺判定で常に 3 列）。
 * 640 未満だと 1 列あたりが極端に狭くなるため、667pt 幅の端末も含めて少し下げる。
 */
const THREE_COLUMN_MIN_WINDOW_WIDTH = 640;

export type ResponsiveLayout = {
  width: number;
  height: number;
  isTablet: boolean;
  isWideTablet: boolean;
  /** Max width for centered content rail */
  contentMaxWidth: number;
  horizontalGutter: number;
  columnCount: number;
  gap: number;
  /** Pixel width available inside the content rail (after gutters) */
  railInnerWidth: number;
  /** Width of one card/cell in a multi-column grid */
  gridItemWidth: number;
  fontScale: number;
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_MIN_WIDTH;
    const isWideTablet = width >= WIDE_TABLET_MIN_WIDTH;
    const contentMaxWidth = isWideTablet ? 1040 : isTablet ? 840 : width;
    const horizontalGutter = isTablet ? 40 : 20;
    const majorAxis = Math.max(width, height);
    const minorAxis = Math.min(width, height);
    /**
     * 向きで width が変わるため width>=600 だけでは iPad が取りこぼす。
     * 短辺がタブレット幅なら iPad クラスとみなし、グリッドは常に 3 列にする。
     */
    const isTabletSizedDevice = minorAxis >= TABLET_MIN_WIDTH;
    const useThreeColumns = isTabletSizedDevice
      ? true
      : isTablet &&
        (majorAxis >= WIDE_TABLET_MIN_WIDTH || width >= THREE_COLUMN_MIN_WINDOW_WIDTH);
    const columnCount = useThreeColumns ? 3 : isTablet ? 2 : 1;
    const gap = isTablet ? 20 : 14;
    /** ContentRail は maxWidth で外側が決まり、子の幅はさらに左右 padding を引いた値 */
    const outerRailWidth = Math.min(contentMaxWidth, width);
    const railInnerWidth = Math.max(1, outerRailWidth - horizontalGutter * 2);
    const gridItemWidth =
      columnCount > 1
        ? (railInnerWidth - gap * (columnCount - 1)) / columnCount
        : railInnerWidth;

    return {
      width,
      height,
      isTablet,
      isWideTablet,
      contentMaxWidth,
      horizontalGutter,
      columnCount,
      gap,
      railInnerWidth,
      gridItemWidth,
      fontScale,
    };
  }, [fontScale, height, width]);
}
