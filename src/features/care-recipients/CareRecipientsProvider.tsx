import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { destroyMyAccount } from '@/api/account';
import { getApiBaseUrl } from '@/api/config';
import { createCareRecipientsApi } from '@/api/careRecipients';
import { isApiError } from '@/api/errors';
import type { CareRecipientRecord } from '@/api/types/careRecipient';
import { supabase } from '@/lib/supabase';
import {
  removeRecipientAvatarFromSupabase,
  uploadRecipientAvatarToSupabase,
} from '@/lib/uploadRecipientAvatar';

import { MAX_CARE_RECIPIENTS, MAX_NAME_LENGTH } from './constants';
import type { CareRecipient, RecipientAvatarSubmit } from './types';

type CareRecipientsContextValue = {
  recipients: CareRecipient[];
  isReady: boolean;
  isSignedIn: boolean;
  maxRecipients: number;
  canAddMore: boolean;
  /** Rails API 用。`getSession()` でリフレッシュ済みに近い access_token を返す */
  getAccessToken: () => Promise<string | null>;
  /**
   * ログイン API の戻り `data.session` を即反映する。
   * `onAuthStateChange` より前に `refreshRecipients` が走ると sessionRef が空で未ログイン扱いになるのを防ぐ。
   */
  hydrateAuthSession: (session: Session) => void;
  refreshRecipients: () => Promise<void>;
  addRecipient: (
    name: string,
    avatar: RecipientAvatarSubmit,
    nextAdmissionOn: string | null
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  updateRecipient: (
    id: string,
    name: string,
    avatar: RecipientAvatarSubmit,
    nextAdmissionOn: string | null
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
  removeRecipient: (id: string) => Promise<void>;
  getRecipientById: (id: string) => CareRecipient | undefined;
  /**
   * アカウント削除: 可能なら `DELETE /api/v1/account`、404 時は被介護者をAPIで全削除後にサインアウト。
   */
  deleteMyAccountAndSignOut: () => Promise<{ ok: true } | { ok: false; reason: string }>;
};

const CareRecipientsContext = createContext<CareRecipientsContextValue | null>(null);

function normalizeNextAdmissionOn(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/**
 * 作成・更新 API の JSON で `avatar_url` が省略されると `undefined` になり、
 * そのまま正規化すると null 扱いで一覧のアバターが消える。キー省略時は送信直前の値を維持する。
 */
function avatarFromWriteResponse(record: CareRecipientRecord, fallback: string | null): string | null {
  if (record.avatar_url === undefined) {
    return fallback;
  }
  if (record.avatar_url === null) return null;
  const s = String(record.avatar_url).trim();
  return s !== '' ? s : null;
}

function nextAdmissionFromWriteResponse(record: CareRecipientRecord, fallback: string | null): string | null {
  if (record.next_admission_on === undefined) {
    return fallback;
  }
  return normalizeNextAdmissionOn(record.next_admission_on);
}

function mergeRecipientFromWriteResponse(
  base: CareRecipient,
  record: CareRecipientRecord,
  fallbacks: { avatarUrl: string | null; nextAdmissionOn: string | null }
): CareRecipient {
  return {
    ...base,
    avatarUrl: avatarFromWriteResponse(record, fallbacks.avatarUrl),
    nextAdmissionOn: nextAdmissionFromWriteResponse(record, fallbacks.nextAdmissionOn),
  };
}

function normalizeCareRecipient(r: CareRecipientRecord): CareRecipient | null {
  if (r.id == null) return null;
  const id = String(r.id).trim();
  if (!id) return null;
  const rawAvatar = r.avatar_url;
  const avatarUrl =
    typeof rawAvatar === 'string' && rawAvatar.trim() !== '' ? rawAvatar.trim() : null;

  return {
    id,
    name: r.name,
    createdAt: r.created_at,
    avatarUrl,
    nextAdmissionOn: normalizeNextAdmissionOn(r.next_admission_on),
  };
}

function recipientsFromRecords(list: CareRecipientRecord[]): CareRecipient[] {
  return sortRecipients(
    list.map(normalizeCareRecipient).filter((x): x is CareRecipient => x != null)
  );
}

function sortRecipients(list: CareRecipient[]): CareRecipient[] {
  return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function validateName(name: string): { ok: true; name: string } | { ok: false; reason: string } {
  const n = normalizeName(name);
  if (!n) return { ok: false, reason: '名前を入力してください' };
  if (n.length > MAX_NAME_LENGTH) return { ok: false, reason: `名前は${MAX_NAME_LENGTH}文字以内にしてください` };
  return { ok: true, name: n };
}

function errorReason(e: unknown, fallback: string): string {
  if (isApiError(e)) {
    if (e.status === 401) return 'ログインの有効期限が切れたか、未ログインです。再度ログインしてください。';
    if (e.status === 403) return 'この操作を行う権限がありません。';
    if (e.status === 422 && e.body && typeof e.body === 'object' && 'errors' in e.body) {
      const errs = (e.body as { errors: string[] }).errors;
      if (Array.isArray(errs) && errs.length) return errs.join('\n');
    }
    return e.message || fallback;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export function CareRecipientsProvider({ children }: { children: React.ReactNode }) {
  const sessionRef = useRef<Session | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const api = useMemo(() => createCareRecipientsApi({ getAccessToken }), [getAccessToken]);

  const refreshRecipients = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) {
      setRecipients([]);
      return;
    }
    try {
      const list = await api.list();
      setRecipients(recipientsFromRecords(list));
      setIsSignedIn(true);
    } catch (e) {
      if (isApiError(e) && e.status === 401) {
        setIsSignedIn(false);
        setRecipients([]);
      }
    }
  }, [api]);

  const hydrateAuthSession = useCallback(
    (session: Session) => {
      sessionRef.current = session;
      void (async () => {
        try {
          const list = await api.list();
          setRecipients(recipientsFromRecords(list));
          setIsSignedIn(true);
        } catch (e) {
          if (__DEV__) console.error(e);
          if (isApiError(e) && e.status === 401) {
            setIsSignedIn(false);
            setRecipients([]);
          } else {
            setIsSignedIn(true);
            setRecipients([]);
          }
        } finally {
          setIsReady(true);
        }
      })();
    },
    [api]
  );

  useEffect(() => {
    let cancelled = false;

    /**
     * Supabase だけ先に「ログイン」と判定しない。Rails 一覧が成功して初めて isSignedIn true。
     * 引数 session で null 時のクリアもここに集約（TOKEN_REFRESHED 中の中途半端な setIsSignedIn を避ける）
     */
    const syncListOnce = async (session: Session | null) => {
      if (!session) {
        if (!cancelled) {
          setIsSignedIn(false);
          setRecipients([]);
          setIsReady(true);
        }
        return;
      }
      try {
        const list = await api.list();
        if (!cancelled) {
          setRecipients(recipientsFromRecords(list));
          setIsSignedIn(true);
        }
      } catch (e) {
        if (__DEV__) {
          console.error('[CareRecipientsProvider] syncListOnce / care_recipients list failed', {
            apiBaseUrl: getApiBaseUrl(),
            hint:
              '実機では localhost は使えません。.env.local の EXPO_PUBLIC_API_BASE_URL を PC の LAN IP（例: http://192.168.0.12:3000）に。Rails は bin/rails s -b 0.0.0.0',
            error: e,
          });
        }
        if (!cancelled) {
          if (isApiError(e) && e.status === 401) {
            setIsSignedIn(false);
            setRecipients([]);
          } else {
            setIsSignedIn(true);
            setRecipients([]);
          }
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      sessionRef.current = session;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        void syncListOnce(session);
      } else if (event === 'SIGNED_OUT') {
        setIsSignedIn(false);
        setRecipients([]);
        if (!cancelled) setIsReady(true);
      }
      // TOKEN_REFRESHED 等: sessionRef のみ上で更新。isSignedIn は触らず一覧同期の結果を維持
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [api]);

  const addRecipient = useCallback(
    async (
      name: string,
      avatar: RecipientAvatarSubmit,
      nextAdmissionOn: string | null
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const v = validateName(name);
      if (!v.ok) return v;

      if (!sessionRef.current) {
        return { ok: false, reason: 'ログインが必要です。' };
      }

      if (recipients.length >= MAX_CARE_RECIPIENTS) {
        return { ok: false, reason: `登録は${MAX_CARE_RECIPIENTS}人までです` };
      }

      try {
        const created = await api.create({
          name: v.name,
          avatar_url: null,
          next_admission_on: nextAdmissionOn,
        });
        const createdNorm = normalizeCareRecipient(created);
        if (!createdNorm) {
          return { ok: false, reason: 'サーバー応答に ID がありません。しばらくしてから再度お試しください。' };
        }

        let avatarUrl: string | null =
          typeof created.avatar_url === 'string' && created.avatar_url.trim() !== ''
            ? created.avatar_url.trim()
            : null;
        if (avatar.mode === 'picked') {
          try {
            avatarUrl = await uploadRecipientAvatarToSupabase(avatar.tempUri, createdNorm.id);
            const updated = await api.update(createdNorm.id, {
              name: v.name,
              avatar_url: avatarUrl,
              next_admission_on: nextAdmissionOn,
            });
            const updatedNormBase = normalizeCareRecipient(updated);
            if (!updatedNormBase) {
              await refreshRecipients();
              return { ok: false, reason: '更新後のデータを読み取れませんでした。一覧を確認してください。' };
            }
            const updatedNorm = mergeRecipientFromWriteResponse(updatedNormBase, updated, {
              avatarUrl,
              nextAdmissionOn,
            });
            setRecipients((prev) =>
              sortRecipients([...prev.filter((r) => r.id !== updatedNorm.id), updatedNorm])
            );
          } catch (e) {
            await api.destroy(createdNorm.id).catch(() => {});
            await removeRecipientAvatarFromSupabase(createdNorm.id).catch(() => {});
            return { ok: false, reason: errorReason(e, '写真のアップロードに失敗しました。') };
          }
        } else {
          setRecipients((prev) => sortRecipients([...prev, createdNorm]));
        }

        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e, '登録に失敗しました。') };
      }
    },
    [api, recipients.length, refreshRecipients]
  );

  const updateRecipient = useCallback(
    async (
      id: string,
      name: string,
      avatar: RecipientAvatarSubmit,
      nextAdmissionOn: string | null
    ): Promise<{ ok: true } | { ok: false; reason: string }> => {
      const v = validateName(name);
      if (!v.ok) return v;

      const idx = recipients.findIndex((r) => r.id === id);
      if (idx === -1) return { ok: false, reason: '見つかりませんでした' };

      const current = recipients[idx];
      let avatarUrl = current.avatarUrl;

      try {
        if (avatar.mode === 'clear') {
          await removeRecipientAvatarFromSupabase(id).catch(() => {});
          avatarUrl = null;
        } else if (avatar.mode === 'picked') {
          avatarUrl = await uploadRecipientAvatarToSupabase(avatar.tempUri, id);
        } else {
          avatarUrl = current.avatarUrl;
        }

        const updated = await api.update(id, {
          name: v.name,
          avatar_url: avatarUrl,
          next_admission_on: nextAdmissionOn,
        });
        const updatedNormBase = normalizeCareRecipient(updated);
        if (!updatedNormBase) {
          await refreshRecipients();
          return { ok: false, reason: '更新後のデータを読み取れませんでした。一覧を確認してください。' };
        }
        const updatedNorm = mergeRecipientFromWriteResponse(updatedNormBase, updated, {
          avatarUrl,
          nextAdmissionOn,
        });
        setRecipients((prev) =>
          sortRecipients(prev.map((r) => (r.id === id ? updatedNorm : r)))
        );
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: errorReason(e, '更新に失敗しました。') };
      }
    },
    [api, recipients, refreshRecipients]
  );

  const removeRecipient = useCallback(
    async (id: string) => {
      try {
        await api.destroy(id);
        await removeRecipientAvatarFromSupabase(id).catch(() => {});
        setRecipients((prev) => prev.filter((r) => r.id !== id));
      } catch {
        await refreshRecipients();
      }
    },
    [api, refreshRecipients]
  );

  const deleteMyAccountAndSignOut = useCallback(async (): Promise<
    { ok: true } | { ok: false; reason: string }
  > => {
    if (!sessionRef.current) {
      return { ok: false, reason: 'ログインが必要です。' };
    }

    try {
      await destroyMyAccount({ getAccessToken });
    } catch (e) {
      if (isApiError(e) && e.status === 404) {
        try {
          const list = await api.list();
          for (const row of list) {
            const id = row.id != null ? String(row.id).trim() : '';
            if (!id) continue;
            await api.destroy(id);
            await removeRecipientAvatarFromSupabase(id).catch(() => {});
          }
          setRecipients([]);
        } catch (inner) {
          return { ok: false, reason: errorReason(inner, 'データの削除に失敗しました。') };
        }
      } else {
        return { ok: false, reason: errorReason(e, 'アカウントの削除に失敗しました。') };
      }
    }

    try {
      await supabase.auth.signOut();
    } catch {
      /* サーバー側でセッション失効済みの場合など */
    }
    return { ok: true };
  }, [api, getAccessToken]);

  const getRecipientById = useCallback(
    (id: string) => recipients.find((r) => r.id === id),
    [recipients]
  );

  const value = useMemo<CareRecipientsContextValue>(
    () => ({
      recipients,
      isReady,
      isSignedIn,
      maxRecipients: MAX_CARE_RECIPIENTS,
      canAddMore: isSignedIn && recipients.length < MAX_CARE_RECIPIENTS,
      getAccessToken,
      hydrateAuthSession,
      refreshRecipients,
      addRecipient,
      updateRecipient,
      removeRecipient,
      getRecipientById,
      deleteMyAccountAndSignOut,
    }),
    [
      addRecipient,
      deleteMyAccountAndSignOut,
      getAccessToken,
      hydrateAuthSession,
      getRecipientById,
      isReady,
      isSignedIn,
      recipients,
      refreshRecipients,
      removeRecipient,
      updateRecipient,
    ]
  );

  return <CareRecipientsContext.Provider value={value}>{children}</CareRecipientsContext.Provider>;
}

export function useCareRecipients(): CareRecipientsContextValue {
  const ctx = useContext(CareRecipientsContext);
  if (!ctx) {
    throw new Error('useCareRecipients must be used within CareRecipientsProvider');
  }
  return ctx;
}
