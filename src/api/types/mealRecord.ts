/** Rails `MealRecordsController#meal_record_json`（snake_case） */
export type MealRecordRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  meal_slot: string;
  staple_amount: number;
  side_amount: number;
  water_ml: number | null;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

/** `meal_record_params` に渡す属性 */
export type MealRecordWritePayload = {
  recorded_at: string;
  meal_slot: string;
  staple_amount: number;
  side_amount: number;
  water_ml: number | null;
  memo: string;
  issue_status: string;
};
