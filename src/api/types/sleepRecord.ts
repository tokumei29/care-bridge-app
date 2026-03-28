/** Rails `SleepRecordsController` の JSON（snake_case）想定 */
export type SleepRecordRecord = {
  id: string;
  care_recipient_id: string;
  /** 臥床（就床）開始の日時（日本時間の ISO8601） */
  bedded_at: string;
  /** 起床の日時（日本時間の ISO8601。翌朝の場合は日付が翌日） */
  woke_at: string;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type SleepRecordWritePayload = {
  bedded_at: string;
  woke_at: string;
  memo: string | null;
  issue_status: string;
};
