import type { RehabRecordRecord, RehabRecordWritePayload } from '@/api/types/rehabRecord';
import { CARE_RECORD_ACTIVITY_MAX_LENGTH, CARE_RECORD_MEMO_MAX_LENGTH } from '@/features/care-records/shared/memoLimits';
import {
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  PRE_SUBMIT_ISSUE_LABEL,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';

export type RehabRecordDraft = {
  dateKey: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  content: string;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyRehabDraftFromJapanNow(): RehabRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    startHour: p.hour,
    startMinute: p.minute,
    endHour: p.hour,
    endMinute: Math.min(59, p.minute + 30),
    content: '',
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function rehabRecordToDraft(record: RehabRecordRecord): RehabRecordDraft {
  const start = parseIsoToJapanDateTimeParts(record.started_at);
  const end = parseIsoToJapanDateTimeParts(record.ended_at);
  return {
    dateKey: start.dateKey,
    startHour: start.hour,
    startMinute: start.minute,
    endHour: end.hour,
    endMinute: end.minute,
    content: (record.content ?? '').slice(0, CARE_RECORD_ACTIVITY_MAX_LENGTH),
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

/** 終了が開始より前（同日・分単位）ならエラーメッセージ */
export function validateRehabDraftTimeOrder(draft: RehabRecordDraft): string | null {
  const t0 = draft.startHour * 60 + draft.startMinute;
  const t1 = draft.endHour * 60 + draft.endMinute;
  if (t1 < t0) {
    return '終了時刻は開始時刻と同じか、それ以降にしてください。';
  }
  return null;
}

export function draftToRehabWritePayload(draft: RehabRecordDraft): RehabRecordWritePayload {
  const contentTrim = draft.content.trim().slice(0, CARE_RECORD_ACTIVITY_MAX_LENGTH);
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    started_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.startHour, draft.startMinute),
    ended_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.endHour, draft.endMinute),
    content: contentTrim === '' ? null : contentTrim,
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function buildRehabSummaryText(draft: RehabRecordDraft, recipientName: string): string {
  const sh = String(draft.startHour).padStart(2, '0');
  const sm = String(draft.startMinute).padStart(2, '0');
  const eh = String(draft.endHour).padStart(2, '0');
  const em = String(draft.endMinute).padStart(2, '0');
  const lines = [
    `${recipientName}さん`,
    '',
    `日付（日本時間）: ${draft.dateKey}`,
    `時間: ${sh}:${sm} 〜 ${eh}:${em}`,
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.content.trim() ? `行った内容: ${draft.content.trim()}` : '行った内容: （なし）',
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）',
  ];
  return lines.join('\n');
}
