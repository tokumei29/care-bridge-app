import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { CARE_RECORD_MEMO_MAX_LENGTH, MonthCalendar, TimeWheelsRow } from '@/features/care-records/shared';
import type { ImageMemoRecordDraft } from '@/features/care-records/image-memos/imageMemoDraft';
import { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
import type { PreSubmitIssueStatus } from '@/features/care-records/meals/mealConstants';
import { useSignedSupabasePublicStorageUrl } from '@/lib/useAvatarDisplayUri';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipientName: string;
  isSignedIn: boolean;
  draft: ImageMemoRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<ImageMemoRecordDraft>>;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  bottomPadding: number;
  footer?: ReactNode;
};

export function ImageMemoRecordFormBody({
  recipientName,
  isSignedIn,
  draft,
  setDraft,
  layout,
  c,
  bottomPadding,
  footer,
}: Props) {
  const resolvedRemote = useSignedSupabasePublicStorageUrl(
    draft.localImageUri ? null : draft.remoteImageUrl
  );
  const previewUri = draft.localImageUri ?? resolvedRemote;
  const previewH = layout.isTablet ? 280 : 220;

  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '設定アプリから写真へのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setDraft((d) => ({
        ...d,
        localImageUri: asset.uri,
        localImageMimeType: asset.mimeType ?? null,
      }));
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '設定アプリからカメラの使用を許可してください。');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setDraft((d) => ({
        ...d,
        localImageUri: asset.uri,
        localImageMimeType: asset.mimeType ?? null,
      }));
    }
  };

  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
      <ContentRail layout={layout}>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          {`${recipientName}さんの画像メモです。にこやかな日常の記録や、ケガ・褥瘡など介護上必要な経過写真を、日時とメモ・問題の有無とともに残せます。`}
        </Text>

        {!isSignedIn ? (
          <View style={[styles.authBanner, { backgroundColor: c.accentMuted, borderColor: c.borderStrong }]}>
            <Text style={[styles.authBannerTitle, { color: c.text }]}>ログインが必要です</Text>
            <Text style={[styles.authBannerBody, { color: c.textSecondary }]}>
              画像のアップロード・記録の保存には、Supabase でサインインしてください。
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>写真</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            ライブラリから選ぶか、カメラで撮影してください。
          </Text>
          <View
            style={[
              styles.previewBox,
              {
                borderColor: c.borderStrong,
                backgroundColor: c.surfaceSolid,
                height: previewH,
              },
            ]}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />
            ) : (
              <Text style={[styles.previewPlaceholder, { color: c.textSecondary }]}>未選択</Text>
            )}
          </View>
          <View style={styles.pickRow}>
            <Pressable
              onPress={openLibrary}
              disabled={!isSignedIn}
              style={({ pressed }) => [
                styles.pickBtn,
                {
                  borderColor: c.accent,
                  backgroundColor: c.accentMuted,
                  opacity: !isSignedIn ? 0.45 : pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.pickBtnLabel, { color: c.accent }]}>写真を選ぶ</Text>
            </Pressable>
            <Pressable
              onPress={openCamera}
              disabled={!isSignedIn}
              style={({ pressed }) => [
                styles.pickBtn,
                {
                  borderColor: c.accent,
                  backgroundColor: c.accentMuted,
                  opacity: !isSignedIn ? 0.45 : pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.pickBtnLabel, { color: c.accent }]}>カメラで撮る</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>記録の日付</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            撮影・気づきの基準にしたい日。初期値は今日です。
          </Text>
          <MonthCalendar
            selectedKey={draft.dateKey}
            onChangeKey={(dateKey) => setDraft((d) => ({ ...d, dateKey }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>記録の時刻</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            おおよその時刻。初期値は現在時刻です。
          </Text>
          <TimeWheelsRow
            hour={draft.hour}
            minute={draft.minute}
            onHourChange={(hour) => setDraft((d) => ({ ...d, hour }))}
            onMinuteChange={(minute) => setDraft((d) => ({ ...d, minute }))}
            layout={layout}
            c={c}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>メモ</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            撮影目的や患部の位置、経過のメモなど（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）
          </Text>
          <TextInput
            value={draft.memo}
            onChangeText={(memo) =>
              setDraft((d) => ({ ...d, memo: memo.slice(0, CARE_RECORD_MEMO_MAX_LENGTH) }))
            }
            placeholder="例: 仙骨部褥瘡 stage2。赤みはやや減少 など"
            placeholderTextColor={c.textSecondary}
            multiline
            maxLength={CARE_RECORD_MEMO_MAX_LENGTH}
            style={[
              styles.memoInput,
              {
                color: c.text,
                borderColor: c.borderStrong,
                backgroundColor: c.surfaceSolid,
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>そのときの様子</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            気になることがあれば「問題、気になる点あり」を選んでください。
          </Text>
          <View
            style={[styles.preCheckWrap, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}
            accessibilityRole="radiogroup">
            {(['ok', 'issue'] as const satisfies readonly PreSubmitIssueStatus[]).map((key, i) => {
              const selected = draft.preSubmitIssue === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setDraft((d) => ({ ...d, preSubmitIssue: key }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.preCheckRow,
                    i === 0 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                    {
                      opacity: pressed ? 0.88 : 1,
                      backgroundColor: selected ? c.accentMuted : 'transparent',
                    },
                  ]}>
                  <View
                    style={[
                      styles.checkBox,
                      {
                        borderColor: selected ? c.accent : c.borderStrong,
                        backgroundColor: selected ? c.accent : 'transparent',
                      },
                    ]}>
                    {selected ? (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        tintColor="#fff"
                        size={16}
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.preCheckLabel, { color: c.text }]}>
                    {PRE_SUBMIT_ISSUE_LABEL[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {footer}
      </ContentRail>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
  },
  lead: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 18,
    lineHeight: 20,
  },
  authBanner: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 18,
  },
  authBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  authBannerBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 18,
  },
  previewBox: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pickBtnLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  memoInput: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  preCheckWrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  preCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preCheckLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
});
