import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
import { useCareRecipients } from '@/features/care-recipients';
import { RecordSavedCheerModal } from '@/features/care-records/components/RecordSavedCheerModal';
import { useRecordSavedCheer } from '@/features/care-records/useRecordSavedCheer';
import { VitalRecordFormBody } from '@/features/care-records/vitals/components/VitalRecordFormBody';
import {
  buildVitalSummaryText,
  createEmptyVitalDraftFromJapanNow,
  draftToVitalWritePayload,
  vitalDraftHasAnyMeasurement,
  type VitalRecordDraft,
} from '@/features/care-records/vitals/vitalsDraft';
import { useVitalsStackBackHeader } from '@/features/care-records/vitals/useVitalsStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

export function VitalRecordCreateScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const { cheerVisible, cheerMode, showCheer, dismissCheer } = useRecordSavedCheer();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const vitalRecordsApi = useVitalRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useVitalsStackBackHeader(recipientId, c);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const initialDraft = useMemo(() => createEmptyVitalDraftFromJapanNow(), []);
  const [draft, setDraft] = useState<VitalRecordDraft>(initialDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipient = recipientId ? getRecipientById(recipientId) : undefined;

  React.useEffect(() => {
    if (!isReady) return;
    if (!isSignedIn) {
      router.replace('/auth/login');
      return;
    }
    if (recipientId && !recipient) {
      router.replace('/');
    }
  }, [isReady, isSignedIn, recipient, recipientId, router]);

  const submitToRails = useCallback(async () => {
    if (!recipientId || !isSignedIn || isSubmitting) return;
    if (!vitalDraftHasAnyMeasurement(draft)) {
      Alert.alert(
        '入力が不足しています',
        '体温・血圧・脈拍・SpO₂のうち、いずれか1つ以上は入力してください。'
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await vitalRecordsApi.create(recipientId, draftToVitalWritePayload(draft));
      showCheer('create');
    } catch (e) {
      const msg = isApiError(e) ? e.message : '保存に失敗しました';
      Alert.alert('保存できません', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSignedIn, isSubmitting, vitalRecordsApi, recipientId, router]);

  const onSubmit = useCallback(() => {
    if (!recipient) return;
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
    Alert.alert('入力内容の確認', buildVitalSummaryText(draft, recipient.name), [
      { text: '戻る', style: 'cancel' },
      { text: '保存する', onPress: () => void submitToRails() },
    ]);
  }, [draft, isSignedIn, recipient, submitToRails]);

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
          setDraft={setDraft}
          layout={layout}
          c={c}
          bottomPadding={insets.bottom + 56}
          footer={
            <Pressable
              onPress={onSubmit}
              disabled={!isSignedIn || isSubmitting}
              style={({ pressed }) => [
                styles.ctaOuter,
                {
                  opacity: !isSignedIn || isSubmitting ? 0.45 : pressed ? 0.92 : 1,
                  marginTop: 8,
                  marginBottom: 32,
                },
              ]}>
              <LinearGradient
                colors={[...ctaGradient[themeKey].colors]}
                start={ctaGradient[themeKey].start}
                end={ctaGradient[themeKey].end}
                style={styles.ctaGradient}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>記録を保存</Text>
                )}
              </LinearGradient>
            </Pressable>
          }
        />
      </KeyboardAvoidingView>
      <RecordSavedCheerModal visible={cheerVisible} mode={cheerMode} onDismiss={dismissCheer} />
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
});
