import * as Device from 'expo-device';
import { Directory, File, Paths } from 'expo-file-system';
import {
  cacheDirectory,
  EncodingType,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

import { careRecordPdfDebugLog } from '@/api/careRecordPdfDebugLog';
import { arrayBufferToBase64 } from '@/api/httpPdf';

export function sanitizePdfFilename(filename: string): string {
  return filename.replace(/[/\\?%*:|"<>]/g, '_');
}

function buildCachePdfFile(safeName: string): File {
  const unique = `pdf-export-${Date.now()}-${safeName}`;
  return new File(Paths.cache, unique);
}

/**
 * メール添付・共有シート用にキャッシュへ書き、file URI を返す（ネイティブのみ）。
 */
export async function writePdfToCacheForShare(arrayBuffer: ArrayBuffer, safeName: string): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('writePdfToCacheForShare is not for web');
  }
  try {
    const file = buildCachePdfFile(safeName);
    file.create({ overwrite: true });
    file.write(new Uint8Array(arrayBuffer));
    careRecordPdfDebugLog('writePdfToCacheForShare (new File API)', {
      bytes: arrayBuffer.byteLength,
      uriPrefix: file.uri.slice(0, 48),
    });
    return file.uri;
  } catch {
    const dir = cacheDirectory;
    if (!dir) throw new Error('no_cache');
    const dest = `${dir}pdf-export-${Date.now()}-${safeName}`;
    await writeAsStringAsync(dest, arrayBufferToBase64(arrayBuffer), {
      encoding: EncodingType.Base64,
    });
    careRecordPdfDebugLog('writePdfToCacheForShare (legacy path)', {
      bytes: arrayBuffer.byteLength,
      destPrefix: dest.slice(0, 48),
    });
    return dest;
  }
}

/** __DEV__: 先頭バイトとサイズ（空／JSON混入の切り分け用）。`header` は Uint8Array.toString()（例: %PDF- → 37,80,68,70,45） */
function logPdfBufferProbe(where: string, arrayBuffer: ArrayBuffer): void {
  careRecordPdfDebugLog('PDF Check', {
    where,
    size: arrayBuffer.byteLength,
    header: new Uint8Array(arrayBuffer.slice(0, 5)).toString(),
    looksLikePdf: arrayBuffer.byteLength >= 4 && bufferLooksLikePdf(arrayBuffer),
  });
}

/** Web: ブラウザのダウンロード */
export function downloadPdfInWeb(arrayBuffer: ArrayBuffer, filename: string): void {
  logPdfBufferProbe('downloadPdfInWeb', arrayBuffer);
  careRecordPdfDebugLog('downloadPdfInWeb start', { bytes: arrayBuffer.byteLength, filename });
  if (arrayBuffer.byteLength < 4) {
    careRecordPdfDebugLog('downloadPdfInWeb abort: empty');
    Alert.alert('ダウンロードできません', 'PDFのデータが空です。APIの応答を確認してください。');
    return;
  }
  if (!bufferLooksLikePdf(arrayBuffer)) {
    careRecordPdfDebugLog('downloadPdfInWeb abort: not PDF magic');
    Alert.alert(
      'ダウンロードできません',
      'PDFとして解釈できないデータです。422/500 の JSON が返っている可能性があります。'
    );
    return;
  }
  const safeName = sanitizePdfFilename(filename);
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  careRecordPdfDebugLog('downloadPdfInWeb triggered <a download>', { safeName });
}

function bufferLooksLikePdf(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf, 0, 4);
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46;
}

function isPickerCancelledError(e: unknown): boolean {
  if (e == null || typeof e !== 'object') return false;
  const o = e as { message?: unknown; code?: unknown };
  const msg = typeof o.message === 'string' ? o.message.toLowerCase() : '';
  if (msg.includes('cancel')) return true;
  const code = typeof o.code === 'string' ? o.code.toLowerCase() : '';
  if (code.includes('cancel')) return true;
  return false;
}

function formatUnknownError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function isPickingInProgressError(e: unknown): boolean {
  const m = formatUnknownError(e).toLowerCase();
  return m.includes('already in progress') || m.includes('picking in progress');
}

/**
 * iOS/Android のファイルピッカーはネイティブ側で1つまで。並列で pickDirectoryAsync すると
 * 「File picking is already in progress」になるため直列化する。
 */
