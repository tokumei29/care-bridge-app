import { SymbolView } from 'expo-symbols';
import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { CARE_RECORD_MEMO_MAX_LENGTH, MonthCalendar, TimeWheelsRow } from '@/features/care-records/shared';
import type { ExcretionRecordDraft } from '@/features/care-records/excretion/excretionDraft';
import {
  DEFECATION_AMOUNTS,
  DEFECATION_AMOUNT_LABEL,
  DEFECATION_PRESENCE,
  DEFECATION_PRESENCE_LABEL,
  PRE_SUBMIT_ISSUE_LABEL,
  STOOL_CONDITIONS,
  STOOL_CONDITION_LABEL,
  URINATION_AMOUNTS,
  URINATION_AMOUNT_LABEL,
  URINATION_PRESENCE,
  URINATION_PRESENCE_LABEL,
} from '@/features/care-records/excretion/excretionConstants';
import type { PreSubmitIssueStatus } from '@/features/care-records/meals/mealConstants';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipientName: string;
  isSignedIn: boolean;
  draft: ExcretionRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<ExcretionRecordDraft>>;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  bottomPadding: number;
  footer?: ReactNode;
};

export function ExcretionRecordFormBody({
  recipientName,
  isSignedIn,
  draft,
  setDraft,
  layout,
  c,
  bottomPadding,
  footer,
}: Props) {
  const showUrinationAmount = draft.urinationPresence === 'present';
  const showDefecationFields = draft.defecationPresence === 'present';

  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
      <ContentRail layout={layout}>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          {`${recipientName}さんの排泄を記録します。日付・時刻（日本時間）を選び、排尿・排便の有無と量、便の状態、メモを入力してください。`}
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
            いつの記録か（日本時間）。初期値は今日です。
          </Text>
          <MonthCalendar
            selectedKey={draft.dateKey}
            onChangeKey={(dateKey) => setDraft((d) => ({ ...d, dateKey }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>記録の時刻</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            おおよその時刻（日本時間）。初期値は現在時刻です。
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>排尿</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>あり / なし</Text>
          <View style={styles.chipRow}>
            {URINATION_PRESENCE.map((id) => {
              const on = draft.urinationPresence === id;
              return (
                <Pressable
                  key={id}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      urinationPresence: id,
                      urinationAmount: id === 'present' ? (d.urinationAmount ?? 'normal') : null,
                    }))
                  }
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: on ? c.accent : c.borderStrong,
                      backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <Text style={[styles.chipLabel, { color: on ? c.accent : c.text }]}>
                    {URINATION_PRESENCE_LABEL[id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {showUrinationAmount ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>排尿の量</Text>
            <View style={styles.chipRow}>
              {URINATION_AMOUNTS.map((id) => {
                const on = draft.urinationAmount === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setDraft((d) => ({ ...d, urinationAmount: id }))}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        borderColor: on ? c.accent : c.borderStrong,
                        backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}>
                    <Text style={[styles.chipLabel, { color: on ? c.accent : c.text }]}>
                      {URINATION_AMOUNT_LABEL[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>排便</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>あり / なし</Text>
          <View style={styles.chipRow}>
            {DEFECATION_PRESENCE.map((id) => {
              const on = draft.defecationPresence === id;
              return (
                <Pressable
                  key={id}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      defecationPresence: id,
                      defecationAmount: id === 'present' ? (d.defecationAmount ?? 'palm_full') : null,
                      stoolCondition: id === 'present' ? (d.stoolCondition ?? 'normal') : null,
                    }))
                  }
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      borderColor: on ? c.accent : c.borderStrong,
                      backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <Text style={[styles.chipLabel, { color: on ? c.accent : c.text }]}>
                    {DEFECATION_PRESENCE_LABEL[id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {showDefecationFields ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>排便の量</Text>
              <View style={styles.chipRow}>
                {DEFECATION_AMOUNTS.map((id) => {
                  const on = draft.defecationAmount === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setDraft((d) => ({ ...d, defecationAmount: id }))}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: on ? c.accent : c.borderStrong,
                          backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <Text style={[styles.chipLabel, { color: on ? c.accent : c.text }]}>
                        {DEFECATION_AMOUNT_LABEL[id]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>便の状態</Text>
              <View style={styles.chipRow}>
                {STOOL_CONDITIONS.map((id) => {
                  const on = draft.stoolCondition === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => setDraft((d) => ({ ...d, stoolCondition: id }))}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderColor: on ? c.accent : c.borderStrong,
                          backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <Text style={[styles.chipLabel, { color: on ? c.accent : c.text }]}>
                        {STOOL_CONDITION_LABEL[id]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>メモ</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            気になったことなど（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）
          </Text>
          <TextInput
            value={draft.memo}
            onChangeText={(memo) =>
              setDraft((d) => ({ ...d, memo: memo.slice(0, CARE_RECORD_MEMO_MAX_LENGTH) }))
            }
            placeholder="例: トイレまで見守り、自力で着席できた など"
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>そのときの排泄の様子</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            排便の異常、トイレでの不安定さなど、気になることがあれば「問題、気になる点あり」を選んでください。一覧で分かるよう表示され、施設やケアマネへの相談の目印にできます。
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '800',
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
