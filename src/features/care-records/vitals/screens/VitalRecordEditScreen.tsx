import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, type SetStateAction } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { isApiError } from '@/api/errors';
import { useVitalRecordsApi } from '@/api/hooks/useVitalRecordsApi';
import type { VitalRecordRecord } from '@/api/types/vitalRecord';
import { useCareRecipients } from '@/features/care-recipients';
import { VitalRecordFormBody } from '@/features/care-records/vitals/components/VitalRecordFormBody';
import {
  buildVitalSummaryText,
  draftToVitalWritePayload,
  vitalDraftHasAnyMeasurement,
  vitalRecordToDraft,
  type VitalRecordDraft,
} from '@/features/care-records/vitals/vitalsDraft';
import { useVitalsStackBackHeader } from '@/features/care-records/vitals/useVitalsStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

export function VitalRecordEditScreen() {
  const { recipientId, id: recordId } = useLocalSearchParams<{ recipientId: string; id: string }>();
  const router = useRouter();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const vitalRecordsApi = useVitalRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useVitalsStackBackHeader(recipientId, c);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<VitalRecordDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const recipient = recipientId ? getRecipientById(recipientId) : undefined;

  useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      router.replace('/auth/login');
      return;
    }
    if (recipientId && !recipient) {
      router.replace('/');
    }
  }, [isReady, isSignedIn, recipient, recipientId, router]);

  useEffect(() => {
    if (!recipientId || !recordId || !isSignedIn) {
      setLoadingRecord(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingRecord(true);
      setLoadError(null);
      try {
        const rec: VitalRecordRecord = await vitalRecordsApi.show(recipientId, recordId);
        if (!cancelled) {
          setDraft(vitalRecordToDraft(rec));
        }
      } catch (e) {
        if (!cancelled) {
          const msg = isApiError(e) ? e.message : '読み込みに失敗しました';
          setLoadError(msg);
          setDraft(null);
        }
      } finally {
        if (!cancelled) setLoadingRecord(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, vitalRecordsApi, recipientId, recordId]);

  const submitUpdate = useCallback(async () => {
    if (!recipientId || !recordId || !isSignedIn || !draft || isSaving) return;
    if (!vitalDraftHasAnyMeasurement(draft)) {
      Alert.alert(
        '入力が不足しています',
        '体温・血圧・脈拍・SpO₂のうち、いずれか1つ以上は入力してください。'
      );
      return;
    }
    setIsSaving(true);
    try {
      await vitalRecordsApi.update(recipientId, recordId, draftToVitalWritePayload(draft));
      Alert.alert('更新しました', 'バイタル記録を保存しました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = isApiError(e) ? e.message : '更新に失敗しました';
      Alert.alert('保存できません', msg);
    } finally {
      setIsSaving(false);
    }
  }, [draft, isSaving, isSignedIn, vitalRecordsApi, recordId, recipientId, router]);

  const onSavePress = useCallback(() => {
    if (!recipient || !draft) return;
    if (!isSignedIn) {
      Alert.alert('ログインが必要です', '記録を保存するには Supabase でサインインしてください。');
      return;
    }
    if (!vitalDraftHasAnyMeasurement(draft)) {
      Alert.alert(
        '入力が不足しています',
        '体温・血圧・脈拍・SpO₂のうち、いずれか1つ以上は入力してください。'
      );
      return;
    }
    Alert.alert('内容の確認', buildVitalSummaryText(draft, recipient.name), [
      { text: '戻る', style: 'cancel' },
      { text: '保存する', onPress: () => void submitUpdate() },
    ]);
  }, [draft, isSignedIn, recipient, submitUpdate]);

  const setDraftSafe = useCallback((action: SetStateAction<VitalRecordDraft>) => {
    setDraft((prev) => {
      if (prev === null) return prev;
      return typeof action === 'function' ? action(prev) : action;
    });
  }, []);

  const onDeletePress = useCallback(() => {
    if (!recipientId || !recordId || !isSignedIn || isDeleting) return;
    Alert.alert('記録を削除', 'このバイタル記録を削除しますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsDeleting(true);
            try {
              await vitalRecordsApi.destroy(recipientId, recordId);
              router.back();
            } catch (e) {
              const msg = isApiError(e) ? e.message : '削除に失敗しました';
              Alert.alert('削除できません', msg);
            } finally {
              setIsDeleting(false);
            }
          })();
        },
      },
    ]);
  }, [isDeleting, isSignedIn, vitalRecordsApi, recordId, recipientId, router]);

  if (!isReady) {
    return (
      <ScreenBackdrop>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.accent} />
        </View>
      </ScreenBackdrop>
    );
  }

  if (!recipientId || !recipient) {
    return (
      <ScreenBackdrop>
        <View style={styles.centered}>
          <Text style={{ color: c.textSecondary, fontSize: layout.isTablet ? 17 : 15 }}>
            被介護者が見つかりませんでした。
          </Text>
        </View>
      </ScreenBackdrop>
    );
  }

  if (!isSignedIn) {
    return (
      <ScreenBackdrop>
        <View style={styles.centered}>
          <Text style={{ color: c.textSecondary, fontSize: layout.isTablet ? 17 : 15, textAlign: 'center' }}>
            ログインが必要です。
          </Text>
        </View>
      </ScreenBackdrop>
    );
  }

  if (loadingRecord || !draft) {
    return (
      <ScreenBackdrop>
        <View style={styles.centered}>
          {loadError ? (
            <Text style={{ color: c.danger, textAlign: 'center', paddingHorizontal: 24 }}>{loadError}</Text>
          ) : (
            <ActivityIndicator size="large" color={c.accent} />
          )}
        </View>
      </ScreenBackdrop>
    );
  }

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 48}>
        <VitalRecordFormBody
          recipientName={recipient.name}
          isSignedIn={isSignedIn}
          draft={draft}
          setDraft={setDraftSafe}
          layout={layout}
          c={c}
          bottomPadding={insets.bottom + 28}
          footer={
            <View style={styles.footerBtns}>
              <Pressable
                onPress={onSavePress}
                disabled={isSaving || isDeleting}
                style={({ pressed }) => [
                  styles.ctaOuter,
                  {
                    opacity: isSaving || isDeleting ? 0.45 : pressed ? 0.92 : 1,
                  },
                ]}>
                <LinearGradient
                  colors={[...ctaGradient[themeKey].colors]}
                  start={ctaGradient[themeKey].start}
                  end={ctaGradient[themeKey].end}
                  style={styles.ctaGradient}>
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>変更を保存</Text>
                  )}
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={onDeletePress}
                disabled={isSaving || isDeleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  {
                    borderColor: c.danger,
                    opacity: isSaving || isDeleting ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}>
                {isDeleting ? (
                  <ActivityIndicator color={c.danger} />
                ) : (
                  <Text style={[styles.deleteText, { color: c.danger }]}>この記録を削除</Text>
                )}
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>
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
  footerBtns: {
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  ctaOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  deleteBtn: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
