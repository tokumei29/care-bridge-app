import { useEffect, useLayoutEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

const PUBLIC_MARKER = '/storage/v1/object/public/';

/** `.../storage/v1/object/public/{bucket}/{path...}` を分解する */
export function parseSupabasePublicStorageRef(
  url: string
): { bucket: string; objectPath: string } | null {
  try {
    const u = new URL(url);
    const i = u.pathname.indexOf(PUBLIC_MARKER);
    if (i === -1) return null;
    const tail = u.pathname.slice(i + PUBLIC_MARKER.length);
    const segments = tail.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const bucket = segments[0];
    const objectPath = segments.slice(1).join('/');
    return { bucket, objectPath };
  } catch {
    return null;
  }
}

/**
 * Supabase Storage の「public URL」は、RLS で匿名 READ が無いと端末から 0 バイト扱いになることがある。
 * ログイン中なら署名付き URL を取得して差し替える（Rails の blob URL はそのまま）。
 */
export function useSignedSupabasePublicStorageUrl(url: string | null | undefined): string | null {
  const trimmed = typeof url === 'string' && url.trim() !== '' ? url.trim() : null;
  const [signedOverride, setSignedOverride] = useState<string | null>(null);

  useLayoutEffect(() => {
    setSignedOverride(null);
  }, [trimmed]);

  useEffect(() => {
    if (!trimmed) return;

    const ref = parseSupabasePublicStorageRef(trimmed);
    if (!ref) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase.storage
        .from(ref.bucket)
        .createSignedUrl(ref.objectPath, 60 * 60);

      if (cancelled) return;

      if (!error && data?.signedUrl) {
        setSignedOverride(data.signedUrl);
      } else if (__DEV__ && error) {
        console.warn('[useSignedSupabasePublicStorageUrl] createSignedUrl failed', error.message, trimmed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  if (!trimmed) return null;
  return signedOverride ?? trimmed;
}

export function useAvatarDisplayUri(avatarUrl: string | null | undefined): string | null {
  return useSignedSupabasePublicStorageUrl(avatarUrl);
}
