import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const atobFn = globalThis.atob;
  if (typeof atobFn !== 'function') {
    throw new Error('画像のデコードに失敗しました');
  }
  const binary = atobFn(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * ImagePicker の `file://` / `content://` 等を実バイト列にする。
 * React Native では `fetch(uri).blob()` が空になることが多く、Storage に 0B が上がる原因になる。
 */
export async function localPickedImageToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`画像の取得に失敗しました (${res.status})`);
    }
    return res.arrayBuffer();
  }

  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  if (!base64) {
    throw new Error('画像ファイルを読み取れませんでした。別の写真をお試しください。');
  }
  return base64ToArrayBuffer(base64);
}
