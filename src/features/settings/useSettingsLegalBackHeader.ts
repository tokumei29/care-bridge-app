import type { Href } from 'expo-router';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';

const SETTINGS_TAB_HREF = '/(tabs)/two' as Href;

/**
 * 設定タブから開いた法令・ポリシー画面で、ヘッダー左に「‹ 戻る」を必ず出す。
 */
export function useSettingsLegalBackHeader(tintColor: string) {
  useExplicitStackBackHeader({
    fallback: SETTINGS_TAB_HREF,
    tintColor,
    enabled: true,
  });
}
