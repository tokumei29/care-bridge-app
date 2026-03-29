/**
 * PDF エクスポート経路の切り分け用。本番ビルドでは no-op。
 */
export function careRecordPdfDebugLog(message: string, extra?: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (extra !== undefined) {
    console.log('[CareRecordPdf]', message, extra);
  } else {
    console.log('[CareRecordPdf]', message);
  }
}
