export type CareRecipient = {
  id: string;
  name: string;
  createdAt: string;
  /** 表示用。Supabase Storage の公開 URL など（未設定はイニシャル） */
  avatarUrl: string | null;
  /** `YYYY-MM-DD`。未設定は null */
  nextAdmissionOn: string | null;
};

/** 登録・編集モーダルからの写真の扱い */
export type RecipientAvatarSubmit =
  | { mode: 'none' }
  | { mode: 'keep' }
  | { mode: 'clear' }
  | { mode: 'picked'; tempUri: string };
