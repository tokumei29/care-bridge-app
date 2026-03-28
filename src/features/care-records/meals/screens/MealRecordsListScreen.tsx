import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
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
import { ContentRail } from '@/components/layout/ContentRail';
import { ScreenBackdrop } from '@/components/layout/ScreenBackdrop';
import { useColorScheme } from '@/components/useColorScheme';
import { isApiError } from '@/api/errors';
import { useMealRecordsApi } from '@/api/hooks/useMealRecordsApi';
import type { MealRecordRecord } from '@/api/types/mealRecord';
import { useCareRecipients } from '@/features/care-recipients';
import {
  formatRecordedAtDisplayJa,
  getJapanNowParts,
  isRecordedAtInJapanDayWindow,
  MonthCalendar,
  pad2,
  TimeWheelsRow,
} from '@/features/care-records/shared';
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  PRE_SUBMIT_ISSUE_LABEL,
  type MealSlotId,
} from '@/features/care-records/meals/mealConstants';
import { useResponsiveLayout } from '@/lib/useResponsiveLayout';
import { getCareBridgeColors } from '@/theme/careBridge';

export function MealRecordsListScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { getRecipientById, isReady, isSignedIn } = useCareRecipients();
  const mealRecordsApi = useMealRecordsApi();
  const scheme = useColorScheme();
  const c = getCareBridgeColors(scheme);
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<MealRecordRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [filterDateKey, setFilterDateKey] = useState(() => getJapanNowParts().dateKey);
  const [rangeStartHour, setRangeStartHour] = useState(0);
  const [rangeStartMinute, setRangeStartMinute] = useState(0);
  const [rangeEndHour, setRangeEndHour] = useState(23);
  const [rangeEndMinute, setRangeEndMinute] = useState(59);
  const [filterOpen, setFilterOpen] = useState(false);

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
    return records.filter((r) =>
      isRecordedAtInJapanDayWindow(
        r.recorded_at,
        filterDateKey,
        rangeStartHour,
        rangeStartMinute,
        rangeEndHour,
        rangeEndMinute
      )
    );
  }, [records, filterDateKey, rangeStartHour, rangeStartMinute, rangeEndHour, rangeEndMinute]);

  const rangeSummary = useMemo(() => {
    return `${pad2(rangeStartHour)}:${pad2(rangeStartMinute)} 〜 ${pad2(rangeEndHour)}:${pad2(rangeEndMinute)}`;
  }, [rangeEndHour, rangeEndMinute, rangeStartHour, rangeStartMinute]);

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
    setRangeStartHour(0);
    setRangeStartMinute(0);
    setRangeEndHour(23);
    setRangeEndMinute(59);
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
                  {`${recipient.name}さんのこれまでの記録です（新しい順・日本時間）。各行の「編集」で修正、「削除」で消せます。新規は右上の「＋ 新規」か、被介護者トップの「入力」から開けます。`}
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
                  <Pressable
                    onPress={() => setFilterOpen((o) => !o)}
                    style={({ pressed }) => [
                      styles.filterToggle,
                      {
                        borderColor: c.borderStrong,
                        backgroundColor: c.surfaceSolid,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <Text style={[styles.filterToggleText, { color: c.text }]}>
                      {filterOpen ? '▼' : '▶'} 日付・時間帯で絞り込み
                    </Text>
                    <Text style={[styles.filterToggleSub, { color: c.textSecondary }]}>
                      {filterDateKey} · {rangeSummary} ／ {filteredRecords.length} 件表示
                    </Text>
                  </Pressable>
                  {filterOpen ? (
                    <>
                      <View style={styles.sectionTitleRow}>
                        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 14 }]}>
                          表示する日付
                        </Text>
                        <Pressable onPress={jumpToToday} style={styles.todayLink}>
                          <Text style={[styles.todayLinkText, { color: c.accent }]}>今日</Text>
                        </Pressable>
                      </View>
                      <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
                        カレンダーで日付を選ぶと、その日の記録だけ一覧に残します。
                      </Text>
                      <MonthCalendar selectedKey={filterDateKey} onChangeKey={setFilterDateKey} />

                      <Text style={[styles.sectionTitle, { color: c.text, marginTop: 18 }]}>
                        表示する時間帯
                      </Text>
                      <Text style={[styles.sectionSub, { color: c.textSecondary }]}>
                        その日の開始〜終了時刻に含まれる記録だけ表示します。
                      </Text>
                      <Text style={[styles.rangeLabel, { color: c.text }]}>開始</Text>
                      <TimeWheelsRow
                        hour={rangeStartHour}
                        minute={rangeStartMinute}
                        onHourChange={setRangeStartHour}
                        onMinuteChange={setRangeStartMinute}
                        layout={layout}
                        c={c}
                      />
                      <Text style={[styles.rangeLabel, { color: c.text, marginTop: 14 }]}>終了</Text>
                      <TimeWheelsRow
                        hour={rangeEndHour}
                        minute={rangeEndMinute}
                        onHourChange={setRangeEndHour}
                        onMinuteChange={setRangeEndMinute}
                        layout={layout}
                        c={c}
                      />
                    </>
                  ) : null}
                </View>
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
                    この日・この時間帯に該当する記録はありません。日付や時間帯を変えてみてください。
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
                      <Text style={[styles.cardDate, { color: c.text }]}>
                        {formatRecordedAtDisplayJa(item.recorded_at)}
                      </Text>
                    </View>
                    <Text style={[styles.cardSub, { color: c.textSecondary }]}>
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
                    {item.memo ? (
                      <Text style={[styles.cardMemo, { color: c.textSecondary }]} numberOfLines={2}>
                        {item.memo}
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
    marginBottom: 12,
    lineHeight: 18,
  },
  filterToggle: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  filterToggleSub: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  rangeLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
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
  cardDate: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 18,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardMemo: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
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
