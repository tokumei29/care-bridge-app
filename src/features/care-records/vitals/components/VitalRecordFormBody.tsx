import { SymbolView } from 'expo-symbols';
import React, { useCallback, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ContentRail } from '@/components/layout/ContentRail';
import { CARE_RECORD_MEMO_MAX_LENGTH, MonthCalendar, TimeWheelsRow } from '@/features/care-records/shared';
import type { VitalRecordDraft } from '@/features/care-records/vitals/vitalsDraft';
import { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
import type { PreSubmitIssueStatus } from '@/features/care-records/meals/mealConstants';
import type { ResponsiveLayout } from '@/lib/useResponsiveLayout';
import type { CareBridgeColors } from '@/theme/careBridge';

type Props = {
  recipientName: string;
  isSignedIn: boolean;
  draft: VitalRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<VitalRecordDraft>>;
  layout: ResponsiveLayout;
  c: CareBridgeColors;
  bottomPadding: number;
  footer?: ReactNode;
};

export function VitalRecordFormBody({
  recipientName,
  isSignedIn,
  draft,
  setDraft,
  layout,
  c,
  bottomPadding,
  footer,
}: Props) {
  const onTempChange = useCallback(
    (t: string) => {
      const cleaned = t.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      const parts = cleaned.split('.');
      const normalized =
        parts.length <= 1 ? parts[0] ?? '' : `${parts[0]}.${parts.slice(1).join('').slice(0, 1)}`;
      setDraft((d) => ({ ...d, temperature: normalized }));
    },
    [setDraft]
  );

  const onDigitsOnly =
    (
      key: 'bloodPressureSystolic' | 'bloodPressureDiastolic' | 'pulseRate' | 'spo2'
    ) => (t: string) => {
      const digits = t.replace(/\D/g, '').slice(0, 3);
      setDraft((d) => ({ ...d, [key]: digits }));
    };

  return (
    <ScrollView
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
      <ContentRail layout={layout}>
        <Text style={[styles.lead, { color: c.textSecondary }]}>
          {`${recipientName}さんのバイタルを記録します。日付・時刻（日本時間）を選び、体温・血圧・脈拍・SpO₂・メモを入力してください。体温・血圧・脈拍・SpO₂のうち、どれか1つ以上は必須です。それ以外の未測定の項目は空欄のままで構いません。`}
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
            測定のおおよその時刻（日本時間）。初期値は現在時刻です。
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
          <Text style={[styles.sectionTitle, { color: c.text }]}>体温</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>℃（小数点1桁まで。未測定は空欄）</Text>
          <View style={[styles.inputRow, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
            <TextInput
              value={draft.temperature}
              onChangeText={onTempChange}
              placeholder="例: 36.5"
              placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.inputFlex, { color: c.text }]}
            />
            <Text style={[styles.inputUnit, { color: c.textSecondary }]}>℃</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>血圧</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            最高（収縮期）・最低（拡張期）、mmHg。未測定は空欄。
          </Text>
          <View style={[styles.inputRow, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
            <Text style={[styles.bpLabel, { color: c.textSecondary }]}>最高</Text>
            <TextInput
              value={draft.bloodPressureSystolic}
              onChangeText={onDigitsOnly('bloodPressureSystolic')}
              placeholder="例: 120"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.inputFlex, { color: c.text }]}
            />
            <Text style={[styles.bpSlash, { color: c.textSecondary }]}>／</Text>
            <Text style={[styles.bpLabel, { color: c.textSecondary }]}>最低</Text>
            <TextInput
              value={draft.bloodPressureDiastolic}
              onChangeText={onDigitsOnly('bloodPressureDiastolic')}
              placeholder="80"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.inputFlex, { color: c.text }]}
            />
            <Text style={[styles.inputUnit, { color: c.textSecondary }]}>mmHg</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>脈拍</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            1分間の拍数（回/分）。未測定は空欄。
          </Text>
          <View style={[styles.inputRow, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
            <TextInput
              value={draft.pulseRate}
              onChangeText={onDigitsOnly('pulseRate')}
              placeholder="例: 72"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.inputFlex, { color: c.text }]}
            />
            <Text style={[styles.inputUnit, { color: c.textSecondary }]}>回/分</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>SpO₂</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>酸素飽和度（％）。未測定は空欄。</Text>
          <View style={[styles.inputRow, { borderColor: c.borderStrong, backgroundColor: c.surfaceSolid }]}>
            <TextInput
              value={draft.spo2}
              onChangeText={onDigitsOnly('spo2')}
              placeholder="例: 98"
              placeholderTextColor={c.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.inputFlex, { color: c.text }]}
            />
            <Text style={[styles.inputUnit, { color: c.textSecondary }]}>%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>メモ</Text>
          <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
            測定時の様子など（{CARE_RECORD_MEMO_MAX_LENGTH}文字以内・任意）
          </Text>
          <TextInput
            value={draft.memo}
            onChangeText={(memo) =>
              setDraft((d) => ({ ...d, memo: memo.slice(0, CARE_RECORD_MEMO_MAX_LENGTH) }))
            }
            placeholder="例: 安静時、室温24℃ など"
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
            測定値や状態で気になることがあれば「問題、気になる点あり」を選んでください。一覧で分かるよう表示され、施設やケアマネへの相談の目印にできます。
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minHeight: 48,
  },
  inputFlex: {
    flex: 1,
    minWidth: 56,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  inputUnit: {
    fontSize: 15,
    fontWeight: '700',
  },
  bpLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  bpSlash: {
    fontSize: 18,
    fontWeight: '600',
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
