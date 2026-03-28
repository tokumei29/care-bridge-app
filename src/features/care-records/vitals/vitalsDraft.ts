import type { VitalRecordRecord, VitalRecordWritePayload } from '@/api/types/vitalRecord';
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

export type VitalRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  /** 体温（℃）入力用 */
  temperature: string;
  /** 最高血圧 mmHg */
  bloodPressureSystolic: string;
  /** 最低血圧 mmHg */
  bloodPressureDiastolic: string;
  /** 脈拍（1分間の拍数） */
  pulseRate: string;
  /** SpO₂ % */
  spo2: string;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

function numToDraftString(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  return Number.isFinite(n) ? String(n) : '';
}

/** 体温: 空または数値（カンマ可） */
export function parseOptionalTemperature(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/** 整数（血圧・脈拍・SpO₂）。空欄は null */
export function parseOptionalIntField(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number.parseInt(t.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export function createEmptyVitalDraftFromJapanNow(): VitalRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    pulseRate: '',
    spo2: '',
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function vitalRecordToDraft(record: VitalRecordRecord): VitalRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  return {
    dateKey,
    hour,
    minute,
    temperature: numToDraftString(record.body_temperature),
    bloodPressureSystolic: numToDraftString(record.blood_pressure_systolic),
    bloodPressureDiastolic: numToDraftString(record.blood_pressure_diastolic),
    pulseRate: numToDraftString(record.pulse_rate),
    spo2: numToDraftString(record.spo2),
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToVitalWritePayload(draft: VitalRecordDraft): VitalRecordWritePayload {
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    body_temperature: parseOptionalTemperature(draft.temperature),
    blood_pressure_systolic: parseOptionalIntField(draft.bloodPressureSystolic),
    blood_pressure_diastolic: parseOptionalIntField(draft.bloodPressureDiastolic),
    pulse_rate: parseOptionalIntField(draft.pulseRate),
    spo2: parseOptionalIntField(draft.spo2),
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

export function buildVitalSummaryText(draft: VitalRecordDraft, recipientName: string): string {
  const t = parseOptionalTemperature(draft.temperature);
  const sys = parseOptionalIntField(draft.bloodPressureSystolic);
  const dia = parseOptionalIntField(draft.bloodPressureDiastolic);
  const pulse = parseOptionalIntField(draft.pulseRate);
  const ox = parseOptionalIntField(draft.spo2);
  const lines = [
    `${recipientName}さん`,
    '',
    `日付（日本時間）: ${draft.dateKey}`,
    `時刻: ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `体温: ${t != null ? `${t}℃` : '（未入力）'}`,
    `血圧: ${sys != null && dia != null ? `${sys}／${dia} mmHg` : '（未入力）'}`,
    `脈拍: ${pulse != null ? `${pulse} 回/分` : '（未入力）'}`,
    `SpO₂: ${ox != null ? `${ox}％` : '（未入力）'}`,
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）',
  ];
  return lines.join('\n');
}
