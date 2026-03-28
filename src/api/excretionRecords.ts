import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { ExcretionRecordRecord, ExcretionRecordWritePayload } from '@/api/types/excretionRecord';

export type ExcretionRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/excretion_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: ExcretionRecordWritePayload) {
  return { excretion_record: payload };
}

export function createExcretionRecordsApi(deps: ExcretionRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<ExcretionRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ExcretionRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<ExcretionRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ExcretionRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: ExcretionRecordWritePayload): Promise<ExcretionRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ExcretionRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: ExcretionRecordWritePayload
    ): Promise<ExcretionRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ExcretionRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type ExcretionRecordsApi = ReturnType<typeof createExcretionRecordsApi>;
