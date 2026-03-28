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
import { SparseDualLineChart } from '@/components/charts/SparseDualLineChart';
import { SparseLineChart } from '@/components/charts/SparseLineChart';
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { isApiError } from '@/api/errors';
import { useMealRecordsApi } from '@/api/hooks/useMealRecordsApi';
import type { MealRecordRecord } from '@/api/types/mealRecord';
import { useCareRecipients } from '@/features/care-recipients';
import {
  careRecordListCardDateTextStyle,
  careRecordListCardMemoTextStyle,
  careRecordListCardSummaryTextStyle,
  formatRecordedAtDisplayJa,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  MonthCalendar,
} from '@/features/care-records/shared';
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  PRE_SUBMIT_ISSUE_LABEL,
  type MealSlotId,
} from '@/features/care-records/meals/mealConstants';
import {
  boundsForStapleSideDailyAvgChart,
  boundsForWaterDailyTotalChart,
  buildMealDayChartSlot,
  buildMealLast7DaysChartSlots,
  mealDaySummaryDisplayStrings,
  formatStapleSideAvgAxisLabel,
} from '@/features/care-records/meals/mealsDayChartData';
import { useCareRecipientStackBackHeader } from '@/features/care-records/useCareRecipientStackBackHeader';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

/** `styles.chartSection` の paddingHorizontal と一致 */
const MEAL_CHART_CARD_PAD_H = 14;

