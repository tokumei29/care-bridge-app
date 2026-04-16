import { SymbolView } from 'expo-symbols';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import {
  CARE_RECORD_MEMO_MAX_LENGTH,
  CARE_RECORD_OBSERVATION_MAX_LENGTH,
  MonthCalendar,
  TimeWheelsRow,
} from '@/features/care-records/shared';
import type { OtherNoteRecordDraft } from '@/features/care-records/other-notes/otherNoteDraft';
import { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
import type { PreSubmitIssueStatus } from '@/features/care-records/meals/mealConstants';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipientName: string;
  isSignedIn: boolean;
  draft: OtherNoteRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<OtherNoteRecordDraft>>;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  bottomPadding: number;
  footer?: ReactNode;
};

export function OtherNoteRecordFormBody({
  recipientName,
  isSignedIn,
  draft,
  setDraft,
  layout,
  c,
  bottomPadding,
  footer,
}: Props) {
  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
      <ContentRail layout={layout}>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          {`${recipientName}さんの「認知症の様子」と「その他の気づき」を記録します。気づいた日時、様子の記述、補足メモ、問題の有無を入力してください。`}
        </Text>

        {!isSignedIn ? (
          <View style={[styles.authBanner, { backgroundColor: c.accentMuted, borderColor: c.borderStrong }]}>
            <Text style={[styles.authBannerTitle, { color: c.text }]}>ログインが必要です</Text>
            <Text style={[styles.authBannerBody, { color: c.textSecondary }]}>
              記録の保存・一覧取得には、Supabase でサインインしてください。
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>記録の日付</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            いつの観察・気づきか。初期値は今日です。
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>認知症の様子</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            平穏だったか、不穏が強かったか、徘徊・幻覚などの経過（
            {CARE_RECORD_OBSERVATION_MAX_LENGTH}文字以内・任意）
          </Text>
          <TextInput
            value={draft.observation}
            onChangeText={(observation) =>
              setDraft((d) => ({
                ...d,
                observation: observation.slice(0, CARE_RECORD_OBSERVATION_MAX_LENGTH),
              }))
            }
            placeholder="例: 午前は穏やか。夕方から声が大きくなり落ち着かない など"
            placeholderTextColor={c.textSecondary}
            multiline
            maxLength={CARE_RECORD_OBSERVATION_MAX_LENGTH}
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>その他の気づき</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            上記以外の観察や家族・スタッフへの共有事項（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）
          </Text>
          <TextInput
            value={draft.memo}
            onChangeText={(memo) =>
              setDraft((d) => ({ ...d, memo: memo.slice(0, CARE_RECORD_MEMO_MAX_LENGTH) }))
            }
            placeholder="例: 訪問看護と相談済み。服薬は問題なく飲めた など"
            placeholderTextColor={c.textSecondary}
            multiline
            maxLength={CARE_RECORD_MEMO_MAX_LENGTH}
            style={[
              styles.memoInputTall,
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
            気になることがあれば「問題、気になる点あり」を選んでください。一覧で分かるよう表示され、施設やケアマネへの相談の目印にできます。
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
  memoInput: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  memoInputTall: {
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
