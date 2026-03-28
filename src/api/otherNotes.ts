import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { OtherNoteRecord, OtherNoteWritePayload } from '@/api/types/otherNote';

export type OtherNotesApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/other_notes`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: OtherNoteWritePayload) {
  return { other_note: payload };
}

export function createOtherNotesApi(deps: OtherNotesApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<OtherNoteRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<OtherNoteRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<OtherNoteRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<OtherNoteRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: OtherNoteWritePayload): Promise<OtherNoteRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<OtherNoteRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: OtherNoteWritePayload
    ): Promise<OtherNoteRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<OtherNoteRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async destroy(careRecipientId: string, id: string): Promise<void> {
      const token = await requireToken(getAccessToken);
      await apiRequest<void>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        accessToken: token,
      });
    },
  };
}

export type OtherNotesApi = ReturnType<typeof createOtherNotesApi>;
