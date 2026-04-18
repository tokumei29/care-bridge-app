import { publicJsonRequest } from '@/api/publicHttp';

export type ContactInquiryPayload = {
  name?: string;
  email: string;
  message: string;
};

/** POST /api/v1/public/contact_inquiries — サーバーが SMTP で送信 */
export async function submitContactInquiry(payload: ContactInquiryPayload): Promise<void> {
  await publicJsonRequest<void>('/api/v1/public/contact_inquiries', {
    method: 'POST',
    body: {
      name: payload.name?.trim() ?? '',
      email: payload.email.trim(),
      message: payload.message.trim(),
    },
  });
}
