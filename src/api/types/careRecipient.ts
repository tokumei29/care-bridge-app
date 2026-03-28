/** Rails `CareRecipientsController#care_recipient_json` の形（snake_case） */
export type CareRecipientRecord = {
  id: string;
  name: string;
  avatar_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CareRecipientWritePayload = {
  name: string;
  avatar_url?: string | null;
};
