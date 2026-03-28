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
  | 'rehab'
  | 'sleep'
  | 'notes'
  | 'image-memos'
  | 'pdf-export';

export type CareRecordMenuItem = {
  segment: CareRecordRouteSegment;
  /** 被介護者トップのセクション分け: 入力系 / 一覧・PDF など */
  menuSection: 'input' | 'list';
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
  rehab: '/care/[recipientId]/rehab',
  sleep: '/care/[recipientId]/sleep',
  notes: '/care/[recipientId]/notes',
  'image-memos': '/care/[recipientId]/image-memos',
  'pdf-export': '/care/[recipientId]/pdf-export',
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
    segment: 'bathing',
    menuSection: 'input',
    title: '入浴',
    subtitle: '記録を入力する',
    symbol: { ios: 'shower.fill', android: 'bathtub', web: 'bathtub' },
    screenHeaderTitle: '入浴',
    screenHeading: '入浴の記録',
    screenDescription: '入浴の有無・方法・介助内容などを記録・一覧できるようにします。',
  },
  {
    segment: 'rehab',
    menuSection: 'input',
    title: 'リハビリ運動',
    subtitle: '記録を入力する',
    symbol: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
    screenHeaderTitle: 'リハビリ',
    screenHeading: 'リハビリ・運動の記録',
    screenDescription: '運動内容・時間・負担の程度などを入力し、経過を振り返れるようにします。',
  },
  {
    segment: 'sleep',
    menuSection: 'input',
    title: '睡眠',
    subtitle: '記録を入力する',
    symbol: { ios: 'moon.zzz.fill', android: 'bedtime', web: 'bedtime' },
    screenHeaderTitle: '睡眠',
    screenHeading: '睡眠の記録',
    screenDescription: '就寝・起床時刻や眠りの深さ、日中の眠気などを記録・一覧できるようにします。',
  },
  {
    segment: 'notes',
    menuSection: 'input',
    title: 'その他の気づき',
    subtitle: '自由にメモを入力する',
    symbol: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
    screenHeaderTitle: '気づき',
    screenHeading: 'その他の気づき',
    screenDescription:
      'カテゴリに当てはまらない観察やメモを自由に残し、あとから検索しやすくします。',
  },
  {
    segment: 'image-memos',
    menuSection: 'input',
    title: '画像メモ',
    subtitle: '写真を登録・入力する',
    symbol: { ios: 'photo.on.rectangle.angled', android: 'image', web: 'image' },
    screenHeaderTitle: '画像メモ',
    screenHeading: '画像メモ',
    screenDescription:
      '患部の様子や環境の写真などを日付とともに保存し、一覧・拡大表示できるようにします。',
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
    segment: 'pdf-export',
    menuSection: 'list',
    title: '介護記録のPDF',
    subtitle: '出力・共有',
    symbol: { ios: 'doc.richtext.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' },
    screenHeaderTitle: 'PDF出力',
    screenHeading: '介護記録のPDF',
    screenDescription:
      '期間を選んで各記録をまとめたPDFを生成し、印刷や医療機関への共有に使えるようにします。',
  },
];

const menuBySegment = Object.fromEntries(
  CARE_RECORD_MENU.map((item) => [item.segment, item])
) as Record<CareRecordRouteSegment, CareRecordMenuItem>;

export function getCareRecordMenuItem(segment: CareRecordRouteSegment): CareRecordMenuItem {
  return menuBySegment[segment];
}
