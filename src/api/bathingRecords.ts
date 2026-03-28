import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { BathingRecordRecord, BathingRecordWritePayload } from '@/api/types/bathingRecord';

export type BathingRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/bathing_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: BathingRecordWritePayload) {
  return { bathing_record: payload };
}

export function createBathingRecordsApi(deps: BathingRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<BathingRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<BathingRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<BathingRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<BathingRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: BathingRecordWritePayload): Promise<BathingRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<BathingRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: BathingRecordWritePayload
    ): Promise<BathingRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<BathingRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type BathingRecordsApi = ReturnType<typeof createBathingRecordsApi>;
