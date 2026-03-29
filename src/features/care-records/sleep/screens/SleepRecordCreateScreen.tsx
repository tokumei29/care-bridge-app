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
import { useSleepRecordsApi } from '@/api/hooks/useSleepRecordsApi';
import { useCareRecipients } from '@/features/care-recipients';
import { RecordSavedCheerModal } from '@/features/care-records/components/RecordSavedCheerModal';
import { useRecordSavedCheer } from '@/features/care-records/useRecordSavedCheer';
import { SleepRecordFormBody } from '@/features/care-records/sleep/components/SleepRecordFormBody';
import {
  buildSleepSummaryText,
  createEmptySleepDraftFromJapanNow,
  draftToSleepWritePayload,
  validateSleepDraft,
  type SleepRecordDraft,
} from '@/features/care-records/sleep/sleepDraft';
import { useSleepStackBackHeader } from '@/features/care-records/sleep/useSleepStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

export function SleepRecordCreateScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const { cheerVisible, cheerMode, showCheer, dismissCheer } = useRecordSavedCheer();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const sleepRecordsApi = useSleepRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useSleepStackBackHeader(recipientId, c);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const initialDraft = useMemo(() => createEmptySleepDraftFromJapanNow(), []);
  const [draft, setDraft] = useState<SleepRecordDraft>(initialDraft);
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
    setIsSubmitting(true);
    try {
      await sleepRecordsApi.create(recipientId, draftToSleepWritePayload(draft));
      showCheer('create');
    } catch (e) {
      const msg = isApiError(e) ? e.message : '保存に失敗しました';
      Alert.alert('保存できません', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSignedIn, isSubmitting, sleepRecordsApi, recipientId, router]);

  const onSubmit = useCallback(() => {
    if (!recipient) return;
    if (!isSignedIn) {
      Alert.alert('ログインが必要です', '記録を保存するには Supabase でサインインしてください。');
      return;
    }
    const err = validateSleepDraft(draft);
    if (err) {
      Alert.alert('時刻を確認してください', err);
      return;
    }
    Alert.alert('入力内容の確認', buildSleepSummaryText(draft, recipient.name), [
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
        <SleepRecordFormBody
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