let nativePdfPickerChain: Promise<void> = Promise.resolve();

async function withNativePdfPickerExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const next = nativePdfPickerChain.then(fn);
  nativePdfPickerChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/** 共有シートから「ファイルに保存」やクラウドへ送れるよう PDF を渡す */
async function openShareSheetToSavePdf(arrayBuffer: ArrayBuffer, safeName: string): Promise<void> {
  careRecordPdfDebugLog('openShareSheetToSavePdf start', { bytes: arrayBuffer.byteLength, safeName });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    careRecordPdfDebugLog('openShareSheetToSavePdf: Sharing.isAvailableAsync false');
    Alert.alert('共有できません', 'この端末では共有シートを開けません。開発ビルドと権限を確認してください。');
    return;
  }
  const uri = await writePdfToCacheForShare(arrayBuffer, safeName);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'PDFを保存',
  });
  careRecordPdfDebugLog('openShareSheetToSavePdf shareAsync resolved');
}

export type WebPdfShareResult = 'shared' | 'unsupported' | 'cancelled';

/** Web: Web Share API でファイル共有（モバイル Chrome 等で LINE が選べることがあります） */
export async function sharePdfWithWebShareApi(
  arrayBuffer: ArrayBuffer,
  filename: string
): Promise<WebPdfShareResult> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    careRecordPdfDebugLog('sharePdfWithWebShareApi', { result: 'unsupported', reason: 'no navigator.share' });
    return 'unsupported';
  }
  const safeName = sanitizePdfFilename(filename);
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const file = new window.File([blob], safeName, { type: 'application/pdf' });
  const data: ShareData = { files: [file], title: safeName };
  if (navigator.canShare && !navigator.canShare(data)) {
    careRecordPdfDebugLog('sharePdfWithWebShareApi', { result: 'unsupported', reason: 'canShare false' });
    return 'unsupported';
  }
  try {
    await navigator.share(data);
    careRecordPdfDebugLog('sharePdfWithWebShareApi', { result: 'shared' });
    return 'shared';
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    if (name === 'AbortError') {
      careRecordPdfDebugLog('sharePdfWithWebShareApi', { result: 'cancelled' });
      return 'cancelled';
    }
    careRecordPdfDebugLog('sharePdfWithWebShareApi', { result: 'unsupported', error: String(e) });
    return 'unsupported';
  }
}

/** Web: PDF は添付できないため mailto のみ（案内文を本文に含める） */
export function openWebMailComposeWithoutAttachment(subject: string, body: string): void {
  careRecordPdfDebugLog('openWebMailComposeWithoutAttachment (mailto)');
  const hint =
    '\n\n※ ブラウザからは PDF を自動添付できません。先に「ファイルに保存」でダウンロードした PDF を、このメールに手動で添付してください。';
  let fullBody = (body.trim() || '介護記録の PDF を送ります。') + hint;
  if (fullBody.length > 1200) {
    fullBody = fullBody.slice(0, 1200) + '…';
  }
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  q.set('body', fullBody);
  void Linking.openURL(`mailto:?${q.toString()}`);
}

/**
 * ネイティブ: まずフォルダピッカーで直接保存。失敗時（画面が出ない／書き込み不可など）は共有シートにフォールバック。
 * Web: Blob ダウンロード。
 */
