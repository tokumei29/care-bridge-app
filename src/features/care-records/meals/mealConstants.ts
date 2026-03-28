/**
 * 食事のタイミング。ご指定の「完食」は文脈上「間食」と解釈して実装しています。
 * 別の意味で使いたい場合はラベルだけ差し替えてください。
 */
/** Rails `meal_records.meal_slot` と同じ値（英字スネーク相当の単語） */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type MealSlotId = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABEL: Record<MealSlotId, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  snack: '間食',
  dinner: '夕食',
};

/** 主食・副食の摂取量 0〜10（10 = 全部） */
export const AMOUNT_MIN = 0;
export const AMOUNT_MAX = 10;

/**
 * そのときの食事の様子（いずれか一方）。入力ミスではなく、現場の観察用。
 * Rails `meal_records.issue_status` の値 `ok` | `issue` と一致させること。
 */
export type PreSubmitIssueStatus = 'ok' | 'issue';

/** フォーム・一覧タグのラベル */
export const PRE_SUBMIT_ISSUE_LABEL: Record<PreSubmitIssueStatus, string> = {
  ok: '問題なし',
  issue: '問題、気になる点あり',
};
