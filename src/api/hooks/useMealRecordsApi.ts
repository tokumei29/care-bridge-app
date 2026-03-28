import { useMemo } from 'react';

import { createMealRecordsApi } from '@/api/mealRecords';
import { useCareRecipients } from '@/features/care-recipients';

/** `CareRecipientsProvider` が保持するセッション（onAuthStateChange）で認証する meal_records クライアント */
export function useMealRecordsApi() {
  const { getAccessToken } = useCareRecipients();
  return useMemo(() => createMealRecordsApi({ getAccessToken }), [getAccessToken]);
}
