import { useMemo } from 'react';
import { type Href } from 'expo-router';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import type { CareBridgeColors } from '@/theme/careBridge';

/** 排泄スタックで履歴が浅いときも左に「戻る」を出す */
export function useExcretionStackBackHeader(recipientId: string | undefined, c: Pick<CareBridgeColors, 'accent'>) {
  const fallback = useMemo(
    () =>
      ({
        pathname: '/care/[recipientId]/excretion',
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
