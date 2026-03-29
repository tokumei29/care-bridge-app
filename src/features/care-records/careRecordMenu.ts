/**
 * 被介護者ごとの介護記録トップ画面から遷移する記録メニュー（表示文言・ルート名・アイコン）。
 * ログイン画面は後日実装予定のため、ここでは認証に依存しない。
 */

export type CareRecordRouteSegment =
  | 'meals'
  | 'meals-new'
  | 'excretion'
  | 'excretion-new'
  | 'vitals'
  | 'vitals-new'
  | 'bathing'
  | 'bathing-new'
  | 'rehab'
  | 'rehab-new'
  | 'sleep'
  | 'sleep-new'
  | 'notes'
  | 'notes-new'
  | 'image-memos'
  | 'image-memos-new'
  | 'pdf-export'
  | 'pdf-export-daily';

export type CareRecordMenuItem = {
  segment: CareRecordRouteSegment;
  /** 被介護者トップのセクション分け: 入力 / 一覧・編集 / その他（PDF など） */
  menuSection: 'input' | 'list' | 'other';
  title: string;
  subtitle: string;
  symbol: { ios: string; android: string; web: string };
  /** 記録画面のナビタイトル（短め） */
  screenHeaderTitle: string;
  /** 記録画面の見出し */
  screenHeading: string;
  /** 記録画面の説明（プレースホルダー） */
  screenDescription: string;
};

/** expo-router の `pathname`（`router.push` の `Href` に渡す） */
export const CARE_RECORD_PATHNAME: Record<CareRecordRouteSegment, string> = {
  meals: '/care/[recipientId]/meals',
  'meals-new': '/care/[recipientId]/meals/new',
  excretion: '/care/[recipientId]/excretion',
  'excretion-new': '/care/[recipientId]/excretion/new',
  vitals: '/care/[recipientId]/vitals',
  'vitals-new': '/care/[recipientId]/vitals/new',
  bathing: '/care/[recipientId]/bathing',
  'bathing-new': '/care/[recipientId]/bathing/new',
  rehab: '/care/[recipientId]/rehab',
  'rehab-new': '/care/[recipientId]/rehab/new',
  sleep: '/care/[recipientId]/sleep',
  'sleep-new': '/care/[recipientId]/sleep/new',
  notes: '/care/[recipientId]/notes',
  'notes-new': '/care/[recipientId]/notes/new',
  'image-memos': '/care/[recipientId]/image-memos',
  'image-memos-new': '/care/[recipientId]/image-memos/new',
  'pdf-export': '/care/[recipientId]/pdf-export',
  'pdf-export-daily': '/care/[recipientId]/pdf-export-daily',
};

