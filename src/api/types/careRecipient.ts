/** Rails `CareRecipientsController#care_recipient_json` の形（snake_case） */
export type CareRecipientRecord = {
  /** JSON では数値になることがある。null のレコードはクライアントで除外する */
  id: string | number | null;
  name: string;
  avatar_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Rails へ PATCH/POST する本文（`care_recipient`）。
 * 写真はライブラリの `file://…` をそのまま送るのではなく、
 * `uploadRecipientAvatarToSupabase(localUri)` で Supabase Storage に置いたあとの公開 URL を入れる。
 * 端末上の一時 URI は `RecipientAvatarSubmit`（`features/care-recipients/types`）側。
 */
export type CareRecipientWritePayload = {
  name: string;
  /** Supabase 等にアップロード済みの画像の HTTPS URL。未送信・削除時は null / 省略 */
  avatar_url?: string | null;
};
