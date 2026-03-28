import { useMemo } from 'react';

import { createSleepRecordsApi } from '@/api/sleepRecords';
import { useCareRecipients } from '@/features/care-recipients';

export function useSleepRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createSleepRecordsApi({ getAccessToken }), [getAccessToken]);
}
