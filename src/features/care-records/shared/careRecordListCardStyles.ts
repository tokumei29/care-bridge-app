import type { TextStyle } from 'react-native';

/** 一覧カードの日時行（補助） */
export const careRecordListCardDateTextStyle: TextStyle = {
  fontSize: 13,
  fontWeight: '700',
  lineHeight: 18,
};

/** 一覧カードの主情報（食事量・排泄・バイタル・メモの要など） */
export function careRecordListCardSummaryTextStyle(isTablet: boolean): TextStyle {
  return {
    fontSize: isTablet ? 18 : 17,
    fontWeight: '800',
    lineHeight: isTablet ? 26 : 24,
    marginTop: 8,
  };
}

/** 主情報に続くメモなど */
export function careRecordListCardMemoTextStyle(isTablet: boolean): TextStyle {
  return {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    lineHeight: isTablet ? 22 : 20,
    marginTop: 10,
  };
}
