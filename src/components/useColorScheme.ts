import { useColorScheme as useColorSchemeCore } from 'react-native';

/**
 * RN の `useColorScheme` は初期描画などで `null` を返すことがある。
 * `Themed` の `Colors[theme]` は有効なキーが必要なので、常に `'light' | 'dark'` に正規化する。
 */
export const useColorScheme = (): 'light' | 'dark' => {
  const coreScheme = useColorSchemeCore();
  return coreScheme === 'dark' ? 'dark' : 'light';
};
