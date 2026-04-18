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
import { useVitalRecordsApi } from '@/api/hooks/useVitalRecordsApi';
import type { VitalRecordRecord } from '@/api/types/vitalRecord';
import { useCareRecipients } from '@/features/care-recipients';
import { PRE_SUBMIT_ISSUE_LABEL } from '@/features/care-records/meals/mealConstants';
import {
  careRecordListCardDateTextStyle,
  careRecordListCardMemoTextStyle,
  careRecordListCardSummaryTextStyle,
  formatRecordedAtDisplayJa,
  getJapanNowParts,
  isRecordedAtOnJapanDate,
  MonthCalendar,
} from '@/features/care-records/shared';
import { useCareRecipientStackBackHeader } from '@/features/care-records/useCareRecipientStackBackHeader';
import {
  boundsForBloodPressureChart,
  boundsForBodyTemperatureChart,
  boundsForIntegerChart,
  buildVitalLast7ChartSlots,
  formatTempAxisLabel,
} from '@/features/care-records/vitals/vitalsLast7ChartData';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

/** `styles.chartSection` の paddingHorizontal と一致 */
const VITAL_CHART_CARD_PAD_H = 14;

function formatVitalSummaryLine(item: VitalRecordRecord): string {
  const parts: string[] = [];
  if (item.body_temperature != null) {
    parts.push(`体温 ${item.body_temperature}℃`);
  }
  if (item.blood_pressure_systolic != null || item.blood_pressure_diastolic != null) {
    parts.push(
      `血圧 ${item.blood_pressure_systolic ?? '—'}／${item.blood_pressure_diastolic ?? '—'} mmHg`
    );
  }
  if (item.pulse_rate != null) {
    parts.push(`脈拍 ${item.pulse_rate} 回/分`);
  }
  if (item.spo2 != null) {
    parts.push(`SpO₂ ${item.spo2}％`);
  }
  return parts.length > 0 ? parts.join(' · ') : '（数値なし）';
}

