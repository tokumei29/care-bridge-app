import { supabase } from '@/lib/supabase';
import { localPickedImageToArrayBuffer } from '@/lib/localPickedImageBytes';

function careImageBucket(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_CARE_IMAGE_BUCKET?.trim() || 'care-images';
}

function extAndContentType(mimeType: string | null | undefined): { ext: string; contentType: string } {
  const m = (mimeType ?? '').toLowerCase();
  if (m.includes('png')) return { ext: 'png', contentType: 'image/png' };
  if (m.includes('webp')) return { ext: 'webp', contentType: 'image/webp' };
  return { ext: 'jpg', contentType: 'image/jpeg' };
}

function randomObjectName(ext: string): string {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${id}.${ext}`;
}

/**
 * 介護用画像メモを Storage に置き、Rails に渡す公開 URL を返す。
 * バケットはアバターと分けることを推奨（RLS・ライフサイクルを別管理しやすい）。
 */
export async function uploadCareImageMemoToSupabase(
  localFileUri: string,
  careRecipientId: string,
  mimeType?: string | null
): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('ログイン情報を確認できませんでした');
  }

  const bucket = careImageBucket();
  const { ext, contentType } = extAndContentType(mimeType);
  const path = `${userData.user.id}/${careRecipientId}/image_memos/${randomObjectName(ext)}`;

  const bytes = await localPickedImageToArrayBuffer(localFileUri);
  if (bytes.byteLength === 0) {
    throw new Error('画像データが空です。別の写真を選ぶか、アプリを再起動してお試しください。');
  }

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (uploadError) {
    const msg = uploadError.message ?? '';
    if (/bucket not found/i.test(msg)) {
      throw new Error(
        `Storage のバケット「${bucket}」が Supabase にありません。ダッシュボードの Storage で作成するか、.env の EXPO_PUBLIC_SUPABASE_CARE_IMAGE_BUCKET を実際のバケット名に合わせてください。`
      );
    }
    throw uploadError;
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}
