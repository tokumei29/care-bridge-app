import { useMemo } from 'react';

import { createOtherNotesApi } from '@/api/otherNotes';
import { useCareRecipients } from '@/features/care-recipients';

export function useOtherNotesApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createOtherNotesApi({ getAccessToken }), [getAccessToken]);
}