export function VitalRecordsListScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const vitalRecordsApi = useVitalRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  /** 血圧のみ：最高＝暖色・最低＝寒色でアクセント（体温など）と被らせない */
  const bloodPressureSystolicColor = scheme === 'dark' ? '#ff8a80' : '#c62828';
  const bloodPressureDiastolicColor = scheme === 'dark' ? '#82b1ff' : '#1565c0';
  const pulseLineColor = scheme === 'dark' ? '#e8a87c' : '#b5651d';
  const spo2LineColor = scheme === 'dark' ? '#b4a7ff' : '#5c4dbe';
  useCareRecipientStackBackHeader(recipientId, c);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<VitalRecordRecord[]>([]);
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
      const data = await vitalRecordsApi.list(recipientId);
      setRecords(data);
      setListError(null);
    } catch (e) {
      setListError(isApiError(e) ? e.message : '一覧を読み込めませんでした');
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSignedIn, vitalRecordsApi, recipientId]);

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

  const vitalSlots = useMemo(() => buildVitalLast7ChartSlots(records), [records]);

  const vitalTempPoints = useMemo(
    () => vitalSlots.map((s) => ({ xLabel: s.xLabel, value: s.body_temperature })),
    [vitalSlots]
  );
  const vitalBpPoints = useMemo(
    () =>
      vitalSlots.map((s) => ({
        xLabel: s.xLabel,
        valueA: s.blood_pressure_systolic,
        valueB: s.blood_pressure_diastolic,
      })),
    [vitalSlots]
  );
  const vitalPulsePoints = useMemo(
    () => vitalSlots.map((s) => ({ xLabel: s.xLabel, value: s.pulse_rate })),
    [vitalSlots]
  );
  const vitalSpo2Points = useMemo(
    () => vitalSlots.map((s) => ({ xLabel: s.xLabel, value: s.spo2 })),
    [vitalSlots]
  );

  const vitalTempBounds = useMemo(() => boundsForBodyTemperatureChart(vitalSlots), [vitalSlots]);
  const vitalBpBounds = useMemo(() => boundsForBloodPressureChart(vitalSlots), [vitalSlots]);
  const vitalPulseBounds = useMemo(
    () => boundsForIntegerChart(vitalSlots, (s) => s.pulse_rate, { defaultMax: 120 }),
    [vitalSlots]
  );
  const vitalSpo2Bounds = useMemo(
    () => boundsForIntegerChart(vitalSlots, (s) => s.spo2, { defaultMax: 100 }),
    [vitalSlots]
  );

  const vitalChartW = Math.max(1, layout.railInnerWidth - VITAL_CHART_CARD_PAD_H * 2);
  const vitalChartH = layout.isTablet ? 158 : 146;

  const goNew = useCallback(() => {
    router.push({
      pathname: '/care/[recipientId]/vitals/new',
      params: { recipientId: recipientId! },
    } as Href);
  }, [recipientId, router]);

  const goEdit = useCallback(
    (id: string) => {
      router.push({
        pathname: '/care/[recipientId]/vitals/[id]',
        params: { recipientId: recipientId!, id },
      } as Href);
    },
    [recipientId, router]
  );

  const onDeleteRecord = useCallback(
    (id: string) => {
      if (!recipientId || !isSignedIn) return;
      Alert.alert('記録を削除', 'このバイタル記録を削除しますか？取り消せません。', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await vitalRecordsApi.destroy(recipientId, id);
                await fetchList();
              } catch (e) {
                Alert.alert('削除できません', isApiError(e) ? e.message : 'もう一度お試しください');
              }
            })();
          },
        },
      ]);
    },
    [fetchList, isSignedIn, vitalRecordsApi, recipientId]
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
                {`${recipient.name}さんのバイタルの記録です（新しい順）。各行の「編集」で修正、「削除」で消せます。新規は右上の「＋ 新規」か、被介護者トップの「入力」から開けます。\n\nタグは「そのときの様子」です。赤い「問題、気になる点あり」（警告マーク付き）は、施設やケアマネに相談したい記録として目立つようにしています。`}
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
                    <Text style={[styles.todayLinkText, { color: c.accent }]}>→今日を表示する</Text>
                  </Pressable>
                </View>
                <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
                  開いたときは今日の記録だけ表示します。カレンダーで日付を変えると、その日の記録に切り替わります。
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
                  <Text style={[styles.chartTitle, { color: c.text }]}>
                    バイタルの推移（直近7回・測定時刻順）
                  </Text>
                  <Text style={[styles.chartSub, { color: c.textSecondary }]}>
                    一覧から新しい順に最大7件を取り、グラフでは左から古い測定→右が新しい測定です。ある測定でその項目だけ未入力のときはそのスロットに点は出ませんが、前後の測定に値があれば点線で結びます（隣の測定どうしは実線。中間の値を表すわけではありません）。
                  </Text>

                  {vitalSlots.length === 0 ? (
                    <Text style={[styles.chartEmptyNote, { color: c.textSecondary }]}>
                      まだ記録がないため、グラフを表示できません。
                    </Text>
                  ) : (
                    <>
                      <Text style={[styles.chartBlockTitle, { color: c.text }]}>体温（℃）</Text>
                      <SparseLineChart
                        points={vitalTempPoints}
                        width={vitalChartW}
                        height={vitalChartH}
                        lineColor={c.accent}
                        gridColor={c.border}
                        axisLabelColor={c.textSecondary}
                        minValue={vitalTempBounds.min}
                        maxValue={vitalTempBounds.max}
                        formatYLabel={formatTempAxisLabel}
                        yTickCount={6}
                      />

                      <Text style={[styles.chartBlockTitleSpaced, { color: c.text }]}>血圧（mmHg）</Text>
                      <SparseDualLineChart
                        points={vitalBpPoints}
                        width={vitalChartW}
                        height={vitalChartH}
                        lineColorA={bloodPressureSystolicColor}
                        lineColorB={bloodPressureDiastolicColor}
                        gridColor={c.border}
                        axisLabelColor={c.textSecondary}
                        minValue={vitalBpBounds.min}
                        maxValue={vitalBpBounds.max}
                        yTickCount={6}
                        yTickSnap={1}
                      />
                      <View style={styles.chartLegendRow}>
                        <View style={styles.chartLegendItem}>
                          <View
                            style={[styles.chartLegendSwatch, { backgroundColor: bloodPressureSystolicColor }]}
                          />
                          <Text style={[styles.chartLegendLabel, { color: c.textSecondary }]}>最高（収縮期）</Text>
                        </View>
                        <View style={styles.chartLegendItem}>
                          <View
                            style={[styles.chartLegendSwatch, { backgroundColor: bloodPressureDiastolicColor }]}
                          />
                          <Text style={[styles.chartLegendLabel, { color: c.textSecondary }]}>最低（拡張期）</Text>
                        </View>
                      </View>

                      <Text style={[styles.chartBlockTitleSpaced, { color: c.text }]}>脈拍（回/分）</Text>
                      <SparseLineChart
                        points={vitalPulsePoints}
                        width={vitalChartW}
                        height={vitalChartH}
                        lineColor={pulseLineColor}
                        gridColor={c.border}
                        axisLabelColor={c.textSecondary}
                        minValue={vitalPulseBounds.min}
                        maxValue={vitalPulseBounds.max}
                        yTickCount={6}
                        yTickSnap={1}
                      />

                      <Text style={[styles.chartBlockTitleSpaced, { color: c.text }]}>SpO₂（％）</Text>
                      <SparseLineChart
                        points={vitalSpo2Points}
                        width={vitalChartW}
                        height={vitalChartH}
                        lineColor={spo2LineColor}
                        gridColor={c.border}
                        axisLabelColor={c.textSecondary}
                        minValue={vitalSpo2Bounds.min}
                        maxValue={vitalSpo2Bounds.max}
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
              {listError ? <Text style={[styles.errorText, { color: c.danger }]}>{listError}</Text> : null}
              {!loading && !listError && records.length === 0 && isSignedIn ? (
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  まだ記録がありません。被介護者トップの「入力」→「バイタルの入力」、または右上の「＋ 新規」から追加できます。
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
                    numberOfLines={10}>
                    {formatVitalSummaryLine(item)}
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
    paddingHorizontal: VITAL_CHART_CARD_PAD_H,
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
