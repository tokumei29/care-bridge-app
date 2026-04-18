import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { submitContactInquiry } from '@/api/contactInquiry';
import { isApiError } from '@/api/errors';
import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsLegalBackHeader } from '@/features/settings/useSettingsLegalBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

export const options = {
  title: 'お問い合わせ',
};

function isValidEmail(value: string): boolean {
  const t = value.trim();
  if (!t.includes('@')) return false;
  const [local, domain] = t.split('@');
  return local.length > 0 && !!domain && domain.includes('.');
}

export default function ContactScreen() {
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useSettingsLegalBackHeader(c.accent);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const runSubmit = () => {
    void (async () => {
      setSubmitting(true);
      try {
        await submitContactInquiry({
          name: name.trim() || undefined,
          email: replyEmail.trim(),
          message: message.trim(),
        });
        Alert.alert('送信しました', '内容を確認のうえ、折り返しご連絡できる場合があります。', [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setReplyEmail('');
              setMessage('');
            },
          },
        ]);
      } catch (e: unknown) {
        const msg = isApiError(e) ? e.message : e instanceof Error ? e.message : String(e);
        Alert.alert('送信できませんでした', msg);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const onSubmitPress = () => {
    const e = replyEmail.trim();
    if (!e) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return;
    }
    if (!isValidEmail(e)) {
      Alert.alert('入力エラー', 'メールアドレスの形式を確認してください。');
      return;
    }
    const m = message.trim();
    if (!m) {
      Alert.alert('入力エラー', 'お問い合わせ内容を入力してください。');
      return;
    }

    const previewName = name.trim().length > 0 ? name.trim() : '（未記入）';
    Alert.alert(
      '送信の確認',
      `サーバーから運営あてにメールが送信されます。\n\nお名前: ${previewName}\n返信先: ${e}\n\nよろしいですか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '送信する', onPress: runSubmit },
      ]
    );
  };

  const inputFont = layout.isTablet ? 16 : 15;

  return (
    <ScreenBackdrop>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 28, paddingTop: 16 },
          ]}
          showsVerticalScrollIndicator>
          <ContentRail layout={layout}>
            <Text style={[styles.lead, { color: c.textSecondary }]}>
              入力後「送信する」で確認し、サーバー経由で運営にメールが届きます。名前は任意です。
            </Text>

            <Text style={[styles.label, { color: c.text }]}>お名前（任意）</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="山田 太郎"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="words"
              editable={!submitting}
              style={[
                styles.input,
                {
                  borderColor: c.borderStrong,
                  color: c.text,
                  backgroundColor: c.surface,
                  fontSize: inputFont,
                },
              ]}
            />

            <Text style={[styles.label, { color: c.text }]}>メールアドレス（必須）</Text>
            <TextInput
              value={replyEmail}
              onChangeText={setReplyEmail}
              placeholder="example@email.com"
              placeholderTextColor={c.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              style={[
                styles.input,
                {
                  borderColor: c.borderStrong,
                  color: c.text,
                  backgroundColor: c.surface,
                  fontSize: inputFont,
                },
              ]}
            />

            <Text style={[styles.label, { color: c.text }]}>お問い合わせ内容（必須）</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="内容をご記入ください"
              placeholderTextColor={c.textSecondary}
              multiline
              textAlignVertical="top"
              editable={!submitting}
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: c.borderStrong,
                  color: c.text,
                  backgroundColor: c.surface,
                  fontSize: inputFont,
                },
              ]}
            />

            <Pressable
              onPress={onSubmitPress}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: c.accent,
                  opacity: submitting ? 0.6 : pressed ? 0.9 : 1,
                },
              ]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>送信する</Text>
              )}
            </Pressable>
          </ContentRail>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  lead: {
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  textArea: {
    minHeight: 160,
    paddingTop: 12,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
