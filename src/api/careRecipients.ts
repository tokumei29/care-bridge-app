import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { CareRecipientRecord, CareRecipientWritePayload } from '@/api/types/careRecipient';

const BASE = '/api/v1/care_recipients';

export type CareRecipientsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: CareRecipientWritePayload) {
  return { care_recipient: payload };
}

export function createCareRecipientsApi(deps: CareRecipientsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(): Promise<CareRecipientRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<CareRecipientRecord[]>(BASE, { method: 'GET', accessToken: token });
    },

    async show(id: string): Promise<CareRecipientRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<CareRecipientRecord>(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(payload: CareRecipientWritePayload): Promise<CareRecipientRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<CareRecipientRecord>(BASE, {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(id: string, payload: CareRecipientWritePayload): Promise<CareRecipientRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<CareRecipientRecord>(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async destroy(id: string): Promise<void> {
      const token = await requireToken(getAccessToken);
      await apiRequest<void>(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        accessToken: token,
      });
    },
  };
}

export type CareRecipientsApi = ReturnType<typeof createCareRecipientsApi>;
