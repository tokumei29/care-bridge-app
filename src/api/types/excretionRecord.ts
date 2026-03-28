/** Rails `ExcretionRecordsController` の JSON（snake_case）想定 */
export type ExcretionRecordRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  urination_status: string;
  urination_amount: string | null;
  defecation_status: string;
  defecation_amount: string | null;
  stool_condition: string | null;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type ExcretionRecordWritePayload = {
  recorded_at: string;
  urination_status: string;
  urination_amount: string | null;
  defecation_status: string;
  defecation_amount: string | null;
  stool_condition: string | null;
  memo: string | null;
  issue_status: string;
};
