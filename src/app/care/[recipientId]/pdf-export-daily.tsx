import { useLocalSearchParams } from 'expo-router';

import { PdfExportScreen } from '@/features/care-records/pdf/PdfExportScreen';

/** 日単位PDF（最大14日）。月単位は `pdf-export.tsx` */
export default function PdfExportDailyRoute() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  if (!recipientId) {
    return null;
  }
  return <PdfExportScreen recipientId={recipientId} exportMode="day" />;
}