/** 表示順: 入力セクション用を先に、一覧セクション用を後に並べる */
export const CARE_RECORD_MENU: CareRecordMenuItem[] = [
  {
    segment: 'meals-new',
    menuSection: 'input',
    title: '食事の入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '食事の入力',
    screenDescription:
      '食事のタイミング・主食・副食の量・水分・メモなどを入力して保存します。',
  },
  {
    segment: 'excretion-new',
    menuSection: 'input',
    title: '排泄の入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '排泄の入力',
    screenDescription:
      '排尿・排便の有無と量、便の状態、メモなどを入力して保存します。',
  },
  {
    segment: 'vitals-new',
    menuSection: 'input',
    title: 'バイタルの入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: 'バイタルの入力',
    screenDescription:
      '体温・血圧（最高・最低）・脈拍・SpO₂・メモなどを入力して保存します。',
  },
  {
    segment: 'bathing-new',
    menuSection: 'input',
    title: '入浴の入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '入浴の入力',
    screenDescription:
      '入浴の日時・気づきや様子のメモ・問題の有無を入力して保存します。',
  },
  {
    segment: 'rehab-new',
    menuSection: 'input',
    title: 'リハビリ活動の入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: 'リハビリ活動の入力',
    screenDescription:
      '日付・開始・終了時刻（日本時間）、行った内容・メモ、問題の有無を入力して保存します。',
  },
  {
    segment: 'sleep-new',
    menuSection: 'input',
    title: '睡眠の入力',
    subtitle: '新しく記録を追加する',
    symbol: { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '睡眠の入力',
    screenDescription:
      '臥床した日付と臥床・起床時刻（日本時間）、メモ、問題の有無を入力して保存します。',
  },
  {
    segment: 'notes-new',
    menuSection: 'input',
    title: '認知症の様子、その他気づきの入力',
    subtitle: '日時・様子・メモ・問題の有無を記録する',
    symbol: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '認知症の様子、その他気づき',
    screenDescription:
      '気づいた日時（日本時間）、認知症の様子（平穏・不穏など）、その他の気づき、問題の有無を入力して保存します。',
  },
  {
    segment: 'image-memos-new',
    menuSection: 'input',
    title: '画像メモの入力',
    subtitle: '写真・日時・メモ・問題の有無を記録する',
    symbol: { ios: 'photo.on.rectangle.angled', android: 'image', web: 'image' },
    screenHeaderTitle: '新しく記録',
    screenHeading: '画像メモ',
    screenDescription:
      '日常の様子や、ケガ・褥瘡の経過など介護に必要な写真を、日時（日本時間）・メモ・問題の有無とともに保存します。',
  },
  {
    segment: 'meals',
    menuSection: 'list',
    title: '食事の記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '食事の記録',
    screenHeading: '食事の記録一覧',
    screenDescription:
      '過去の食事記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'excretion',
    menuSection: 'list',
    title: '排泄の記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '排泄の記録',
    screenHeading: '排泄の記録一覧',
    screenDescription:
      '過去の排泄記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'vitals',
    menuSection: 'list',
    title: 'バイタルの記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: 'バイタルの記録',
    screenHeading: 'バイタルの記録一覧',
    screenDescription:
      '過去のバイタル記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'bathing',
    menuSection: 'list',
    title: '入浴の記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '入浴の記録',
    screenHeading: '入浴の記録一覧',
    screenDescription:
      '過去の入浴記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'rehab',
    menuSection: 'list',
    title: 'リハビリ活動の記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: 'リハビリ活動の記録',
    screenHeading: 'リハビリ活動の記録一覧',
    screenDescription:
      '過去のリハビリ活動の記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'sleep',
    menuSection: 'list',
    title: '睡眠の記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '睡眠の記録',
    screenHeading: '睡眠の記録一覧',
    screenDescription:
      '過去の睡眠記録を臥床した日で絞り込んで一覧表示します。',
  },
  {
    segment: 'notes',
    menuSection: 'list',
    title: '認知症の様子、その他気づきの記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '様子・気づきの記録',
    screenHeading: '認知症の様子、その他気づきの一覧',
    screenDescription:
      '過去の記録を日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'image-memos',
    menuSection: 'list',
    title: '画像メモの記録',
    subtitle: '一覧で見る。各行から編集・削除',
    symbol: { ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' },
    screenHeaderTitle: '画像メモ',
    screenHeading: '画像メモの一覧',
    screenDescription:
      '過去の画像メモを日付で絞り込んで一覧表示します。',
  },
  {
    segment: 'pdf-export',
    menuSection: 'other',
    title: '介護記録のPDF（月）',
    subtitle: '月単位で出力・共有',
    symbol: { ios: 'doc.richtext.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' },
    screenHeaderTitle: 'PDF（月）',
    screenHeading: '介護記録のPDF（月単位）',
    screenDescription:
      '記録の概要を月の範囲でPDFにまとめます。遠方のご家族への共有や要介護認定の疎明資料などに使えます。',
  },
  {
    segment: 'pdf-export-daily',
    menuSection: 'other',
    title: '介護記録のPDF（日）',
    subtitle: '最大14日・日単位で出力',
    symbol: { ios: 'doc.richtext.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' },
    screenHeaderTitle: 'PDF（日）',
    screenHeading: '介護記録のPDF（日単位）',
    screenDescription:
      '記録の概要を日単位の範囲でPDFにまとめます。期間は最大14日までです（氏名・作成者・項目・共有メモは月単位と同じです）。',
  },
];

const menuBySegment = Object.fromEntries(
  CARE_RECORD_MENU.map((item) => [item.segment, item])
) as Record<CareRecordRouteSegment, CareRecordMenuItem>;

export function getCareRecordMenuItem(segment: CareRecordRouteSegment): CareRecordMenuItem {
  return menuBySegment[segment];
}
