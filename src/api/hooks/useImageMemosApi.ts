import { useMemo } from 'react';

import { createImageMemosApi } from '@/api/imageMemos';
import { useCareRecipients } from '@/features/care-recipients';

export function useImageMemosApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createImageMemosApi({ getAccessToken }), [getAccessToken]);
}
