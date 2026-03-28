import { useMemo } from 'react';
import { type Href } from 'expo-router';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import type { CareBridgeColors } from '@/theme/careBridge';

/**
 * 食事スタックで履歴が浅いと iOS で標準の戻るが出ないことがあるため、常に左に「戻る」を出す。
 */
export function useMealStackBackHeader(recipientId: string | undefined, c: Pick<CareBridgeColors, 'accent'>) {
  const fallback = useMemo(
    () =>
      ({
        pathname: '/care/[recipientId]/meals',
        params: { recipientId: recipientId ?? '' },
      }) as Href,
    [recipientId]
  );

  useExplicitStackBackHeader({
    fallback,
    tintColor: c.accent,
    enabled: Boolean(recipientId),
  });
}
