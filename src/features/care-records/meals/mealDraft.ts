import type { MealRecordRecord, MealRecordWritePayload } from '@/api/types/mealRecord';
import {
  buildRecordedAtIsoInJapan,
  getJapanNowParts,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared/japanTime';
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  PRE_SUBMIT_ISSUE_LABEL,
  type MealSlotId,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';

export type MealRecordDraft = {
  dateKey: string;
  hour: number;
  minute: number;
  mealSlot: MealSlotId;
  stapleAmount: number;
  sideAmount: number;
  waterMl: string;
  memo: string;
  preSubmitIssue: PreSubmitIssueStatus;
};

function asMealSlotId(raw: string): MealSlotId {
  return (MEAL_SLOTS as readonly string[]).includes(raw) ? (raw as MealSlotId) : 'lunch';
}

function asPreSubmitIssueStatus(raw: string): PreSubmitIssueStatus {
  return raw === 'issue' ? 'issue' : 'ok';
}

export function createEmptyDraftFromJapanNow(): MealRecordDraft {
  const p = getJapanNowParts();
  return {
    dateKey: p.dateKey,
    hour: p.hour,
    minute: p.minute,
    mealSlot: 'lunch',
    stapleAmount: 5,
    sideAmount: 5,
    waterMl: '',
    memo: '',
    preSubmitIssue: 'ok',
  };
}

export function mealRecordToDraft(record: MealRecordRecord): MealRecordDraft {
  const { dateKey, hour, minute } = parseIsoToJapanDateTimeParts(record.recorded_at);
  const water = record.water_ml;
  return {
    dateKey,
    hour,
    minute,
    mealSlot: asMealSlotId(record.meal_slot),
    stapleAmount: record.staple_amount,
    sideAmount: record.side_amount,
    waterMl: water === null || water === undefined ? '' : String(water),
    memo: record.memo ?? '',
    preSubmitIssue: asPreSubmitIssueStatus(record.issue_status),
  };
}

export function draftToWritePayload(draft: MealRecordDraft): MealRecordWritePayload {
  const waterTrim = draft.waterMl.trim();
  const waterParsed = waterTrim === '' ? null : Number.parseInt(waterTrim, 10);
  const water_ml =
    waterParsed === null || Number.isNaN(waterParsed) ? null : waterParsed;
  const isSnack = draft.mealSlot === 'snack';
  return {
    recorded_at: buildRecordedAtIsoInJapan(draft.dateKey, draft.hour, draft.minute),
    meal_slot: draft.mealSlot,
    staple_amount: isSnack ? 0 : draft.stapleAmount,
    side_amount: isSnack ? 0 : draft.sideAmount,
    water_ml,
    memo: draft.memo.trim(),
    issue_status: draft.preSubmitIssue,
  };
}

export function buildMealSummaryText(draft: MealRecordDraft, recipientName: string): string {
  const ml = draft.waterMl.trim() === '' ? '（未入力）' : `${draft.waterMl.trim()} ml`;
  const isSnack = draft.mealSlot === 'snack';
  const lines = [
    `${recipientName}さん`,
    '',
    `日付（日本時間）: ${draft.dateKey}`,
    `時刻: ${String(draft.hour).padStart(2, '0')}:${String(draft.minute).padStart(2, '0')}`,
    `食事: ${MEAL_SLOT_LABEL[draft.mealSlot]}`,
  ];
  if (!isSnack) {
    lines.push(`主食: ${draft.stapleAmount} / 10`, `副食: ${draft.sideAmount} / 10`);
  } else {
    lines.push('主食・副食: （間食のため入力なし）');
  }
  lines.push(
    `水分量: ${ml}`,
    `送信前の確認: ${PRE_SUBMIT_ISSUE_LABEL[draft.preSubmitIssue]}`,
    draft.memo.trim() ? `メモ: ${draft.memo.trim()}` : 'メモ: （なし）'
  );
  return lines.join('\n');
}
