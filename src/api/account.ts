import { apiRequest } from '@/api/http';

const PATH = '/api/v1/account';

export type AccountApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

/**
 * 現在のログインユーザーのアカウントを削除する。
 * Rails 側では `dependent: :destroy` 等で被介護者・介護記録をカスケード削除し、
 * 必要に応じて Supabase Auth のユーザーも削除してください。
 *
 * 未実装の場合は 404 を返し、アプリは被介護者をすべて DELETE してからログアウトするフォールバックに回ります。
 */
export async function destroyMyAccount(deps: AccountApiDeps): Promise<void> {
  const token = await deps.getAccessToken();
  if (!token) {
    throw new Error('ログインが必要です');
  }
  await apiRequest<void>(PATH, { method: 'DELETE', accessToken: token });
}
