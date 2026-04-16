import type { OtherNoteRecord, OtherNoteWritePayload } from '@/api/types/otherNote';
import {
  CARE_RECORD_MEMO_MAX_LENGTH,
  CARE_RECORD_OBSERVATION_MAX_LENGTH,
} from '@/features/care-records/shared/memoLimits';
import {
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  PRE_SUBMIT_ISSUE_LABEL,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';

export type OtherNoteRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  observation: string;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyOtherNoteDraftFromJapanNow(): OtherNoteRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    observation: '',
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function otherNoteRecordToDraft(record: OtherNoteRecord): OtherNoteRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  return {
    dateKey,
    hour,
    minute,
    observation: (record.observation ?? '').slice(0, CARE_RECORD_OBSERVATION_MAX_LENGTH),
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToOtherNoteWritePayload(draft: OtherNoteRecordDraft): OtherNoteWritePayload {
  const obsTrim = draft.observation.trim().slice(0, CARE_RECORD_OBSERVATION_MAX_LENGTH);
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    observation: obsTrim === '' ? null : obsTrim,
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function buildOtherNoteSummaryText(draft: OtherNoteRecordDraft, recipientName: string): string {
  const lines = [
    `${recipientName}さん`,
    '',
    `日付・時刻: ${draft.dateKey} ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.observation.trim()
      ? `認知症の様子: ${draft.observation.trim()}`
      : '認知症の様子: （なし）',
    draft.memo.trim() ? `その他の気づき: ${draft.memo.trim()}` : 'その他の気づき: （なし）',
  ];
  return lines.join('\n');
}
