import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { careRecordPdfDebugLog } from '@/api/careRecordPdfDebugLog';
import { isApiError } from '@/api/errors';
import { apiRequestPdfPost } from '@/api/httpPdf';
import { useCareRecipients } from '@/features/care-recipients';
import {
  addDaysToDateKey,
  compareDateKeys,
  countInclusiveCalendarDays,
  formatJapanDateLabel,
  lastDayKeyInInclusiveRange,
  pickDefaultDayKeyForPdfExport,
} from '@/features/care-records/pdf/dayKeyUtils';
import {
  PDF_EXPORT_CREATOR_NAME_MAX,
  PDF_EXPORT_MAX_DAILY_SPAN_DAYS,
  PDF_EXPORT_RECIPIENT_NAME_MAX,
  PDF_EXPORT_SHARE_NOTE_MAX_LENGTH,
} from '@/features/care-records/pdf/pdfExportConstants';
import {
  PDF_EXPORT_SECTION_KEYS,
  PDF_EXPORT_SECTION_LABELS,
  createDefaultPdfExportSectionSelection,
  type PdfExportSectionKey,
} from '@/features/care-records/pdf/pdfExportSections';
import {
  compareMonthKeys,
  formatJapanMonthLabel,
} from '@/features/care-records/pdf/monthKeyUtils';
import { usePdfExportDayKeys } from '@/features/care-records/pdf/usePdfExportDayKeys';
import { usePdfExportMonthKeys } from '@/features/care-records/pdf/usePdfExportMonthKeys';
import {
  composeEmailWithPdf,
  openSystemShareSheetForPdf,
  openWebMailComposeWithoutAttachment,
  savePdfToUserPickedDirectory,
  sharePdfWithWebShareApi,
} from '@/features/care-records/pdf/pdfExportActions';
import { useCareRecipientStackBackHeader } from '@/features/care-records/useCareRecipientStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

export type PdfExportMode = 'month' | 'day';

export type PdfExportFormPayload =
  | {
      exportMode: 'month';
      recipientDisplayName: string;
      monthStart: string;
      monthEnd: string;
      creatorName: string;
      shareNote: string;
      includedSections: PdfExportSectionKey[];
    }
  | {
      exportMode: 'day';
      recipientDisplayName: string;
      dayStart: string;
      dayEnd: string;
      creatorName: string;
      shareNote: string;
      includedSections: PdfExportSectionKey[];
    };

type Props = {
  recipientId: string;
  exportMode: PdfExportMode;
};

function buildCareRecordPdfExportBody(payload: PdfExportFormPayload): {
  care_record_pdf_export: Record<string, unknown>;
} {
  const common: Record<string, unknown> = {
    display_name: payload.recipientDisplayName || '',
    author_name: payload.creatorName || '',
    shared_notes: payload.shareNote || '',
    included_sections: payload.includedSections,
  };

  if (payload.exportMode === 'month') {
    common.start_month = payload.monthStart;
    common.end_month = payload.monthEnd;
  } else {
    common.start_on = payload.dayStart;
    common.end_on = payload.dayEnd;
  }

  return { care_record_pdf_export: common };
}

function pdfFilenameForPayload(payload: PdfExportFormPayload): string {
  if (payload.exportMode === 'month') {
    return `care-records-${payload.monthStart}_${payload.monthEnd}.pdf`;
  }
  return `care-records-daily-${payload.dayStart}_${payload.dayEnd}.pdf`;
}

