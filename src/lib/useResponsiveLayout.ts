import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Compact tablet / large phone landscape */
export const TABLET_MIN_WIDTH = 600;
/** iPad landscape, large tablets */
export const WIDE_TABLET_MIN_WIDTH = 900;

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
    const columnCount = isWideTablet ? 3 : isTablet ? 2 : 1;
    const gap = isTablet ? 20 : 14;
    const available = width - horizontalGutter * 2;
    const railInnerWidth = Math.min(contentMaxWidth, available);
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
