import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { isApiError } from '@/api/errors';
import { useBathingRecordsApi } from '@/api/hooks/useBathingRecordsApi';
import { useExcretionRecordsApi } from '@/api/hooks/useExcretionRecordsApi';
import { useImageMemosApi } from '@/api/hooks/useImageMemosApi';
import { useMealRecordsApi } from '@/api/hooks/useMealRecordsApi';
import { useOtherNotesApi } from '@/api/hooks/useOtherNotesApi';
import { useRehabRecordsApi } from '@/api/hooks/useRehabRecordsApi';
import { useSleepRecordsApi } from '@/api/hooks/useSleepRecordsApi';
import { useVitalRecordsApi } from '@/api/hooks/useVitalRecordsApi';
import { useCareRecipients } from '@/features/care-recipients';
import { collectCareRecordDayKeys } from '@/features/care-records/pdf/dayKeyUtils';

export function usePdfExportDayKeys(recipientId: string | undefined) {
  const { isSignedIn } = useCareRecipients();
  const mealApi = useMealRecordsApi();
  const excretionApi = useExcretionRecordsApi();
  const vitalApi = useVitalRecordsApi();
  const bathingApi = useBathingRecordsApi();
  const rehabApi = useRehabRecordsApi();
  const sleepApi = useSleepRecordsApi();
  const imageMemosApi = useImageMemosApi();
  const otherNotesApi = useOtherNotesApi();

  const [dayKeys, setDayKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!recipientId || !isSignedIn) {
      setDayKeys([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const empty = async <T,>(p: Promise<T>): Promise<T> => {
      try {
        return await p;
      } catch (e) {
        if (isApiError(e) && (e.status === 401 || e.status === 403)) throw e;
        return [] as T;
      }
    };

    try {
      const [
        meals,
        excretion,
        vitals,
        bathing,
        rehab,
        sleep,
        imageMemos,
        otherNotes,
      ] = await Promise.all([
        empty(mealApi.list(recipientId)),
        empty(excretionApi.list(recipientId)),
        empty(vitalApi.list(recipientId)),
        empty(bathingApi.list(recipientId)),
        empty(rehabApi.list(recipientId)),
        empty(sleepApi.list(recipientId)),
        empty(imageMemosApi.list(recipientId)),
        empty(otherNotesApi.list(recipientId)),
      ]);

      const keys = collectCareRecordDayKeys({
        withRecordedAt: [meals, excretion, vitals, bathing, imageMemos, otherNotes],
        sleep,
        rehab,
      });
      setDayKeys(keys);
    } catch (e) {
      setDayKeys([]);
      setError(isApiError(e) ? e.message : '記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [
    recipientId,
    isSignedIn,
    mealApi,
    excretionApi,
    vitalApi,
    bathingApi,
    rehabApi,
    sleepApi,
    imageMemosApi,
    otherNotesApi,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { dayKeys, loading, error, refresh };
}
