import { useMemo } from 'react';

import { createBathingRecordsApi } from '@/api/bathingRecords';
import { useCareRecipients } from '@/features/care-recipients';

export function useBathingRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createBathingRecordsApi({ getAccessToken }), [getAccessToken]);
}
