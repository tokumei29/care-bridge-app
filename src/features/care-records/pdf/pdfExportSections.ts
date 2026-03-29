/** API `care_record_pdf_export.included_sections` と Rails PdfExportRequest::SECTION_KEYS に対応 */
export const PDF_EXPORT_SECTION_KEYS = [
  'meals',
  'excretion',
  'vitals',
  'bathing',
  'rehab',
  'sleep',
  'image_memos',
  'other_notes',
] as const;

export type PdfExportSectionKey = (typeof PDF_EXPORT_SECTION_KEYS)[number];

export const PDF_EXPORT_SECTION_LABELS: Record<PdfExportSectionKey, string> = {
  meals: '食事',
  excretion: '排泄',
  vitals: 'バイタル',
  bathing: '入浴',
  rehab: 'リハビリ',
  sleep: '睡眠',
  image_memos: '画像メモ',
  other_notes: 'その他の気づき',
};

export function createDefaultPdfExportSectionSelection(): Record<PdfExportSectionKey, boolean> {
  return Object.fromEntries(PDF_EXPORT_SECTION_KEYS.map((k) => [k, true])) as Record<
    PdfExportSectionKey,
    boolean
  >;
}
