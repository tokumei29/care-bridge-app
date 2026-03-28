import { useMemo } from 'react';
import { type Href } from 'expo-router';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import type { CareBridgeColors } from '@/theme/careBridge';

export function useImageMemosStackBackHeader(recipientId: string | undefined, c: Pick<CareBridgeColors, 'accent'>) {
  const fallback = useMemo(
    () =>
      ({
        pathname: '/care/[recipientId]/image-memos',
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
