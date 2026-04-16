import type { BathingRecordRecord, BathingRecordWritePayload } from '@/api/types/bathingRecord';
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

export type BathingRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyBathingDraftFromJapanNow(): BathingRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function bathingRecordToDraft(record: BathingRecordRecord): BathingRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  return {
    dateKey,
    hour,
    minute,
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToBathingWritePayload(draft: BathingRecordDraft): BathingRecordWritePayload {
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function buildBathingSummaryText(draft: BathingRecordDraft, recipientName: string): string {
  const lines = [
    `${recipientName}さん`,
    '',
    `日付: ${draft.dateKey}`,
    `時刻: ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `気づき・様子: ${draft.memo.trim()}` : '気づき・様子: （なし）',
  ];
  return lines.join('\n');
}
