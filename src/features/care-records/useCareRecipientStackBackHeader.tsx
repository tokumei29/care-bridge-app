import { useMemo } from 'react';
import { type Href } from 'expo-router';

import { useExplicitStackBackHeader } from '@/features/care-records/useExplicitStackBackHeader';
import type { CareBridgeColors } from '@/theme/careBridge';

/**
 * 介護記録まわりで、親スタックに履歴がなくても左に「‹ 戻る」を出す。
 * 戻り先は被介護者トップ（`recipientId` が無いときはアプリの `/`）。
 */
export function useCareRecipientStackBackHeader(
  recipientId: string | undefined,
  c: Pick<CareBridgeColors, 'accent'>
) {
  const fallback = useMemo(
    () =>
      (recipientId
        ? ({
            pathname: '/care/[recipientId]',
            params: { recipientId },
          } as Href)
        : ('/' as Href)),
    [recipientId]
  );

  useExplicitStackBackHeader({ fallback, tintColor: c.accent, enabled: true });
}
