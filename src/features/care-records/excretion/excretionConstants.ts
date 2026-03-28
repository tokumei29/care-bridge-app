/** API 値: 排尿 なし / あり */
export const URINATION_PRESENCE = ['none', 'present'] as const;
export type UrinationPresenceId = (typeof URINATION_PRESENCE)[number];
export const URINATION_PRESENCE_LABEL: Record<UrinationPresenceId, string> = {
  none: 'なし',
  present: 'あり',
};

/** API 値: 排尿量（ありのとき） */
export const URINATION_AMOUNTS = ['small', 'normal', 'large'] as const;
export type UrinationAmountId = (typeof URINATION_AMOUNTS)[number];
export const URINATION_AMOUNT_LABEL: Record<UrinationAmountId, string> = {
  small: '少量',
  normal: '普通',
  large: '多量',
};

/** API 値: 排便 なし / あり */
export const DEFECATION_PRESENCE = ['none', 'present'] as const;
export type DefecationPresenceId = (typeof DEFECATION_PRESENCE)[number];
export const DEFECATION_PRESENCE_LABEL: Record<DefecationPresenceId, string> = {
  none: 'なし',
  present: 'あり',
};

/** API 値: 排便量（ありのとき） */
export const DEFECATION_AMOUNTS = ['small', 'palm_half', 'palm_full', 'two_hands'] as const;
export type DefecationAmountId = (typeof DEFECATION_AMOUNTS)[number];
export const DEFECATION_AMOUNT_LABEL: Record<DefecationAmountId, string> = {
  small: '少量',
  palm_half: '片手半分',
  palm_full: '片手いっぱい',
  two_hands: '両手で掬う量',
};

/** API 値: 便の状態 */
export const STOOL_CONDITIONS = ['normal', 'soft', 'hard', 'diarrhea', 'watery', 'other'] as const;
export type StoolConditionId = (typeof STOOL_CONDITIONS)[number];
export const STOOL_CONDITION_LABEL: Record<StoolConditionId, string> = {
  normal: '普通',
  soft: '柔らかめ',
  hard: '硬め',
  diarrhea: '下痢便',
  watery: '水様便',
  other: 'その他',
};

export { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
