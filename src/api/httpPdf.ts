import { careRecordPdfDebugLog } from '@/api/careRecordPdfDebugLog';
import { getApiBaseUrl } from '@/api/config';
import { ApiError } from '@/api/errors';
import { parseErrorMessage } from '@/api/http';

function joinUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function primaryMimeType(header: string | null): string {
  return (header ?? '').split(';')[0].trim().toLowerCase();
}

function bufferLooksLikePdf(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const u = new Uint8Array(buf);
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46;
}

function utf8Preview(buf: ArrayBuffer, maxBytes: number): string {
  const n = Math.min(buf.byteLength, maxBytes);
  const slice = n === buf.byteLength ? buf : buf.slice(0, n);
  const t = new TextDecoder('utf-8', { fatal: false }).decode(slice);
  return t.replace(/\s+/g, ' ').trim().slice(0, 260);
}

/** POST JSON、レスポンスは PDF バイナリ。エラー時は JSON を解釈して ApiError。 */
export async function apiRequestPdfPost(
  path: string,
  options: { body: unknown; accessToken: string }
): Promise<ArrayBuffer> {
  const url = joinUrl(path);
  careRecordPdfDebugLog('fetch POST start', { path });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify(options.body),
  });

  if (!res.ok) {
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      json = null;
    }
    careRecordPdfDebugLog('fetch response not ok', { status: res.status, path });
    throw new ApiError(parseErrorMessage(res.status, json), res.status, json);
  }

  const buf = await res.arrayBuffer();
  const ct = primaryMimeType(res.headers.get('content-type'));
  careRecordPdfDebugLog('fetch response ok', {
    path,
    bytes: buf.byteLength,
    contentType: ct || '(empty)',
  });
  const ctOk = ct === '' || ct === 'application/pdf' || ct === 'application/octet-stream';

  if (!bufferLooksLikePdf(buf)) {
    const preview = utf8Preview(buf, 500);
    if (buf.byteLength === 0) {
      careRecordPdfDebugLog('reject: empty body', { path });
      throw new ApiError('PDFが空です。APIのURL・認証・サーバーログを確認してください。', res.status, null);
    }
    if (!ctOk) {
      careRecordPdfDebugLog('reject: content-type mismatch', { path, contentType: ct, preview });
      throw new ApiError(
        `PDFではない応答です（Content-Type: ${ct || 'なし'}）。${preview ? ` 先頭: ${preview}` : ''}`,
        res.status,
        null
      );
    }
    careRecordPdfDebugLog('reject: not PDF magic', { path, preview });
    throw new ApiError(
      `PDFの先頭が正しくありません（%PDF ではない）。JSONエラーが本文に入っている可能性があります。${preview ? ` 先頭: ${preview}` : ''}`,
      res.status,
      null
    );
  }

  careRecordPdfDebugLog('returning arrayBuffer (validated PDF)', { bytes: buf.byteLength });
  return buf;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}
