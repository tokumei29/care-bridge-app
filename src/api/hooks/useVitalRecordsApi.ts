import { useMemo } from 'react';

import { createVitalRecordsApi } from '@/api/vitalRecords';
import { useCareRecipients } from '@/features/care-recipients';

export function useVitalRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createVitalRecordsApi({ getAccessToken }), [getAccessToken]);
}
