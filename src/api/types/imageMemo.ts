/** Rails `ImageMemosController` の JSON（snake_case）想定 */
export type ImageMemoRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  image_url: string;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type ImageMemoWritePayload = {
  recorded_at: string;
  image_url: string;
  memo: string | null;
  issue_status: string;
};
