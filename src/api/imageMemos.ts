import { apiRequest } from '@/api/http';
import { ApiError } from '@/api/errors';
import type { ImageMemoRecord, ImageMemoWritePayload } from '@/api/types/imageMemo';

export type ImageMemosApiDeps = {
  getAccessToken: () => Promise<string | null>;
};

function basePath(careRecipientId: string): string {
  return `/api/v1/care_recipients/${encodeURIComponent(careRecipientId)}/image_memos`;
}

async function requireToken(getAccessToken: () => Promise<string | null>): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('ログインが必要です', 401);
  }
  return token;
}

function wrapBody(payload: ImageMemoWritePayload) {
  return { image_memo: payload };
}

export function createImageMemosApi(deps: ImageMemosApiDeps) {
  const { getAccessToken } = deps;

  return {
    async list(careRecipientId: string): Promise<ImageMemoRecord[]> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ImageMemoRecord[]>(basePath(careRecipientId), {
        method: 'GET',
        accessToken: token,
      });
    },

    async show(careRecipientId: string, id: string): Promise<ImageMemoRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ImageMemoRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
        method: 'GET',
        accessToken: token,
      });
    },

    async create(careRecipientId: string, payload: ImageMemoWritePayload): Promise<ImageMemoRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ImageMemoRecord>(basePath(careRecipientId), {
        method: 'POST',
        accessToken: token,
        body: wrapBody(payload),
      });
    },

    async update(
      careRecipientId: string,
      id: string,
      payload: ImageMemoWritePayload
    ): Promise<ImageMemoRecord> {
      const token = await requireToken(getAccessToken);
      return apiRequest<ImageMemoRecord>(`${basePath(careRecipientId)}/${encodeURIComponent(id)}`, {
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

export type ImageMemosApi = ReturnType<typeof createImageMemosApi>;