export function MealRecordsListScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const mealRecordsApi = useMealRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const stapleAvgLineColor = scheme === 'dark' ? '#ffb74d' : '#e65100';
  const sideAvgLineColor = scheme === 'dark' ? '#81c784' : '#2e7d32';
  const waterTotalLineColor = scheme === 'dark' ? '#64b5f6' : '#1565c0';
  useCareRecipientStackBackHeader(recipientId, c);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<MealRecordRecord[]>([]);
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
      const data = await mealRecordsApi.list(recipientId);
      setRecords(data);
      setListError(null);
    } catch (e) {
      setListError(isApiError(e) ? e.message : '一覧を読み込めませんでした');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSignedIn, mealRecordsApi, recipientId]);

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
    return records.filter((r) => isRecordedAtOnJapanDate(r.recorded_at, filterDateKey));
  }, [records, filterDateKey]);

  const mealLast7Slots = useMemo(() => buildMealLast7DaysChartSlots(records), [records]);
  const mealCalendarDaySlot = useMemo(
    () => buildMealDayChartSlot(records, filterDateKey),
    [records, filterDateKey]
  );

  const mealStapleSidePoints = useMemo(
    () =>
      mealLast7Slots.map((s) => ({
        xLabel: s.xLabel,
        valueA: s.stapleAvg,
        valueB: s.sideAvg,
      })),
    [mealLast7Slots]
  );

  const mealWaterPoints = useMemo(
    () => mealLast7Slots.map((s) => ({ xLabel: s.xLabel, value: s.waterTotalMl })),
    [mealLast7Slots]
  );

  const mealStapleSideBounds = useMemo(
    () => boundsForStapleSideDailyAvgChart(mealLast7Slots),
    [mealLast7Slots]
  );
  const mealWaterBounds = useMemo(() => boundsForWaterDailyTotalChart(mealLast7Slots), [mealLast7Slots]);

  const mealDaySummaryStr = useMemo(
    () => mealDaySummaryDisplayStrings(mealCalendarDaySlot),
    [mealCalendarDaySlot]
  );

  const mealChartW = Math.max(1, layout.railInnerWidth - MEAL_CHART_CARD_PAD_H * 2);
  const mealChartH = layout.isTablet ? 158 : 146;

  const goNew = useCallback(() => {
    router.push({
      pathname: '/care/[recipientId]/meals/new',
      params: { recipientId: recipientId! },
    } as Href);
  }, [recipientId, router]);

  const goEdit = useCallback(
    (id: string) => {
      router.push({
        pathname: '/care/[recipientId]/meals/[id]',
        params: { recipientId: recipientId!, id },
      } as Href);
    },
    [recipientId, router]
  );

  const onDeleteRecord = useCallback(
    (id: string) => {
      if (!recipientId || !isSignedIn) return;
      Alert.alert('記録を削除', 'この食事記録を削除しますか？取り消せません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await mealRecordsApi.destroy(recipientId, id);
                await fetchList();
              } catch (e) {
                Alert.alert('削除できません', isApiError(e) ? e.message : 'もう一度お試しください');
              }
            })();
          },
        },
      ]);
    },
    [fetchList, isSignedIn, mealRecordsApi, recipientId]
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
                  {`${recipient.name}さんのこれまでの記録です（新しい順・日本時間）。各行の「編集」で修正、「削除」で消せます。新規は右上の「＋ 新規」か、被介護者トップの「入力」から開けます。\n\nタグは「そのときの食事の様子」です。赤い「問題、気になる点あり」（警告マーク付き）は、施設やケアマネに相談したい記録として目立つようにしています。`}
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
                    開いたときは今日（日本時間）の記録だけ表示します。カレンダーで日付を変えると、その日の記録に切り替わります。
                  </Text>
                  <Text style={[styles.dateFilterSummary, { color: c.textSecondary }]}>
                    {filterDateKey} ／ {filteredRecords.length} 件表示
                  </Text>
                  <MonthCalendar selectedKey={filterDateKey} onChangeKey={setFilterDateKey} />
                </View>

                {isSignedIn && records.length > 0 ? (
                  <View
                    style={[
                      styles.daySummarySection,
                      {
                        borderColor: c.borderStrong,
                        backgroundColor: c.surfaceSolid,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.daySummaryHeading,
                        { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                      ]}>
                      {mealCalendarDaySlot.xLabel}の食事量の平均、水分の合計
                    </Text>
                    <Text style={[styles.daySummaryCaption, { color: c.textSecondary }]}>
                      上の一覧と同じ日（{filterDateKey}）の集計です。主食・副食の平均は朝・昼・夕の記録から、間食は回数だけ数えています。
                    </Text>

                    <View style={styles.daySummaryRows}>
                      <View style={styles.daySummaryRow}>
                        <Text
                          style={[
                            styles.daySummaryLabel,
                            { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                          ]}>
                          朝食・昼食・夕食の記録
                        </Text>
                        <Text
                          style={[
                            styles.daySummaryValue,
                            { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                          ]}>
                          {mealCalendarDaySlot.mainMealCount} 回
                        </Text>
                      </View>
                      <View style={styles.daySummaryRow}>
                        <Text
                          style={[
                            styles.daySummaryLabel,
                            { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                          ]}>
                          間食の記録
                        </Text>
                        <Text
                          style={[
                            styles.daySummaryValue,
                            { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                          ]}>
                          {mealCalendarDaySlot.snackCount} 回
                        </Text>
                      </View>
                      <View style={styles.daySummaryRow}>
                        <Text
                          style={[
                            styles.daySummaryLabel,
                            { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                          ]}>
                          主食の平均（0〜10）
                        </Text>
                        <Text
                          style={[
                            styles.daySummaryValue,
                            { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                          ]}>
                          {mealDaySummaryStr.stapleAvg}
                        </Text>
                      </View>
                      <View style={styles.daySummaryRow}>
                        <Text
                          style={[
                            styles.daySummaryLabel,
                            { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                          ]}>
                          副食の平均（0〜10）
                        </Text>
                        <Text
                          style={[
                            styles.daySummaryValue,
                            { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                          ]}>
                          {mealDaySummaryStr.sideAvg}
                        </Text>
                      </View>
                      <View style={styles.daySummaryRow}>
                        <Text
                          style={[
                            styles.daySummaryLabel,
                            { color: c.textSecondary, fontSize: layout.isTablet ? 16 : 15 },
                          ]}>
                          水分の合計
                        </Text>
                        <Text
                          style={[
                            styles.daySummaryValue,
                            { color: c.text, fontSize: layout.isTablet ? 20 : 18 },
                          ]}>
                          {mealDaySummaryStr.waterTotal}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {isSignedIn ? (
                  <View
                    style={[
                      styles.chartSection,
                      {
                        borderColor: c.borderStrong,
                        backgroundColor: c.surfaceSolid,
                      },
                    ]}>
                    <Text style={[styles.chartTitle, { color: c.text }]}>
                      食事量・水分（直近7日・日本時間の暦日）
                    </Text>
                    <Text style={[styles.chartSub, { color: c.textSecondary }]}>
                      グラフは日本時間の今日までの直近7暦日です。主食・副食は間食を除く各食事の量（0〜10）をその日の記録数で割った1日の平均、水分はその日の
                      ml 合計です。記録がない日は点が出ませんが、前後の日に値があれば線で結びます。
                    </Text>

                    {records.length === 0 ? (
                      <Text style={[styles.chartEmptyNote, { color: c.textSecondary }]}>
                        まだ記録がないため、グラフを表示できません。
                      </Text>
                    ) : (
                      <>
                        <Text style={[styles.chartBlockTitle, { color: c.text }]}>
                          主食・副食の日平均（0〜10）
                        </Text>
                        <SparseDualLineChart
                          points={mealStapleSidePoints}
                          width={mealChartW}
                          height={mealChartH}
                          lineColorA={stapleAvgLineColor}
                          lineColorB={sideAvgLineColor}
                          gridColor={c.border}
                          axisLabelColor={c.textSecondary}
                          minValue={mealStapleSideBounds.min}
                          maxValue={mealStapleSideBounds.max}
                          yTickCount={6}
                          formatYLabel={formatStapleSideAvgAxisLabel}
                        />
                        <View style={styles.chartLegendRow}>
                          <View style={styles.chartLegendItem}>
                            <View style={[styles.chartLegendSwatch, { backgroundColor: stapleAvgLineColor }]} />
                            <Text style={[styles.chartLegendLabel, { color: c.textSecondary }]}>主食（平均）</Text>
                          </View>
                          <View style={styles.chartLegendItem}>
                            <View style={[styles.chartLegendSwatch, { backgroundColor: sideAvgLineColor }]} />
                            <Text style={[styles.chartLegendLabel, { color: c.textSecondary }]}>副食（平均）</Text>
                          </View>
                        </View>

                        <Text style={[styles.chartBlockTitleSpaced, { color: c.text }]}>水分（1日合計・ml）</Text>
                        <SparseLineChart
                          points={mealWaterPoints}
                          width={mealChartW}
                          height={mealChartH}
                          lineColor={waterTotalLineColor}
                          gridColor={c.border}
                          axisLabelColor={c.textSecondary}
                          minValue={mealWaterBounds.min}
                          maxValue={mealWaterBounds.max}
                          yTickCount={6}
                          yTickSnap={1}
                          formatYLabel={(v) => `${Math.round(v)}`}
                        />
                      </>
                    )}
                  </View>
                ) : null}

                {loading && records.length === 0 ? (
                  <View style={styles.listLoading}>
                    <ActivityIndicator color={c.accent} />
                  </View>
                ) : null}
                {listError ? (
                  <Text style={[styles.errorText, { color: c.danger }]}>{listError}</Text>
                ) : null}
                {!loading && !listError && records.length === 0 && isSignedIn ? (
                  <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                    まだ記録がありません。被介護者トップの「入力」→「食事の入力」、または右上の「＋ 新規」から追加できます。
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
              const mealLabel = (MEAL_SLOTS as readonly string[]).includes(item.meal_slot)
                ? MEAL_SLOT_LABEL[item.meal_slot as MealSlotId]
                : item.meal_slot;
              const issueLabel =
                item.issue_status === 'issue'
                  ? PRE_SUBMIT_ISSUE_LABEL.issue
                  : PRE_SUBMIT_ISSUE_LABEL.ok;
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
                    <View style={styles.cardTop}>
                      <Text style={[careRecordListCardDateTextStyle, { color: c.textSecondary }]}>
                        {formatRecordedAtDisplayJa(item.recorded_at)}
                      </Text>
                    </View>
                    <Text
                      style={[careRecordListCardSummaryTextStyle(layout.isTablet), { color: c.text }]}
                      numberOfLines={8}>
                      {mealLabel} · 主食 {item.staple_amount}/10 · 副食 {item.side_amount}/10
                      {item.water_ml != null ? ` · 水分 ${item.water_ml} ml` : ''}
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
                    {item.memo ? (
                      <Text
                        style={[careRecordListCardMemoTextStyle(layout.isTablet), { color: c.textSecondary }]}
                        numberOfLines={4}>
                        メモ: {item.memo}
                      </Text>
                    ) : null}
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
    paddingHorizontal: MEAL_CHART_CARD_PAD_H,
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
  chartEmptyNote: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  chartBlockTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  chartBlockTitleSpaced: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 16,
  },
  chartLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLegendSwatch: {
    width: 22,
    height: 4,
    borderRadius: 2,
  },
  chartLegendLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  daySummarySection: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  daySummaryHeading: {
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  daySummaryCaption: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 16,
  },
  daySummaryRows: {
    gap: 14,
  },
  daySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  daySummaryLabel: {
    flex: 1,
    fontWeight: '700',
    lineHeight: 22,
  },
  daySummaryValue: {
    flexShrink: 0,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