export async function savePdfToUserPickedDirectory(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  careRecordPdfDebugLog('savePdfToUserPickedDirectory start', {
    platform: Platform.OS,
    bytes: arrayBuffer.byteLength,
    filename,
  });
  if (Platform.OS === 'web') {
    downloadPdfInWeb(arrayBuffer, filename);
    return;
  }

  return withNativePdfPickerExclusive(async () => {
    const safeName = sanitizePdfFilename(filename);
    logPdfBufferProbe('savePdfToUserPickedDirectory(native)', arrayBuffer);

    // iOS シミュレータではフォルダピッカーが不安定なことが多いため、共有シートへ直接回す
    if (Platform.OS === 'ios' && !Device.isDevice) {
      careRecordPdfDebugLog('savePdf: iOS Simulator — skip folder picker, use share sheet');
      try {
        await openShareSheetToSavePdf(arrayBuffer, safeName);
      } catch (e) {
        careRecordPdfDebugLog('savePdf: iOS Simulator share failed', { error: formatUnknownError(e) });
        Alert.alert('保存できませんでした', formatUnknownError(e));
      }
      return;
    }

    try {
      careRecordPdfDebugLog('pickDirectoryAsync calling');
      const picked = await Directory.pickDirectoryAsync();
      const outFile = picked.createFile(safeName, 'application/pdf');
      outFile.write(new Uint8Array(arrayBuffer));
      careRecordPdfDebugLog('pickDirectory save success', { safeName });
      Alert.alert('保存しました', '選んだフォルダに PDF を保存しました。');
      return;
    } catch (e) {
      if (isPickerCancelledError(e)) {
        careRecordPdfDebugLog('pickDirectory cancelled or user-dismissed', {
          message: formatUnknownError(e),
        });
        return;
      }
      if (isPickingInProgressError(e)) {
        careRecordPdfDebugLog('pickDirectory skipped: already in progress', {
          message: formatUnknownError(e),
        });
        Alert.alert(
          '保存先の選択が重なっています',
          'フォルダの選択画面が開いている間に、別の保存が始まりました。いったんキャンセルしてから、もう一度「ファイルに保存」を試してください。'
        );
        return;
      }
      careRecordPdfDebugLog('pickDirectory or write failed, fallback share', { error: formatUnknownError(e) });
      try {
        await openShareSheetToSavePdf(arrayBuffer, safeName);
      } catch (e2) {
        careRecordPdfDebugLog('fallback share failed', {
          first: formatUnknownError(e),
          second: formatUnknownError(e2),
        });
        Alert.alert(
          '保存できませんでした',
          `フォルダへの保存に失敗し、共有画面も開けませんでした。\n\n・${formatUnknownError(e)}\n・${formatUnknownError(e2)}`
        );
      }
    }
  });
}

/** ネイティブ: メール作成（PDF 添付） */
export async function composeEmailWithPdf(
  arrayBuffer: ArrayBuffer,
  filename: string,
  options: { subject: string; body: string }
): Promise<void> {
  const safeName = sanitizePdfFilename(filename);
  const available = await MailComposer.isAvailableAsync();
  if (!available) {
    careRecordPdfDebugLog('composeEmailWithPdf: MailComposer not available');
    Alert.alert(
      'メールアプリを開けません',
      '共有シートから送信してください。',
      [
        { text: '閉じる', style: 'cancel' },
        {
          text: '共有で送る',
          onPress: () => {
            void openSystemShareSheetForPdf(arrayBuffer, filename);
          },
        },
      ]
    );
    return;
  }
  try {
    careRecordPdfDebugLog('composeEmailWithPdf opening composer', { bytes: arrayBuffer.byteLength });
    const uri = await writePdfToCacheForShare(arrayBuffer, safeName);
    await MailComposer.composeAsync({
      subject: options.subject,
      body: options.body.trim() || '介護記録の PDF を送ります。',
      attachments: [uri],
    });
    careRecordPdfDebugLog('composeEmailWithPdf composeAsync returned');
  } catch (e) {
    careRecordPdfDebugLog('composeEmailWithPdf error', { error: formatUnknownError(e) });
    Alert.alert('メールを開けませんでした', '時間をおいて再度お試しください。');
  }
}

/** ネイティブ: 共有シート（LINE など任意のアプリ） */
export async function openSystemShareSheetForPdf(arrayBuffer: ArrayBuffer, filename: string): Promise<void> {
  const safeName = sanitizePdfFilename(filename);
  careRecordPdfDebugLog('openSystemShareSheetForPdf start', { bytes: arrayBuffer.byteLength, safeName });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    careRecordPdfDebugLog('openSystemShareSheetForPdf: Sharing not available');
    Alert.alert('共有できません', 'この端末では共有を利用できません。「ファイルに保存」から保存してください。');
    return;
  }
  try {
    const uri = await writePdfToCacheForShare(arrayBuffer, safeName);
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: '共有先を選ぶ',
    });
    careRecordPdfDebugLog('openSystemShareSheetForPdf shareAsync resolved', { uriPrefix: uri.slice(0, 40) });
  } catch (e) {
    careRecordPdfDebugLog('openSystemShareSheetForPdf error', { error: formatUnknownError(e) });
    Alert.alert('共有を完了できませんでした', '「ファイルに保存」から保存し、LINE やメールアプリから送ってください。');
  }
}
