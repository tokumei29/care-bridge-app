import { useMemo } from 'react';

import { createCareRecipientsApi } from '@/api/careRecipients';
import { useCareRecipients } from '@/features/care-recipients';

/** `CareRecipientsProvider` が保持するセッションで認証する care_recipients クライアント */
export function useCareRecipientsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createCareRecipientsApi({ getAccessToken }), [getAccessToken]);
}
