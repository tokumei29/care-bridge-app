import { SymbolView } from 'expo-symbols';
import React, { useCallback, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { AmountScaleRow } from '@/features/care-records/meals/components/AmountScaleRow';
import { CARE_RECORD_MEMO_MAX_LENGTH, MonthCalendar, TimeWheelsRow } from '@/features/care-records/shared';
import type { MealRecordDraft } from '@/features/care-records/meals/mealDraft';
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  PRE_SUBMIT_ISSUE_LABEL,
  type PreSubmitIssueStatus,
} from '@/features/care-records/meals/mealConstants';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipientName: string;
  isSignedIn: boolean;
  draft: MealRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<MealRecordDraft>>;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  bottomPadding: number;
  /** フォーム末尾（送信ボタンなど） */
  footer?: ReactNode;
};

export function MealRecordFormBody({
  recipientName,
  isSignedIn,
  draft,
  setDraft,
  layout,
  c,
  bottomPadding,
  footer,
}: Props) {
  const onWaterChange = useCallback(
    (t: string) => {
      const digits = t.replace(/\D/g, '');
      setDraft((d) => ({ ...d, waterMl: digits }));
    },
    [setDraft]
  );

  const isSnack = draft.mealSlot === 'snack';

  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
      <ContentRail layout={layout}>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          {isSnack
            ? `${recipientName}さんの間食を記録します。日付・時刻を選んだあと、メモに食べたものや様子を書いてください（主食・副食の量は表示しません）。`
            : `${recipientName}さんの食事を記録します。まず「いつの記録か」の日付・時刻を選び、そのあと食事の内容を入力してください。`}
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
            いつの食事か。初期値は今日です。
          </Text>
          <MonthCalendar
            selectedKey={draft.dateKey}
            onChangeKey={(dateKey) => setDraft((d) => ({ ...d, dateKey }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>記録の時刻</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            食事のおおよその時刻。初期値は現在時刻です。
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>食事のタイミング</Text>
          <View style={styles.slotRow}>
            {MEAL_SLOTS.map((id) => {
              const on = draft.mealSlot === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setDraft((d) => ({ ...d, mealSlot: id }))}
                  style={({ pressed }) => [
                    styles.slotChip,
                    {
                      borderColor: on ? c.accent : c.borderStrong,
                      backgroundColor: on ? c.accentMuted : c.surfaceSolid,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <Text style={[styles.slotLabel, { color: on ? c.accent : c.text }]}>
                    {MEAL_SLOT_LABEL[id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!isSnack ? (
          <>
            <View style={[styles.section, styles.cardPad, { borderColor: c.borderStrong }]}>
              <AmountScaleRow
                label="主食（ご飯など）"
                value={draft.stapleAmount}
                onChange={(stapleAmount) => setDraft((d) => ({ ...d, stapleAmount }))}
              />
            </View>

            <View style={[styles.section, styles.cardPad, { borderColor: c.borderStrong }]}>
              <AmountScaleRow
                label="副食（おかずなど）"
                value={draft.sideAmount}
                onChange={(sideAmount) => setDraft((d) => ({ ...d, sideAmount }))}
              />
            </View>
          </>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>水分量</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>ミリリットル（ml）</Text>
          <View style={[styles.mlRow, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
            <TextInput
              value={draft.waterMl}
              onChangeText={onWaterChange}
              placeholder="例: 150"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              style={[styles.mlInput, { color: c.text }]}
            />
            <Text style={[styles.mlUnit, { color: c.textSecondary }]}>ml</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>メモ</Text>
          {isSnack ? (
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
              食べたものや様子を入力してください（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）。
            </Text>
          ) : (
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
              気になったこと、メニュー名など（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）
            </Text>
          )}
          <TextInput
            value={draft.memo}
            onChangeText={(memo) =>
              setDraft((d) => ({ ...d, memo: memo.slice(0, CARE_RECORD_MEMO_MAX_LENGTH) }))
            }
            placeholder={
              isSnack ? '例: ヨーグルト1個、お茶菓子を少し、よく噛んで食べた など' : '気になったこと、メニュー名など'
            }
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>そのときの食事の様子</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            むせ・誤嚥、食欲の変化など、気になることがあれば「問題、気になる点あり」を選んでください。一覧で分かるよう表示され、施設やケアマネへの相談の目印にできます。
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
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  slotLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardPad: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
  },
  mlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  mlInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  mlUnit: {
    fontSize: 16,
    fontWeight: '700',
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
