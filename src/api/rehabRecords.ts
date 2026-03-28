import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { RehabRecordRecord, RehabRecordWritePayload } from '@/api/types/rehabRecord';

export type RehabRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/rehab_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: RehabRecordWritePayload) {
  return { rehab_record: payload };
}

export function createRehabRecordsApi(deps: RehabRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<RehabRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<RehabRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<RehabRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<RehabRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: RehabRecordWritePayload): Promise<RehabRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<RehabRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: RehabRecordWritePayload
    ): Promise<RehabRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<RehabRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type RehabRecordsApi = ReturnType<typeof createRehabRecordsApi>;
