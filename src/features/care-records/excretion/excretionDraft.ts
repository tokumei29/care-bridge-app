import type { ExcretionRecordRecord, ExcretionRecordWritePayload } from '@/api/types/excretionRecord';
import { CARE_RECORD_MEMO_MAX_LENGTH } from '@/features/care-records/shared/memoLimits';
import {
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  DEFECATION_AMOUNTS,
  DEFECATION_PRESENCE,
  PRE_SUBMIT_ISSUE_LABEL,
  STOOL_CONDITIONS,
  URINATION_AMOUNTS,
  URINATION_PRESENCE,
  DEFECATION_AMOUNT_LABEL,
  DEFECATION_PRESENCE_LABEL,
  STOOL_CONDITION_LABEL,
  URINATION_AMOUNT_LABEL,
  URINATION_PRESENCE_LABEL,
} from '@/features/care-records/excretion/excretionConstants';
import type { PreSubmitIssueStatus } from '@/features/care-records/meals/mealConstants';

export type ExcretionRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  urinationPresence: (typeof URINATION_PRESENCE)[number];
  urinationAmount: (typeof URINATION_AMOUNTS)[number] | null;
  defecationPresence: (typeof DEFECATION_PRESENCE)[number];
  defecationAmount: (typeof DEFECATION_AMOUNTS)[number] | null;
  stoolCondition: (typeof STOOL_CONDITIONS)[number] | null;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asUrinationPresence(raw: string): ExcretionRecordDraft['urinationPresence'] {
  return (URINATION_PRESENCE as readonly string[]).includes(raw) ? (raw as ExcretionRecordDraft['urinationPresence']) : 'none';
}

function asUrinationAmountForDraft(
  presence: ExcretionRecordDraft['urinationPresence'],
  raw: string | null | undefined
): ExcretionRecordDraft['urinationAmount'] {
  if (presence !== 'present') return null;
  if (raw == null || raw === '') return 'normal';
  return (URINATION_AMOUNTS as readonly string[]).includes(raw)
    ? (raw as ExcretionRecordDraft['urinationAmount'])
    : 'normal';
}

function asDefecationPresence(raw: string): ExcretionRecordDraft['defecationPresence'] {
  return (DEFECATION_PRESENCE as readonly string[]).includes(raw)
    ? (raw as ExcretionRecordDraft['defecationPresence'])
    : 'none';
}

function asDefecationAmountForDraft(
  presence: ExcretionRecordDraft['defecationPresence'],
  raw: string | null | undefined
): ExcretionRecordDraft['defecationAmount'] {
  if (presence !== 'present') return null;
  if (raw == null || raw === '') return 'palm_full';
  return (DEFECATION_AMOUNTS as readonly string[]).includes(raw)
    ? (raw as ExcretionRecordDraft['defecationAmount'])
    : 'palm_full';
}

function asStoolConditionForDraft(
  defecationPresence: ExcretionRecordDraft['defecationPresence'],
  raw: string | null | undefined
): ExcretionRecordDraft['stoolCondition'] {
  if (defecationPresence !== 'present') return null;
  if (raw == null || raw === '') return 'normal';
  return (STOOL_CONDITIONS as readonly string[]).includes(raw)
    ? (raw as ExcretionRecordDraft['stoolCondition'])
    : 'normal';
}

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyExcretionDraftFromJapanNow(): ExcretionRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    urinationPresence: 'none',
    urinationAmount: null,
    defecationPresence: 'none',
    defecationAmount: null,
    stoolCondition: null,
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function excretionRecordToDraft(record: ExcretionRecordRecord): ExcretionRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  const urinationPresence = asUrinationPresence(record.urination_status);
  const defecationPresence = asDefecationPresence(record.defecation_status);
  return {
    dateKey,
    hour,
    minute,
    urinationPresence,
    urinationAmount: asUrinationAmountForDraft(urinationPresence, record.urination_amount),
    defecationPresence,
    defecationAmount: asDefecationAmountForDraft(defecationPresence, record.defecation_amount),
    stoolCondition: asStoolConditionForDraft(defecationPresence, record.stool_condition),
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToExcretionWritePayload(draft: ExcretionRecordDraft): ExcretionRecordWritePayload {
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    urination_status: draft.urinationPresence,
    urination_amount: draft.urinationPresence === 'present' ? draft.urinationAmount ?? 'normal' : null,
    defecation_status: draft.defecationPresence,
    defecation_amount: draft.defecationPresence === 'present' ? draft.defecationAmount ?? 'palm_full' : null,
    stool_condition: draft.defecationPresence === 'present' ? draft.stoolCondition ?? 'normal' : null,
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function buildExcretionSummaryText(draft: ExcretionRecordDraft, recipientName: string): string {
  const uP = URINATION_PRESENCE_LABEL[draft.urinationPresence];
  const uA =
    draft.urinationPresence === 'present' && draft.urinationAmount
      ? URINATION_AMOUNT_LABEL[draft.urinationAmount]
      : '—';
  const dP = DEFECATION_PRESENCE_LABEL[draft.defecationPresence];
  const dA =
    draft.defecationPresence === 'present' && draft.defecationAmount
      ? DEFECATION_AMOUNT_LABEL[draft.defecationAmount]
      : '—';
  const stool =
    draft.defecationPresence === 'present' && draft.stoolCondition
      ? STOOL_CONDITION_LABEL[draft.stoolCondition]
      : '—';
  const lines = [
    `${recipientName}さん`,
    '',
    `日付: ${draft.dateKey}`,
    `時刻: ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `排尿: ${uP}${draft.urinationPresence === 'present' ? ` · 尿量: ${uA}` : ''}`,
    `排便: ${dP}${draft.defecationPresence === 'present' ? ` · 便量: ${dA}` : ''}`,
    ...(draft.defecationPresence === 'present' ? [`排便の状態: ${stool}`] : []),
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）',
  ];
  return lines.join('\n');
}
