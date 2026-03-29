import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import type { RecordSavedCheerMode } from '@/features/care-records/components/RecordSavedCheerModal';

/**
 * 記録保存成功後のチアモーダル表示と、閉じたあとの `router.back()` をまとめる。
 */
export function useRecordSavedCheer() {
  const router = useRouter();
  const [state, setState] = useState<{ visible: boolean; mode: RecordSavedCheerMode }>({
    visible: false,
    mode: 'create',
  });

  const showCheer = useCallback((mode: RecordSavedCheerMode) => {
    setState({ visible: true, mode });
  }, []);

  const dismissCheer = useCallback(() => {
    setState((p) => ({ ...p, visible: false }));
    router.back();
  }, [router]);

  return {
    cheerVisible: state.visible,
    cheerMode: state.mode,
    showCheer,
    dismissCheer,
  };
}
