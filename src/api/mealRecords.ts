import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { MealRecordRecord, MealRecordWritePayload } from '@/api/types/mealRecord';

export type MealRecordsApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/meal_records`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: MealRecordWritePayload) {
  return { meal_record: payload };
}

export function createMealRecordsApi(deps: MealRecordsApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<MealRecordRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<MealRecordRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<MealRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<MealRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: MealRecordWritePayload): Promise<MealRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<MealRecordRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: MealRecordWritePayload
    ): Promise<MealRecordRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<MealRecordRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type MealRecordsApi = ReturnType<typeof createMealRecordsApi>;
