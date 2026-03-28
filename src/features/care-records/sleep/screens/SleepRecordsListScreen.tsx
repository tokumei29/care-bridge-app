import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { SimpleLineChart } from '@/components/charts/SimpleLineChart';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { isApiError } from '@/api/errors';
import { useSleepRecordsApi } from '@/api/hooks/useSleepRecordsApi';
import type { SleepRecordRecord } from '@/api/types/sleepRecord';
import { useCareRecipients } from '@/features/care-recipients';
import { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
import {
  careRecordListCardMemoTextStyle,
  careRecordListCardSummaryTextStyle,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  MonthCalendar,
  pad2,
  parseIsoToJapanDateTimeParts,
} from '@/features/care-records/shared';
import { formatSleepIntervalDurationJa } from '@/features/care-records/sleep/sleepDraft';
import {
  buildSleepMinutesLast7JapanDays,
  formatSleepMinutesAxisLabel,
} from '@/features/care-records/sleep/sleepWeekChartData';
import { useCareRecipientStackBackHeader } from '@/features/care-records/useCareRecipientStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

/** `styles.chartSection` の paddingHorizontal と一致（グラフの width はカード内側に合わせる） */
const SLEEP_CHART_CARD_PAD_H = 14;

function formatSleepCardHeadline(beddedAt: string, wokeAt: string): string {
  const d = new Date(beddedAt);
  if (Number.isNaN(d.getTime())) return beddedAt;
  const datePart = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
  const b = parseIsoToJapanDateTimeParts(beddedAt);
  const w = parseIsoToJapanDateTimeParts(wokeAt);
  const cross = b.dateKey !== w.dateKey;
  return `${datePart} 臥床 ${pad2(b.hour)}:${pad2(b.minute)} → 起床 ${pad2(w.hour)}:${pad2(w.minute)}${
    cross ? '（翌日）' : ''
  }`;
}

function formatSleepMemoPreview(item: SleepRecordRecord): string {
  const m = item.memo?.trim();
  if (!m) return 'メモなし';
  return m.length > 56 ? `${m.slice(0, 56)}…` : m;
}

export function SleepRecordsListScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const sleepRecordsApi = useSleepRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  useCareRecipientStackBackHeader(recipientId, c);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<SleepRecordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [filterDateKey, setFilterDateKey] = useState(() => getJapanNowParts().dateKey);

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

  const fetchList = useCallback(async () => {
    if (!recipientId || !isSignedIn) {
      setRecords([]);
      setListError(null);
      setLoading(false);
      return;
    }
    try {
      const data = await sleepRecordsApi.list(recipientId);
      setRecords(data);
      setListError(null);
    } catch (e) {
      setListError(isApiError(e) ? e.message : '一覧を読み込めませんでした');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSignedIn, sleepRecordsApi, recipientId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void fetchList();
    }, [fetchList])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchList();
  }, [fetchList]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => isRecordedAtOnJapanDate(r.bedded_at, filterDateKey));
  }, [records, filterDateKey]);

  const sleepWeekLinePoints = useMemo(
    () =>
      buildSleepMinutesLast7JapanDays(records).map((p) => ({
        value: p.totalMinutes,
        xLabel: p.xLabel,
      })),
    [records]
  );

  const goNew = useCallback(() => {
    router.push({
      pathname: '/care/[recipientId]/sleep/new',
      params: { recipientId: recipientId! },
    } as Href);
  }, [recipientId, router]);

  const goEdit = useCallback(
    (id: string) => {
      router.push({
        pathname: '/care/[recipientId]/sleep/[id]',
        params: { recipientId: recipientId!, id },
      } as Href);
    },
    [recipientId, router]
  );

  const onDeleteRecord = useCallback(
    (id: string) => {
      if (!recipientId || !isSignedIn) return;
      Alert.alert('記録を削除', 'この睡眠の記録を削除しますか？取り消せません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await sleepRecordsApi.destroy(recipientId, id);
                await fetchList();
              } catch (e) {
                Alert.alert('削除できません', isApiError(e) ? e.message : 'もう一度お試しください');
              }
            })();
          },
        },
      ]);
    },
    [fetchList, isSignedIn, sleepRecordsApi, recipientId]
  );

  useLayoutEffect(() => {
    if (!isReady || !recipientId || !recipient) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={goNew}
          disabled={!isSignedIn}
          hitSlop={12}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: !isSignedIn ? 0.4 : pressed ? 0.75 : 1,
          })}>
          <Text style={{ color: c.accent, fontSize: 16, fontWeight: '800' }}>＋ 新規</Text>
        </Pressable>
      ),
    });
  }, [navigation, isReady, recipientId, recipient, goNew, isSignedIn, c.accent]);

  const jumpToToday = useCallback(() => {
    setFilterDateKey(getJapanNowParts().dateKey);
  }, []);

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
      <View style={styles.flex}>
        <FlatList
          nestedScrollEnabled
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          ListHeaderComponent={
            <ContentRail layout={layout}>
              <Text style={[styles.lead, { color: c.textSecondary }]}>
                {`${recipient.name}さんの睡眠の記録です（新しい順・日本時間）。夜間の本眠だけでなく、昼寝なども「臥床〜起床」で別レコードにすると、同じ日の記録として一覧・下の週グラフの「1日の合計」にすべて足し込まれます。表示する日付は「臥床した日」に合わせます。各行の「編集」で修正、「削除」で消せます。新規は右上の「＋ 新規」か、被介護者トップの「入力」から開けます。\n\nタグは「そのときの様子」です。赤い「問題、気になる点あり」は、施設やケアマネに相談したい記録として目立つようにしています。`}
              </Text>
              {!isSignedIn ? (
                <View
                  style={[
                    styles.authBanner,
                    { backgroundColor: c.accentMuted, borderColor: c.borderStrong },
                  ]}>
                  <Text style={[styles.authTitle, { color: c.text }]}>ログインが必要です</Text>
                  <Text style={[styles.authBody, { color: c.textSecondary }]}>
                    一覧の取得・記録の追加は、Supabase でサインインしてください。
                  </Text>
                </View>
              ) : null}

              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: c.text }]}>表示する日付</Text>
                  <Pressable onPress={jumpToToday} style={styles.todayLink}>
                    <Text style={[styles.todayLinkText, { color: c.accent }]}>今日</Text>
                  </Pressable>
                </View>
                <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
                  臥床した日（日本時間）がこの日に一致する記録だけ表示します。
                </Text>
                <Text style={[styles.dateFilterSummary, { color: c.textSecondary }]}>
                  {filterDateKey} ／ {filteredRecords.length} 件表示
                </Text>
                <MonthCalendar selectedKey={filterDateKey} onChangeKey={setFilterDateKey} />
              </View>

              {isSignedIn ? (
                <View
                  style={[
                    styles.chartSection,
                    {
                      borderColor: c.borderStrong,
                      backgroundColor: c.surfaceSolid,
                    },
                  ]}>
                  <Text style={[styles.chartTitle, { color: c.text }]}>直近7日間の1日あたり睡眠時間（合計）</Text>
                  <Text style={[styles.chartSub, { color: c.textSecondary }]}>
                    各日の値は、その日に「臥床した」記録すべての（起床−臥床）を足し合わせた1日の総睡眠時間です。夜間の睡眠に加え、昼寝なども別レコードで登録していれば同じ日にまとめて含まれます。今日を含む過去7暦日分です。
                  </Text>
                  <SimpleLineChart
                    points={sleepWeekLinePoints}
                    width={Math.max(1, layout.railInnerWidth - SLEEP_CHART_CARD_PAD_H * 2)}
                    height={layout.isTablet ? 200 : 176}
                    lineColor={c.accent}
                    gridColor={c.border}
                    axisLabelColor={c.textSecondary}
                    fillUnderColor={
                      scheme === 'dark' ? 'rgba(94, 184, 168, 0.11)' : 'rgba(45, 122, 110, 0.09)'
                    }
                    formatYLabel={formatSleepMinutesAxisLabel}
                    minValue={0}
                    yTickCount={7}
                    yTickSnap={60}
                  />
                </View>
              ) : null}

              {loading && records.length === 0 ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator color={c.accent} />
                </View>
              ) : null}
              {listError ? <Text style={[styles.errorText, { color: c.danger }]}>{listError}</Text> : null}
              {!loading && !listError && records.length === 0 && isSignedIn ? (
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  まだ記録がありません。被介護者トップの「入力」→「睡眠の入力」、または右上の「＋ 新規」から追加できます。
                </Text>
              ) : null}
              {!loading &&
              !listError &&
              records.length > 0 &&
              filteredRecords.length === 0 &&
              isSignedIn ? (
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  この日の記録はありません。カレンダーで別の日を選ぶか、新規で追加してください。
                </Text>
              ) : null}
            </ContentRail>
          }
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => {
            const issueLabel =
              item.issue_status === 'issue'
                ? PRE_SUBMIT_ISSUE_LABEL.issue
                : PRE_SUBMIT_ISSUE_LABEL.ok;
            const totalSleep = formatSleepIntervalDurationJa(item.bedded_at, item.woke_at);
            return (
              <ContentRail layout={layout}>
                <View
                  style={[
                    styles.card,
                    {
                      borderColor: c.borderStrong,
                      backgroundColor: c.surfaceSolid,
                    },
                  ]}>
                  <Text
                    style={[careRecordListCardSummaryTextStyle(layout.isTablet), { color: c.text }]}
                    numberOfLines={6}>
                    {formatSleepCardHeadline(item.bedded_at, item.woke_at)}
                    {totalSleep ? `\n睡眠時間の合計 ${totalSleep}` : ''}
                  </Text>
                  <Text
                    style={[careRecordListCardMemoTextStyle(layout.isTablet), { color: c.textSecondary }]}
                    numberOfLines={3}>
                    {formatSleepMemoPreview(item)}
                  </Text>
                  <View style={styles.cardTags}>
                    <View
                      style={[
                        styles.tag,
                        {
                          backgroundColor:
                            item.issue_status === 'issue' ? c.dangerMuted : c.accentMuted,
                        },
                      ]}>
                      <View style={styles.tagRow}>
                        <SymbolView
                          name={
                            item.issue_status === 'issue'
                              ? { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }
                              : { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                          }
                          tintColor={item.issue_status === 'issue' ? c.danger : c.accent}
                          size={16}
                        />
                        <Text
                          style={[
                            styles.tagText,
                            {
                              color: item.issue_status === 'issue' ? c.danger : c.accent,
                            },
                          ]}>
                          {issueLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => goEdit(item.id)}
                      style={({ pressed }) => [
                        styles.cardActionBtn,
                        {
                          borderColor: c.accent,
                          backgroundColor: c.accentMuted,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <Text style={[styles.cardActionLabel, { color: c.accent }]}>編集</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onDeleteRecord(item.id)}
                      style={({ pressed }) => [
                        styles.cardActionBtn,
                        {
                          borderColor: c.danger,
                          backgroundColor: c.dangerMuted,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <Text style={[styles.cardActionLabel, { color: c.danger }]}>削除</Text>
                    </Pressable>
                  </View>
                </View>
              </ContentRail>
            );
          }}
        />
      </View>
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
  lead: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 20,
  },
  authBanner: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  authBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  chartSection: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    paddingHorizontal: SLEEP_CHART_CARD_PAD_H,
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  chartSub: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  todayLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  todayLinkText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 18,
  },
  dateFilterSummary: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  listLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    justifyContent: 'flex-end',
  },
  cardActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardActionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
});
