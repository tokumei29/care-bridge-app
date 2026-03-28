import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { SleepRecordRecord, SleepRecordWritePayload } from '@/api/types/sleepRecord';

export type SleepRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/sleep_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: SleepRecordWritePayload) {
  return { sleep_record: payload };
}

export function createSleepRecordsApi(deps: SleepRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<SleepRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<SleepRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<SleepRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<SleepRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: SleepRecordWritePayload): Promise<SleepRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<SleepRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: SleepRecordWritePayload
    ): Promise<SleepRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<SleepRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type SleepRecordsApi = ReturnType<typeof createSleepRecordsApi>;
