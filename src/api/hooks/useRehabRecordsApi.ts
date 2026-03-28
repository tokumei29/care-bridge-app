import { useMemo } from 'react';

import { createRehabRecordsApi } from '@/api/rehabRecords';
import { useCareRecipients } from '@/features/care-recipients';

export function useRehabRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createRehabRecordsApi({ getAccessToken }), [getAccessToken]);
}
