import { useMemo } from 'react';

import { createExcretionRecordsApi } from '@/api/excretionRecords';
import { useCareRecipients } from '@/features/care-recipients';

export function useExcretionRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createExcretionRecordsApi({ getAccessToken }), [getAccessToken]);
}
