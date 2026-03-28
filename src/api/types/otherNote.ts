/** Rails `OtherNotesController` の JSON（snake_case）想定 */
export type OtherNoteRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  /** 認知症の様子（平穏・不穏など） */
  observation: string | null;
  /** その他の気づき */
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type OtherNoteWritePayload = {
  recorded_at: string;
  observation: string | null;
  memo: string | null;
  issue_status: string;
};
