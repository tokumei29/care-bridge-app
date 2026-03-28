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
import { useImageMemosApi } from '@/api/hooks/useImageMemosApi';
import type { ImageMemoRecord } from '@/api/types/imageMemo';
import { useCareRecipients } from '@/features/care-recipients';
import { ImageMemoRecordFormBody } from '@/features/care-records/image-memos/components/ImageMemoRecordFormBody';
import {
  buildImageMemoSummaryText,
  draftToImageMemoWritePayload,
  imageMemoRecordToDraft,
  validateImageMemoDraftHasImage,
  type ImageMemoRecordDraft,
} from '@/features/care-records/image-memos/imageMemoDraft';
import { useImageMemosStackBackHeader } from '@/features/care-records/image-memos/useImageMemosStackBackHeader';
import { uploadCareImageMemoToSupabase } from '@/lib/uploadCareImageMemoToSupabase';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

export function ImageMemoRecordEditScreen() {
  const { recipientId, id: recordId } = useLocalSearchParams<{ recipientId: string; id: string }>();
  const router = useRouter();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const imageMemosApi = useImageMemosApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useImageMemosStackBackHeader(recipientId, c);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState<ImageMemoRecordDraft | null>(null);
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
        const rec: ImageMemoRecord = await imageMemosApi.show(recipientId, recordId);
        if (!cancelled) {
          setDraft(imageMemoRecordToDraft(rec));
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
  }, [isSignedIn, imageMemosApi, recipientId, recordId]);

  const resolveImageUrl = useCallback(
    async (d: ImageMemoRecordDraft): Promise<string> => {
      if (d.localImageUri && recipientId) {
        return uploadCareImageMemoToSupabase(d.localImageUri, recipientId, d.localImageMimeType);
      }
      if (d.remoteImageUrl && d.remoteImageUrl.trim() !== '') {
        return d.remoteImageUrl.trim();
      }
      throw new Error('写真を選ぶか、既存の画像が必要です。');
    },
    [recipientId]
  );

  const submitUpdate = useCallback(async () => {
    if (!recipientId || !recordId || !isSignedIn || !draft || isSaving) return;
    const v = validateImageMemoDraftHasImage(draft);
    if (v) {
      Alert.alert('入力を確認してください', v);
      return;
    }
    setIsSaving(true);
    try {
      const imageUrl = await resolveImageUrl(draft);
      await imageMemosApi.update(recipientId, recordId, draftToImageMemoWritePayload(draft, imageUrl));
      Alert.alert('更新しました', '画像メモを保存しました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = isApiError(e) ? e.message : e instanceof Error ? e.message : '更新に失敗しました';
      Alert.alert('保存できません', msg);
    } finally {
      setIsSaving(false);
    }
  }, [draft, isSaving, isSignedIn, imageMemosApi, recordId, recipientId, resolveImageUrl, router]);

  const onSavePress = useCallback(() => {
    if (!recipient || !draft) return;
    if (!isSignedIn) {
      Alert.alert('ログインが必要です', '記録を保存するには Supabase でサインインしてください。');
      return;
    }
    const v = validateImageMemoDraftHasImage(draft);
    if (v) {
      Alert.alert('入力を確認してください', v);
      return;
    }
    Alert.alert('内容の確認', buildImageMemoSummaryText(draft, recipient.name), [
      { text: '戻る', style: 'cancel' },
      { text: '保存する', onPress: () => void submitUpdate() },
    ]);
  }, [draft, isSignedIn, recipient, submitUpdate]);

  const setDraftSafe = useCallback((action: SetStateAction<ImageMemoRecordDraft>) => {
    setDraft((prev) => {
      if (prev === null) return prev;
      return typeof action === 'function' ? action(prev) : action;
    });
  }, []);

  const onDeletePress = useCallback(() => {
    if (!recipientId || !recordId || !isSignedIn || isDeleting) return;
    Alert.alert('記録を削除', 'この画像メモを削除しますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsDeleting(true);
            try {
              await imageMemosApi.destroy(recipientId, recordId);
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
  }, [isDeleting, isSignedIn, imageMemosApi, recordId, recipientId, router]);

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
        <ImageMemoRecordFormBody
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
