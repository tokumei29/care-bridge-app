import type { SleepRecordRecord, SleepRecordWritePayload } from '@/api/types/sleepRecord';
import { CARE_RECORD_MEMO_MAX_LENGTH } from '@/features/care-records/shared/memoLimits';
import {
  addOneJapanCalendarDay,
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  PRE_SUBMIT_ISSUE_LABEL,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';

export type SleepRecordDraft = {
  /** 臥床した日（日本時間の暦日） */
  dateKey: string;
  bedHour: number;
  bedMinute: number;
  wakeHour: number;
  wakeMinute: number;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptySleepDraftFromJapanNow(): SleepRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    bedHour: 21,
    bedMinute: 0,
    wakeHour: 6,
    wakeMinute: 0,
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function sleepRecordToDraft(record: SleepRecordRecord): SleepRecordDraft {
  const bed = parseIsoToJapanDateTimeParts(record.bedded_at);
  const wake = parseIsoToJapanDateTimeParts(record.woke_at);
  return {
    dateKey: bed.dateKey,
    bedHour: bed.hour,
    bedMinute: bed.minute,
    wakeHour: wake.hour,
    wakeMinute: wake.minute,
    memo: (record.memo ?? '').slice(0, CARE_RECORD_MEMO_MAX_LENGTH),
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

/** 起床が翌暦日になるか（時刻だけの比較。同分は翌日扱い） */
function wakeDateKeyForDraft(draft: SleepRecordDraft): string {
  const bedT = draft.bedHour * 60 + draft.bedMinute;
  const wakeT = draft.wakeHour * 60 + draft.wakeMinute;
  if (wakeT <= bedT) {
    return addOneJapanCalendarDay(draft.dateKey);
  }
  return draft.dateKey;
}

export function draftToSleepWritePayload(draft: SleepRecordDraft): SleepRecordWritePayload {
  const bedded_at = buildRecordedAtIsoInJapan(draft.dateKey, draft.bedHour, draft.bedMinute);
  const wakeKey = wakeDateKeyForDraft(draft);
  const woke_at = buildRecordedAtIsoInJapan(wakeKey, draft.wakeHour, draft.wakeMinute);
  const memoTrim = draft.memo.trim().slice(0, CARE_RECORD_MEMO_MAX_LENGTH);
  return {
    bedded_at,
    woke_at,
    memo: memoTrim === '' ? null : memoTrim,
    issue_status: draft.preSubmitIssue,
  };
}

/** 臥床〜起床の実時間（ISO）から「8時間30分」形式。不正・逆転時は null */
export function formatSleepIntervalDurationJa(beddedAtIso: string, wokeAtIso: string): string | null {
  const t0 = new Date(beddedAtIso).getTime();
  const t1 = new Date(wokeAtIso).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return null;
  const totalMin = Math.floor((t1 - t0) / 60000);
  if (totalMin < 1) return '1分未満';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function validateSleepDraft(draft: SleepRecordDraft): string | null {
  try {
    const payload = draftToSleepWritePayload(draft);
    const t0 = new Date(payload.bedded_at).getTime();
    const t1 = new Date(payload.woke_at).getTime();
    if (Number.isNaN(t0) || Number.isNaN(t1)) {
      return '日時が正しくありません。';
    }
    if (t1 <= t0) {
      return '起床時刻は臥床時刻より後にしてください。';
    }
  } catch {
    return '日付の計算に失敗しました。';
  }
  return null;
}

export function buildSleepSummaryText(draft: SleepRecordDraft, recipientName: string): string {
  const bh = String(draft.bedHour).padStart(2, '0');
  const bm = String(draft.bedMinute).padStart(2, '0');
  const wh = String(draft.wakeHour).padStart(2, '0');
  const wm = String(draft.wakeMinute).padStart(2, '0');
  const wakeKey = wakeDateKeyForDraft(draft);
  const crossDay = wakeKey !== draft.dateKey;
  const payload = draftToSleepWritePayload(draft);
  const totalSleep = formatSleepIntervalDurationJa(payload.bedded_at, payload.woke_at);
  const lines = [
    `${recipientName}さん`,
    '',
    `臥床の日付（日本時間）: ${draft.dateKey}`,
    `臥床: ${bh}:${bm}`,
    `起床: ${wh}:${wm}${crossDay ? '（翌日）' : ''}`,
    ...(totalSleep ? [`睡眠時間の合計: ${totalSleep}`] : []),
    `そのときの様子: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）',
  ];
  return lines.join('\n');
}
