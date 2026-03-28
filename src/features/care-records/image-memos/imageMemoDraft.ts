import type { ImageMemoRecord, ImageMemoWritePayload } from '@/api/types/imageMemo';
import { CARE_RECORD_MEMO_MAX_LENGTH } from '@/features/care-records/shared/memoLimits';
import {
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  PRE_SUBMIT_ISSUE_LABEL,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';

export type ImageMemoRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  /** 新規・差し替えで選んだローカル URI */
  localImageUri: string | null;
  /** 直近のピックの MIME（アップロード時の Content-Type 用） */
  localImageMimeType: string | null;
  /** サーバー保存済みの画像 URL（編集時） */
  remoteImageUrl: string | null;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyImageMemoDraftFromJapanNow(): ImageMemoRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    localImageUri: null,
    localImageMimeType: null,
    remoteImageUrl: null,
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function imageMemoRecordToDraft(record: ImageMemoRecord): ImageMemoRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  return {
    dateKey,
    hour,
    minute,
    localImageUri: null,
    localImageMimeType: null,
    remoteImageUrl: record.image_url.trim() !== '' ? record.image_url : null,
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToImageMemoWritePayload(
  draft: ImageMemoRecordDraft,
  imageUrl: string
): ImageMemoWritePayload {
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    image_url: imageUrl,
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function validateImageMemoDraftHasImage(draft: ImageMemoRecordDraft): string | null {
  if (draft.localImageUri) return null;
  if (draft.remoteImageUrl && draft.remoteImageUrl.trim() !== '') return null;
  return '写真を選んでください。';
}

export function buildImageMemoSummaryText(draft: ImageMemoRecordDraft, recipientName: string): string {
  const img =
    draft.localImageUri != null
      ? '（新しく選んだ写真をアップロードします）'
      : draft.remoteImageUrl
        ? '（登録済みの写真をそのまま使います）'
        : '（画像なし）';
  const lines = [
    `${recipientName}さん`,
    '',
    `日付・時刻（日本時間）: ${draft.dateKey} ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `画像: ${img}`,
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）',
  ];
  return lines.join('\n');
}
