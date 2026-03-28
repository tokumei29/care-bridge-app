import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_NAME_LENGTH } from '@/features/care-recipients/constants';
import type { RecipientAvatarSubmit } from '@/features/care-recipients/types';
import { useAvatarDisplayUri } from '@/lib/useAvatarDisplayUri';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';
import { ctaGradient } from '@/theme/gradients';

type Props = {
  visible: boolean;
  title: string;
  mode: 'add' | 'edit';
  initialName?: string;
  /** 既存の顔写真 URL（編集時・API の avatar_url） */
  initialAvatarUrl?: string | null;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (payload: { name: string; avatar: RecipientAvatarSubmit }) => void | Promise<void>;
};

function buildAvatarPayload(
  mode: 'add' | 'edit',
  stagedPickUri: string | null,
  cleared: boolean,
  originalPersistedUri: string | null
): RecipientAvatarSubmit {
  if (stagedPickUri) {
    return { mode: 'picked', tempUri: stagedPickUri };
  }
  if (mode === 'add') {
    return { mode: 'none' };
  }
  if (cleared && originalPersistedUri) {
    return { mode: 'clear' };
  }
  return { mode: 'keep' };
}

export function NameFormModal({
  visible,
  title,
  mode,
  initialName = '',
  initialAvatarUrl = null,
  submitLabel,
  onClose,
  onSubmit,
}: Props) {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const themeKey = scheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const [value, setValue] = useState(initialName);
  const [stagedPickUri, setStagedPickUri] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [originalPersistedUri, setOriginalPersistedUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialName);
      setStagedPickUri(null);
      setCleared(false);
      setOriginalPersistedUri(initialAvatarUrl ?? null);
    }
  }, [visible, initialName, initialAvatarUrl]);

  const remotePreviewInput = stagedPickUri || cleared ? null : originalPersistedUri;
  const resolvedRemote = useAvatarDisplayUri(remotePreviewInput);
  const displayUri = stagedPickUri ?? (cleared ? null : resolvedRemote);
  const isTablet = layout.isTablet;
  const previewCap = isTablet ? 168 : 144;
  const previewSize = Math.min(previewCap, Math.max(112, Math.round(layout.railInnerWidth * 0.42)));

  const handleSubmit = () => {
    const avatar = buildAvatarPayload(mode, stagedPickUri, cleared, originalPersistedUri);
    void onSubmit({ name: value, avatar });
  };

  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '設定アプリから写真へのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.88,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setStagedPickUri(asset.uri);
      setCleared(false);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '設定アプリからカメラの使用を許可してください。');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.88,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.uri) {
      setStagedPickUri(asset.uri);
      setCleared(false);
    }
  };

  const clearPhoto = () => {
    setStagedPickUri(null);
    setCleared(true);
  };

  const sheetMaxWidth = layout.isTablet ? 480 : undefined;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS !== 'web' ? (
            <BlurView
              intensity={layout.isTablet ? 55 : 45}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)' }]} />
        </Pressable>

        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.keyboard,
            isTablet ? styles.keyboardTablet : styles.keyboardPhone,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          <View
            style={[styles.sheetRail, isTablet && styles.sheetRailTablet]}
            pointerEvents="box-none">
            <Pressable onPress={() => {}} accessibilityRole="none">
              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: c.surfaceSolid,
                    borderColor: c.borderStrong,
                    maxWidth: sheetMaxWidth,
                    width: sheetMaxWidth ? '100%' : undefined,
                    marginHorizontal: sheetMaxWidth ? 0 : 16,
                    alignSelf: sheetMaxWidth ? 'center' : 'stretch',
                    padding: isTablet ? 28 : 22,
                  },
                ]}>
                <View style={[styles.sheetAccent, { backgroundColor: c.accent }]} />
                <Text style={[styles.sheetTitle, { color: c.text, fontSize: isTablet ? 22 : 19 }]}>
                  {title}
                </Text>

                <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>顔写真（任意）</Text>
                <Text style={[styles.avatarHint, { color: c.textSecondary }]}>
                  お顔がはっきり分かる写真だと、一覧や記録トップで見分けやすくなります。
                </Text>
                <View style={styles.avatarSection}>
                  <View
                    style={[
                      styles.avatarPreview,
                      {
                        width: previewSize,
                        height: previewSize,
                        borderRadius: previewSize / 2,
                        borderColor: c.borderStrong,
                        backgroundColor: c.surfaceElevated,
                      },
                    ]}>
                    {displayUri ? (
                      <Image
                        source={{ uri: displayUri }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <Text style={[styles.avatarPlaceholder, { color: c.textSecondary }]}>
                        未設定
                      </Text>
                    )}
                  </View>
                  <View style={styles.avatarActions}>
                    <Pressable
                      onPress={openLibrary}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: c.accentMuted, opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <Text style={[styles.chipText, { color: c.accent }]}>ライブラリ</Text>
                    </Pressable>
                    {Platform.OS !== 'web' ? (
                      <Pressable
                        onPress={openCamera}
                        style={({ pressed }) => [
                          styles.chip,
                          { backgroundColor: c.accentMuted, opacity: pressed ? 0.85 : 1 },
                        ]}>
                        <Text style={[styles.chipText, { color: c.accent }]}>カメラ</Text>
                      </Pressable>
                    ) : null}
                    {displayUri ? (
                      <Pressable
                        onPress={clearPhoto}
                        style={({ pressed }) => [
                          styles.chip,
                          { backgroundColor: c.dangerMuted, opacity: pressed ? 0.85 : 1 },
                        ]}>
                        <Text style={[styles.chipText, { color: c.danger }]}>写真を外す</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {Platform.OS === 'web' ? (
                  <Text style={[styles.webHint, { color: c.textSecondary }]}>
                    Web ではライブラリからの選択のみ利用できます。
                  </Text>
                ) : null}

                <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: 8 }]}>お名前</Text>
                <TextInput
                  value={value}
                  onChangeText={setValue}
                  placeholder="例：山田 太郎"
                  placeholderTextColor={c.textSecondary}
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus={Platform.OS !== 'web'}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={[
                    styles.input,
                    {
                      color: c.text,
                      backgroundColor: c.surfaceElevated,
                      borderColor: c.border,
                      fontSize: isTablet ? 19 : 17,
                      paddingVertical: isTablet ? 16 : 12,
                    },
                  ]}
                />
                <Text style={[styles.hint, { color: c.textSecondary }]}>
                  {value.length}/{MAX_NAME_LENGTH} 文字
                </Text>
                <View style={[styles.actions, isTablet && styles.actionsTablet]}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.btnSecondary,
                      { borderColor: c.border, opacity: pressed ? 0.7 : 1 },
                      isTablet && styles.btnTablet,
                    ]}>
                    <Text
                      style={{ color: c.textSecondary, fontWeight: '700', fontSize: isTablet ? 17 : 16 }}>
                      キャンセル
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [styles.btnPrimaryWrap, { opacity: pressed ? 0.88 : 1 }]}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                    <LinearGradient
                      colors={[...ctaGradient[themeKey].colors]}
                      start={ctaGradient[themeKey].start}
                      end={ctaGradient[themeKey].end}
                      style={[styles.btnPrimary, isTablet && styles.btnTablet]}>
                      <Text style={[styles.btnPrimaryText, isTablet && { fontSize: 17 }]}>
                        {submitLabel}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  keyboardPhone: {
    justifyContent: 'flex-end',
  },
  keyboardTablet: {
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sheetRail: {
    width: '100%',
  },
  sheetRailTablet: {
    maxWidth: 480,
    alignSelf: 'center',
  },
  sheet: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sheetAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  sheetTitle: {
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  avatarHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarPreview: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  webHint: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
  },
  input: {
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionsTablet: {
    gap: 16,
  },
  btnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnPrimaryWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnTablet: {
    paddingVertical: 18,
    borderRadius: 16,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
