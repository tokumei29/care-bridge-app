import { supabase } from '@/lib/supabase';
import { localPickedImageToArrayBuffer } from '@/lib/localPickedImageBytes';

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

  const bytes = await localPickedImageToArrayBuffer(localFileUri);
  if (bytes.byteLength === 0) {
    throw new Error('画像データが空です。別の写真を選ぶか、アプリを再起動してお試しください。');
  }

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (uploadError) {
    const msg = uploadError.message ?? '';
    if (/bucket not found/i.test(msg)) {
      throw new Error(
        `Storage のバケット「${bucket}」が Supabase にありません。ダッシュボードの Storage で同名のバケットを作成するか、.env の EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET を実際のバケット名に合わせてください。（ファイルサイズのエラーではありません）`
      );
    }
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