function MonthPickerModal({
  visible,
  title,
  monthKeys,
  selectedKey,
  onSelect,
  onClose,
  c,
}: {
  visible: boolean;
  title: string;
  monthKeys: string[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
  c: ReturnType<typeof getCareBridgeColors>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: c.surfaceSolid,
              borderColor: c.borderStrong,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.modalTitle, { color: c.text }]}>{title}</Text>
          <FlatList
            data={monthKeys}
            keyExtractor={(item) => item}
            style={styles.modalList}
            renderItem={({ item }) => {
              const on = item === selectedKey;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[
                    styles.modalRow,
                    {
                      backgroundColor: on ? c.accentMuted : 'transparent',
                      borderColor: c.border,
                    },
                  ]}>
                  <Text style={[styles.modalRowText, { color: c.text }]}>{formatJapanMonthLabel(item)}</Text>
                </Pressable>
              );
            }}
          />
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>キャンセル</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DayPickerModal({
  visible,
  title,
  dayKeys,
  selectedKey,
  onSelect,
  onClose,
  c,
}: {
  visible: boolean;
  title: string;
  dayKeys: string[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
  c: ReturnType<typeof getCareBridgeColors>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: c.surfaceSolid,
              borderColor: c.borderStrong,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.modalTitle, { color: c.text }]}>{title}</Text>
          <FlatList
            data={dayKeys}
            keyExtractor={(item) => item}
            style={styles.modalList}
            renderItem={({ item }) => {
              const on = item === selectedKey;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[
                    styles.modalRow,
                    {
                      backgroundColor: on ? c.accentMuted : 'transparent',
                      borderColor: c.border,
                    },
                  ]}>
                  <Text style={[styles.modalRowText, { color: c.text }]}>{formatJapanDateLabel(item)}</Text>
                </Pressable>
              );
            }}
          />
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>キャンセル</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type PdfDeliveryState = {
  arrayBuffer: ArrayBuffer;
  filename: string;
  mailSubject: string;
  mailBody: string;
};

