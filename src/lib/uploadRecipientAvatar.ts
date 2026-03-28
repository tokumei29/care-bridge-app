import { supabase } from '@/lib/supabase';

/**
 * 公開 URL が取れるバケット名。Supabase でバケット作成し、必要なら「Public bucket」を有効にしてください。
 */
function avatarBucket(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET?.trim() || 'avatars';
}

/**
 * ローカル画像 URI を Storage に置き、Rails に渡す公開 URL を返す。
 */
export async function uploadRecipientAvatarToSupabase(
  localFileUri: string,
  recipientId: string
): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('ログイン情報を確認できませんでした');
  }

  const bucket = avatarBucket();
  const path = `${userData.user.id}/${recipientId}.jpg`;

  const response = await fetch(localFileUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

export async function removeRecipientAvatarFromSupabase(recipientId: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return;

  const bucket = avatarBucket();
  const path = `${userData.user.id}/${recipientId}.jpg`;
  await supabase.storage.from(bucket).remove([path]);
}
