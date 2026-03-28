/** Rails `RehabRecordsController` の JSON（snake_case）想定 */
export type RehabRecordRecord = {
  id: string;
  care_recipient_id: string;
  started_at: string;
  ended_at: string;
  content: string | null;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type RehabRecordWritePayload = {
  started_at: string;
  ended_at: string;
  content: string | null;
  memo: string | null;
  issue_status: string;
};