export function PdfExportScreen({ recipientId, exportMode }: Props) {
  const router = useRouter();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const { getRecipientById, isReady, isSignedIn, getAccessToken } = useCareRecipients();
  useCareRecipientStackBackHeader(recipientId, c);

  const recipient = getRecipientById(recipientId);
  const { monthKeys, loading: monthsLoading, error: monthsError } = usePdfExportMonthKeys(
    exportMode === 'month' ? recipientId : undefined
  );
  const { dayKeys, loading: daysLoading, error: daysError } = usePdfExportDayKeys(
    exportMode === 'day' ? recipientId : undefined
  );

  const [recipientDisplayName, setRecipientDisplayName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [monthStart, setMonthStart] = useState<string | null>(null);
  const [monthEnd, setMonthEnd] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [dayStart, setDayStart] = useState<string | null>(null);
  const [dayEnd, setDayEnd] = useState<string | null>(null);
  const [pickerTargetDay, setPickerTargetDay] = useState<'start' | 'end' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryPdf, setDeliveryPdf] = useState<PdfDeliveryState | null>(null);
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [sectionIncluded, setSectionIncluded] = useState(createDefaultPdfExportSectionSelection);

  const rangeInitRef = useRef(false);
  const recipientInitRef = useRef(false);

  useEffect(() => {
    if (!recipientId) return;
    recipientInitRef.current = false;
    rangeInitRef.current = false;
    setSectionIncluded(createDefaultPdfExportSectionSelection());
    setDeliveryPdf(null);
    setDeliveryBusy(false);
    setDayStart(null);
    setDayEnd(null);
  }, [recipientId]);

  useEffect(() => {
    if (!deliveryPdf) return;
    careRecordPdfDebugLog('delivery modal state: PDF ready', {
      bytes: deliveryPdf.arrayBuffer.byteLength,
      filename: deliveryPdf.filename,
      platform: Platform.OS,
    });
  }, [deliveryPdf]);

  useEffect(() => {
    if (recipientInitRef.current || !recipient) return;
    setRecipientDisplayName(recipient.name);
    recipientInitRef.current = true;
  }, [recipient]);

  useEffect(() => {
    if (exportMode !== 'month') return;
    if (rangeInitRef.current || monthKeys.length === 0) return;
    setMonthStart(monthKeys[0]!);
    setMonthEnd(monthKeys[monthKeys.length - 1]!);
    rangeInitRef.current = true;
  }, [exportMode, monthKeys]);

  useEffect(() => {
    if (exportMode !== 'day') return;
    if (rangeInitRef.current || dayKeys.length === 0) return;
    const d = pickDefaultDayKeyForPdfExport(dayKeys);
    if (d) {
      setDayStart(d);
      setDayEnd(d);
    }
    rangeInitRef.current = true;
  }, [exportMode, dayKeys]);

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      router.replace('/auth/login');
      return;
    }
    if (!recipient) {
      router.replace('/');
    }
  }, [isReady, isSignedIn, recipient, router]);

  const endPickerDayKeys = useMemo(() => {
    if (exportMode !== 'day' || !dayStart) return dayKeys;
    const maxEnd = addDaysToDateKey(dayStart, PDF_EXPORT_MAX_DAILY_SPAN_DAYS - 1);
    return dayKeys.filter(
      (k) => compareDateKeys(k, dayStart) >= 0 && compareDateKeys(k, maxEnd) <= 0
    );
  }, [exportMode, dayKeys, dayStart]);

  const screenTitle =
    exportMode === 'day' ? 'PDF出力（日・最大14日）' : 'PDF出力（月）';

  const periodBlocked =
    exportMode === 'month'
      ? monthsLoading || monthKeys.length === 0
      : daysLoading || dayKeys.length === 0;

  const onSubmit = async () => {
    const creator = creatorName.trim();

    if (exportMode === 'month') {
      if (!monthStart || !monthEnd) {
        Alert.alert('出力できません', '記録がある月がまだありません。先に介護記録を登録してください。');
        return;
      }
      if (compareMonthKeys(monthStart, monthEnd) > 0) {
        Alert.alert('入力を確認してください', '出力期間の「はじめ」の月が「おわり」より後になっています。');
        return;
      }
    } else {
      if (!dayStart || !dayEnd) {
        Alert.alert('出力できません', '記録がある日がまだありません。先に介護記録を登録してください。');
        return;
      }
      if (compareDateKeys(dayStart, dayEnd) > 0) {
        Alert.alert('入力を確認してください', '出力期間の「はじめ」の日が「おわり」より後になっています。');
        return;
      }
      const span = countInclusiveCalendarDays(dayStart, dayEnd);
      if (span > PDF_EXPORT_MAX_DAILY_SPAN_DAYS) {
        Alert.alert(
          '入力を確認してください',
          `日単位の出力は最大${PDF_EXPORT_MAX_DAILY_SPAN_DAYS}日までです。期間を短くしてください。`
        );
        return;
      }
    }

    const includedSections = PDF_EXPORT_SECTION_KEYS.filter((k) => sectionIncluded[k]);
    if (includedSections.length === 0) {
      Alert.alert('入力を確認してください', 'PDFに含める記録の種類を1つ以上選んでください。');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      Alert.alert('ログインが必要です', 'もう一度ログインしてください。');
      return;
    }

    const payload: PdfExportFormPayload =
      exportMode === 'month'
        ? {
            exportMode: 'month',
            recipientDisplayName: recipientDisplayName.trim(),
            monthStart: monthStart!,
            monthEnd: monthEnd!,
            creatorName: creator,
            shareNote: shareNote.trim(),
            includedSections,
          }
        : {
            exportMode: 'day',
            recipientDisplayName: recipientDisplayName.trim(),
            dayStart: dayStart!,
            dayEnd: dayEnd!,
            creatorName: creator,
            shareNote: shareNote.trim(),
            includedSections,
          };

    setSubmitting(true);
    try {
      const body = buildCareRecordPdfExportBody(payload);
      const path = `/api/v1/care_recipients/${encodeURIComponent(recipientId)}/care_record_pdf_exports`;
      careRecordPdfDebugLog('onSubmit: requesting PDF', { path, recipientId });
      const pdfBuf = await apiRequestPdfPost(path, { body, accessToken: token });
      const display = recipientDisplayName.trim();
      careRecordPdfDebugLog('onSubmit: got buffer, opening delivery modal', {
        bytes: pdfBuf.byteLength,
        filename: pdfFilenameForPayload(payload),
      });
      setDeliveryPdf({
        arrayBuffer: pdfBuf,
        filename: pdfFilenameForPayload(payload),
        mailSubject: display ? `${display}さんの介護記録PDF` : '介護記録PDF',
        mailBody: shareNote.trim(),
      });
    } catch (e) {
      careRecordPdfDebugLog('onSubmit: PDF request failed', {
        message: isApiError(e) ? e.message : String(e),
        isApiError: isApiError(e),
      });
      Alert.alert('PDFの取得に失敗', isApiError(e) ? e.message : '時間をおいて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady || !recipient) {
    return (
      <ScreenBackdrop>
        <>
          <Stack.Screen options={{ title: screenTitle }} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        </>
      </ScreenBackdrop>
    );
  }

  const inputStyle = [
    styles.input,
    {
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSolid,
      color: c.text,
    },
  ];

  const multilineStyle = [
    styles.input,
    styles.inputMultiline,
    {
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceSolid,
      color: c.text,
    },
  ];

  return (
    <ScreenBackdrop>
        <>
        <Stack.Screen options={{ title: screenTitle }} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
            <ContentRail layout={layout}>
              <Text style={[styles.lead, { color: c.textSecondary }]}>
                {exportMode === 'month'
                  ? '記録内容の概要をPDFにまとめ、遠方のご家族へLINEで共有したり、要介護認定の疎明資料などに使える想定です。出力は月単位です。'
                  : `記録内容の概要をPDFにまとめます。出力は日単位で、期間は最大${PDF_EXPORT_MAX_DAILY_SPAN_DAYS}日までです（記録がある日だけ選べます）。`}
              </Text>

              <Text style={[styles.sectionTitle, { color: c.text }]}>被介護者氏名（任意）</Text>
              <Text style={[styles.hint, { color: c.textSecondary }]}>
                アプリの表示名が自動で入ります。疎明資料に使う場合は戸籍に合わせた正式なお名前へ修正してください。
              </Text>
              <TextInput
                value={recipientDisplayName}
                onChangeText={(t) => setRecipientDisplayName(t.slice(0, PDF_EXPORT_RECIPIENT_NAME_MAX))}
                placeholder="例: 山田 花子"
                placeholderTextColor={c.textSecondary}
                style={inputStyle}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.counter, { color: c.textSecondary }]}>
                {recipientDisplayName.length} / {PDF_EXPORT_RECIPIENT_NAME_MAX}
              </Text>

              {exportMode === 'month' ? (
                <>
                  <Text style={[styles.sectionTitleSpaced, { color: c.text }]}>出力期間（月単位）</Text>
                  <Text style={[styles.hint, { color: c.textSecondary }]}>
                    いずれかの記録がある月だけ選べます（食事・排泄・バイタル・入浴・リハ・睡眠・画像メモ・その他メモを対象）。
                  </Text>
                  {monthsLoading ? (
                    <ActivityIndicator color={c.accent} style={styles.monthSpinner} />
                  ) : monthsError ? (
                    <Text style={[styles.errorText, { color: c.danger }]}>{monthsError}</Text>
                  ) : monthKeys.length === 0 ? (
                    <Text style={[styles.emptyMonths, { color: c.textSecondary }]}>
                      まだ記録がある月がありません。記録を追加してから再度お試しください。
                    </Text>
                  ) : (
                    <View style={styles.monthRow}>
                      <View style={styles.monthCol}>
                        <Text style={[styles.monthLabel, { color: c.textSecondary }]}>はじめ</Text>
                        <Pressable
                          onPress={() => setPickerTarget('start')}
                          style={({ pressed }) => [
                            styles.monthBtn,
                            {
                              borderColor: c.borderStrong,
                              backgroundColor: c.surfaceSolid,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}>
                          <Text style={[styles.monthBtnText, { color: c.text }]}>
                            {monthStart ? formatJapanMonthLabel(monthStart) : '—'}
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={[styles.monthTilde, { color: c.textSecondary }]}>〜</Text>
                      <View style={styles.monthCol}>
                        <Text style={[styles.monthLabel, { color: c.textSecondary }]}>おわり</Text>
                        <Pressable
                          onPress={() => setPickerTarget('end')}
                          style={({ pressed }) => [
                            styles.monthBtn,
                            {
                              borderColor: c.borderStrong,
                              backgroundColor: c.surfaceSolid,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}>
                          <Text style={[styles.monthBtnText, { color: c.text }]}>
                            {monthEnd ? formatJapanMonthLabel(monthEnd) : '—'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitleSpaced, { color: c.text }]}>出力期間（日単位）</Text>
                  <Text style={[styles.hint, { color: c.textSecondary }]}>
                    記録がある日だけ選べます。「おわり」は「はじめ」から最大{PDF_EXPORT_MAX_DAILY_SPAN_DAYS}
                    日以内に絞り込んで表示しています。
                  </Text>
                  {daysLoading ? (
                    <ActivityIndicator color={c.accent} style={styles.monthSpinner} />
                  ) : daysError ? (
                    <Text style={[styles.errorText, { color: c.danger }]}>{daysError}</Text>
                  ) : dayKeys.length === 0 ? (
                    <Text style={[styles.emptyMonths, { color: c.textSecondary }]}>
                      まだ記録がある日がありません。記録を追加してから再度お試しください。
                    </Text>
                  ) : (
                    <View style={styles.monthRow}>
                      <View style={styles.monthCol}>
                        <Text style={[styles.monthLabel, { color: c.textSecondary }]}>はじめ</Text>
                        <Pressable
                          onPress={() => setPickerTargetDay('start')}
                          style={({ pressed }) => [
                            styles.monthBtn,
                            {
                              borderColor: c.borderStrong,
                              backgroundColor: c.surfaceSolid,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}>
                          <Text style={[styles.monthBtnText, { color: c.text }]}>
                            {dayStart ? formatJapanDateLabel(dayStart) : '—'}
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={[styles.monthTilde, { color: c.textSecondary }]}>〜</Text>
                      <View style={styles.monthCol}>
                        <Text style={[styles.monthLabel, { color: c.textSecondary }]}>おわり</Text>
                        <Pressable
                          onPress={() => setPickerTargetDay('end')}
                          style={({ pressed }) => [
                            styles.monthBtn,
                            {
                              borderColor: c.borderStrong,
                              backgroundColor: c.surfaceSolid,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}>
                          <Text style={[styles.monthBtnText, { color: c.text }]}>
                            {dayEnd ? formatJapanDateLabel(dayEnd) : '—'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </>
              )}

              <Text style={[styles.sectionTitleSpaced, { color: c.text }]}>PDFに含める記録</Text>
              <Text style={[styles.hint, { color: c.textSecondary }]}>
                件数サマリーに載せるカテゴリを選びます（バックエンドの出力と一致させています）。
              </Text>
              <View style={styles.sectionToggleList}>
                {PDF_EXPORT_SECTION_KEYS.map((key) => {
                  const on = sectionIncluded[key];
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSectionIncluded((prev) => ({ ...prev, [key]: !prev[key] }))}
                      style={({ pressed }) => [
                        styles.sectionToggleRow,
                        {
                          borderColor: c.borderStrong,
                          backgroundColor: c.surfaceSolid,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <View
                        style={[
                          styles.sectionCheckMark,
                          {
                            borderColor: c.accent,
                            backgroundColor: on ? c.accent : 'transparent',
                          },
                        ]}>
                        {on ? <Text style={styles.sectionCheckMarkGlyph}>✓</Text> : null}
                      </View>
                      <Text style={[styles.sectionToggleLabel, { color: c.text }]}>
                        {PDF_EXPORT_SECTION_LABELS[key]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitleSpaced, { color: c.text }]}>作成者名（任意）</Text>
              <Text style={[styles.hint, { color: c.textSecondary }]}>
                PDFに記載する場合は、作成した方のお名前を入力してください。
              </Text>
              <TextInput
                value={creatorName}
                onChangeText={(t) => setCreatorName(t.slice(0, PDF_EXPORT_CREATOR_NAME_MAX))}
                placeholder="例: 山田 太郎（長男）"
                placeholderTextColor={c.textSecondary}
                style={inputStyle}
                autoCapitalize="none"
              />
              <Text style={[styles.counter, { color: c.textSecondary }]}>
                {creatorName.length} / {PDF_EXPORT_CREATOR_NAME_MAX}
              </Text>

              <Text style={[styles.sectionTitleSpaced, { color: c.text }]}>
                施設名・共有したいこと（任意）
              </Text>
              <Text style={[styles.hint, { color: c.textSecondary }]}>
                利用中のデイサービス名、主治医、注意事項など、受け取る方に伝えたいことを自由に入力できます。
              </Text>
              <TextInput
                value={shareNote}
                onChangeText={(t) => setShareNote(t.slice(0, PDF_EXPORT_SHARE_NOTE_MAX_LENGTH))}
                placeholder="例: ○○デイサービス週2利用。血圧は朝食後に測定しています。"
                placeholderTextColor={c.textSecondary}
                style={multilineStyle}
                multiline
                textAlignVertical="top"
              />
              <Text style={[styles.counter, { color: c.textSecondary }]}>
                {shareNote.length} / {PDF_EXPORT_SHARE_NOTE_MAX_LENGTH}
              </Text>

              <Pressable
                onPress={() => void onSubmit()}
                disabled={submitting || periodBlocked}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: c.accent,
                    opacity: submitting || periodBlocked || pressed ? 0.75 : 1,
                  },
                ]}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>この内容でPDFを出力</Text>
                )}
              </Pressable>
            </ContentRail>
          </ScrollView>
        </KeyboardAvoidingView>

        <MonthPickerModal
          visible={pickerTarget === 'start'}
          title="期間のはじめ（月）"
          monthKeys={monthKeys}
          selectedKey={monthStart}
          onSelect={(key) => {
            setMonthStart(key);
            if (monthEnd && compareMonthKeys(key, monthEnd) > 0) {
              setMonthEnd(key);
            }
          }}
          onClose={() => setPickerTarget(null)}
          c={c}
        />
        <MonthPickerModal
          visible={pickerTarget === 'end'}
          title="期間のおわり（月）"
          monthKeys={monthKeys}
          selectedKey={monthEnd}
          onSelect={(key) => {
            setMonthEnd(key);
            if (monthStart && compareMonthKeys(monthStart, key) > 0) {
              setMonthStart(key);
            }
          }}
          onClose={() => setPickerTarget(null)}
          c={c}
        />

        <DayPickerModal
          visible={pickerTargetDay === 'start'}
          title="期間のはじめ（日）"
          dayKeys={dayKeys}
          selectedKey={dayStart}
          onSelect={(key) => {
            setDayStart(key);
            setDayEnd((prev) => {
              if (!prev) return key;
              if (compareDateKeys(key, prev) > 0) return key;
              const maxEnd = addDaysToDateKey(key, PDF_EXPORT_MAX_DAILY_SPAN_DAYS - 1);
              if (countInclusiveCalendarDays(key, prev) <= PDF_EXPORT_MAX_DAILY_SPAN_DAYS) return prev;
              return lastDayKeyInInclusiveRange(dayKeys, key, maxEnd) ?? key;
            });
          }}
          onClose={() => setPickerTargetDay(null)}
          c={c}
        />
        <DayPickerModal
          visible={pickerTargetDay === 'end'}
          title="期間のおわり（日）"
          dayKeys={endPickerDayKeys.length > 0 ? endPickerDayKeys : dayKeys}
          selectedKey={dayEnd}
          onSelect={(key) => {
            if (!dayStart) {
              setDayStart(key);
              setDayEnd(key);
              return;
            }
            if (compareDateKeys(dayStart, key) > 0) {
              setDayStart(key);
              setDayEnd(key);
              return;
            }
            const maxEnd = addDaysToDateKey(dayStart, PDF_EXPORT_MAX_DAILY_SPAN_DAYS - 1);
            if (compareDateKeys(key, maxEnd) > 0) {
              setDayEnd(lastDayKeyInInclusiveRange(dayKeys, dayStart, maxEnd) ?? dayStart);
              return;
            }
            setDayEnd(key);
          }}
          onClose={() => setPickerTargetDay(null)}
          c={c}
        />

        <Modal
          visible={deliveryPdf !== null}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (deliveryBusy) return;
            careRecordPdfDebugLog('delivery modal onRequestClose');
            setDeliveryPdf(null);
          }}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (deliveryBusy) return;
              careRecordPdfDebugLog('delivery modal backdrop dismiss');
              setDeliveryPdf(null);
            }}>
            <Pressable
              style={[
                styles.modalCard,
                {
                  backgroundColor: c.surfaceSolid,
                  borderColor: c.borderStrong,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
              onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: c.text }]}>PDFの送り方</Text>
              <Text style={[styles.deliveryHint, { color: c.textSecondary }]}>
                {deliveryBusy
                  ? '処理中です。フォルダや共有の画面が出ている間は、この画面を閉じずにお待ちください。'
                  : Platform.OS === 'web'
                    ? 'ブラウザではメールに PDF を自動添付できません。メールを使う場合は先に「ファイルに保存」でダウンロードし、メールに手で添付してください。'
                    : '「ファイルに保存」ではまずフォルダを選びます。ピッカーが出ない場合は自動で共有画面が開くので、「ファイルに保存」やクラウドを選んでください。'}
              </Text>
              {deliveryBusy ? (
                <View style={styles.deliveryBusyBox}>
                  <ActivityIndicator size="large" color={c.accent} />
                </View>
              ) : null}
              <Pressable
                disabled={deliveryBusy}
                onPress={() => {
                  if (!deliveryPdf || deliveryBusy) return;
                  const snap = deliveryPdf;
                  careRecordPdfDebugLog('delivery UI: tap ファイルに保存', {
                    bytes: snap.arrayBuffer.byteLength,
                    filename: snap.filename,
                  });
                  setDeliveryBusy(true);
                  void (async () => {
                    try {
                      await savePdfToUserPickedDirectory(snap.arrayBuffer, snap.filename);
                    } finally {
                      setDeliveryBusy(false);
                      setDeliveryPdf(null);
                    }
                  })();
                }}
                style={({ pressed }) => [
                  styles.deliveryActionRow,
                  {
                    backgroundColor: c.surfaceSolid,
                    borderColor: c.borderStrong,
                    opacity: deliveryBusy ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}>
                <Text style={[styles.modalRowText, { color: c.text }]}>ファイルに保存（ダウンロード）</Text>
              </Pressable>
              <Pressable
                disabled={deliveryBusy}
                onPress={() => {
                  if (!deliveryPdf || deliveryBusy) return;
                  const snap = deliveryPdf;
                  careRecordPdfDebugLog('delivery UI: tap メールで送る', { platform: Platform.OS });
                  setDeliveryBusy(true);
                  void (async () => {
                    try {
                      if (Platform.OS === 'web') {
                        openWebMailComposeWithoutAttachment(snap.mailSubject, snap.mailBody);
                      } else {
                        await composeEmailWithPdf(snap.arrayBuffer, snap.filename, {
                          subject: snap.mailSubject,
                          body: snap.mailBody,
                        });
                      }
                    } finally {
                      setDeliveryBusy(false);
                      setDeliveryPdf(null);
                    }
                  })();
                }}
                style={({ pressed }) => [
                  styles.deliveryActionRow,
                  {
                    backgroundColor: c.surfaceSolid,
                    borderColor: c.borderStrong,
                    opacity: deliveryBusy ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}>
                <Text style={[styles.modalRowText, { color: c.text }]}>メールで送る</Text>
              </Pressable>
              <Pressable
                disabled={deliveryBusy}
                onPress={() => {
                  if (!deliveryPdf || deliveryBusy) return;
                  const snap = deliveryPdf;
                  careRecordPdfDebugLog('delivery UI: tap LINEで共有', { platform: Platform.OS });
                  setDeliveryBusy(true);
                  void (async () => {
                    try {
                      if (Platform.OS === 'web') {
                        const r = await sharePdfWithWebShareApi(snap.arrayBuffer, snap.filename);
                        if (r === 'unsupported') {
                          Alert.alert(
                            '共有できませんでした',
                            'このブラウザでは PDF の共有に対応していないことがあります。「ファイルに保存」からダウンロードし、LINE などから送ってください。'
                          );
                        }
                      } else {
                        await openSystemShareSheetForPdf(snap.arrayBuffer, snap.filename);
                      }
                    } finally {
                      setDeliveryBusy(false);
                      setDeliveryPdf(null);
                    }
                  })();
                }}
                style={({ pressed }) => [
                  styles.deliveryActionRow,
                  {
                    backgroundColor: c.surfaceSolid,
                    borderColor: c.borderStrong,
                    opacity: deliveryBusy ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}>
                <Text style={[styles.modalRowText, { color: c.text }]}>LINEで共有</Text>
                <Text style={[styles.deliveryLineSub, { color: c.textSecondary }]}>
                  （ほかの連絡アプリも一覧から選べます）
                </Text>
              </Pressable>
              <Pressable
                disabled={deliveryBusy}
                onPress={() => {
                  if (deliveryBusy) return;
                  careRecordPdfDebugLog('delivery UI: tap 閉じる');
                  setDeliveryPdf(null);
                }}
                style={styles.modalCancel}>
                <Text style={{ color: c.accent, fontWeight: '800' }}>閉じる</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lead: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionTitleSpaced: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 22,
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 10,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: 12,
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  monthSpinner: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 8,
  },
  emptyMonths: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginVertical: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  monthCol: {
    flex: 1,
    minWidth: 0,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  monthTilde: {
    fontSize: 18,
    fontWeight: '800',
    paddingBottom: 12,
  },
  monthBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  monthBtnText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionToggleList: {
    gap: 8,
  },
  sectionToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionCheckMark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCheckMarkGlyph: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionToggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 28,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '72%',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  deliveryHint: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 14,
    textAlign: 'left',
  },
  deliveryLineSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  deliveryBusyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  modalList: {
    flexGrow: 0,
  },
  modalRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  deliveryActionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  modalRowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
});
