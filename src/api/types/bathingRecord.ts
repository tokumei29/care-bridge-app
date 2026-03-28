/** Rails `BathingRecordsController` の JSON（snake_case）想定 */
export type BathingRecordRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type BathingRecordWritePayload = {
  recorded_at: string;
  memo: string | null;
  issue_status: string;
};
