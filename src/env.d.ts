/**
 * `.env.local` に定義する公開環境変数（エディタ補完用）。
 * Metro はビルド時に `process.env.EXPO_PUBLIC_*` をインライン化します。
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
