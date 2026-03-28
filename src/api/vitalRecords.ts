import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { VitalRecordRecord, VitalRecordWritePayload } from '@/api/types/vitalRecord';

export type VitalRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/vital_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: VitalRecordWritePayload) {
  return { vital_record: payload };
}

export function createVitalRecordsApi(deps: VitalRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<VitalRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<VitalRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<VitalRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<VitalRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: VitalRecordWritePayload): Promise<VitalRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<VitalRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: VitalRecordWritePayload
    ): Promise<VitalRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<VitalRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type VitalRecordsApi = ReturnType<typeof createVitalRecordsApi>;
