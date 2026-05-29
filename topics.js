// topics.js - カテゴリ別お題 ＋ 7種の修飾語カテゴリシステム

// ===== お題カテゴリ =====
const CATEGORIES = ['食べ物・飲み物', '学校', '動物', 'スポーツ', '家電', 'イベント'];

// ===== カテゴリ別お題リスト =====
const TOPICS_BY_CATEGORY = {
  '食べ物・飲み物': [
    'りんご', 'バナナ', 'ピザ', 'ラーメン', 'すし', 'ケーキ', 'コーヒー', 'カレー',
    'おにぎり', 'アイスクリーム', 'チョコレート', 'スイカ', 'たこ焼き', 'ハンバーガー', 'お茶'
  ],
  '学校': [
    '黒板', '給食', '体育館', '教科書', '先生', 'ランドセル', '試験', '運動会',
    '図書館', '修学旅行', '卒業式', '部活', '文化祭', '通知表', '机'
  ],
  '動物': [
    '犬', '猫', 'ゾウ', 'キリン', 'ペンギン', 'タコ', 'カメレオン', 'クジラ',
    'ライオン', 'パンダ', 'コアラ', 'ハシビロコウ', 'アルパカ', 'カブトムシ', 'フラミンゴ'
  ],
  'スポーツ': [
    'サッカー', '野球', 'バスケットボール', '水泳', 'テニス', '柔道', 'スキー',
    'バレーボール', '卓球', 'ゴルフ', 'ラグビー', 'フィギュアスケート', 'ボクシング', '相撲', 'バドミントン'
  ],
  '家電': [
    '冷蔵庫', '掃除機', 'テレビ', '電子レンジ', 'スマホ', '洗濯機', 'エアコン',
    'ドライヤー', 'パソコン', '炊飯器', 'ロボット掃除機', 'スピーカー', 'カメラ', 'タブレット', '電気ケトル'
  ],
  'イベント': [
    '花火大会', '誕生日パーティー', 'クリスマス', 'お祭り', '結婚式', '初詣',
    'ハロウィン', 'バレンタイン', '卒業式', '入学式', 'お花見', '大晦日', '七夕', '夏フェス'
  ]
};

// ===== 7種の修飾語カテゴリ =====
// 追加順：動詞→色→形（最初の3ターン、ランダム順）→外面→属性→素材→内面（以降固定順）
const MODIFIER_CATEGORIES = {
  // ① 動詞
  verb: {
    label: '動詞',
    easy:   ['素早く動ける', '光っている', '食べられる', '飛べる', '泳げる', '走れる', '跳べる'],
    normal: ['歌える', '踊れる', '話せる', '消える', '変形できる', '時間を止められる', '透明になれる'],
    hard:   ['魂を吸い取る', '現実を書き換える', '夢に入れる', '記憶を消せる', '次元を越えられる']
  },
  // ② 色
  color: {
    label: '色',
    easy:   ['赤い', '青い', '黄色い', '緑の', '白い', '黒い', 'ピンクの', '紫の', 'オレンジの'],
    normal: ['虹色の', '金色の', '銀色の', '半透明の', '縞模様の', '水玉模様の', 'グラデーションの'],
    hard:   ['見る角度で色が変わる', '光を吸収する漆黒の', '存在しない色をした', '人によって色が違って見える']
  },
  // ③ 形
  shape: {
    label: '形・大きさ',
    easy:   ['大きい', '小さい', '丸い', '四角い', '長い', '短い', 'ふわふわした', 'ぺたんこな'],
    normal: ['ぐにゃぐにゃした', '逆さまの', '二頭身の', 'ミニチュアの', '巨大な', '薄い', '球体の'],
    hard:   ['4次元的な形をした', '見るたびに形が変わる', '影が三角形の', '断面が星形の']
  },
  // ④ 外面的修飾語（4ターン目固定）
  outer: {
    label: '外見',
    easy:   ['触角が生えた', '眼鏡をかけている', '帽子をかぶった', '翼が生えた', '尻尾がある', 'ひげがある'],
    normal: ['目が三つある', '仮面をつけた', '鎧を着た', 'マントをつけた', '傷がある', '発光している'],
    hard:   ['顔が背中にある', '体が透けて内臓が見える', '影が人間の形をした', '鏡の中にしか映らない']
  },
  // ⑤ 属性（5ターン目固定）
  attribute: {
    label: '属性',
    easy:   ['炎属性の', '水属性の', '風属性の', '土属性の', '雷属性の', '氷属性の', '光属性の'],
    normal: ['闇属性の', '聖属性の', '毒属性の', '時間属性の', '重力属性の', '空間属性の'],
    hard:   ['無属性（全てを無効化する）', '存在属性の', '虚無属性の', '概念属性の']
  },
  // ⑥ 素材（6ターン目固定）
  material: {
    label: '素材',
    easy:   ['紙でできた', '木でできた', '金属製の', 'ガラス製の', 'ゴム製の', '石でできた', '布でできた'],
    normal: ['電気を通す', '磁石にくっつく', '水に浮かぶ', '燃えない', '錆びない', '腐らない'],
    hard:   ['反物質でできた', 'ダークマターでできた', '概念でできた', '記憶でできた', '光そのものでできた']
  },
  // ⑦ 内面的修飾語（7ターン目固定）
  inner: {
    label: '内面',
    easy:   ['元気な', '眠い', '怒っている', '悲しい', '嬉しい', '恥ずかしい', '驚いている'],
    normal: ['パリピな', '哲学的な', '暑いのが苦手な', '負けず嫌いな', '人見知りな', 'ポジティブすぎる'],
    hard:   ['虚無を抱えた', '宇宙の真理を知っている', '過去と未来を同時に生きている', '存在することに疑問を持つ']
  }
};

// ===== 修飾語追加の順序ルール =====
// 最初の3ターン：verb / color / shape からランダムな順で1つずつ
// 4ターン目以降：outer → attribute → material → inner の固定順
const MODIFIER_PHASE_FIXED = ['outer', 'attribute', 'material', 'inner'];

// ゲーム開始時に最初の3フェーズの順序をシャッフルして返す
function generateModifierOrder() {
  const first3 = ['verb', 'color', 'shape'];
  // Fisher-Yates シャッフル
  for (let i = first3.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [first3[i], first3[j]] = [first3[j], first3[i]];
  }
  return [...first3, ...MODIFIER_PHASE_FIXED];
}

// 指定カテゴリから修飾語を1つランダムに返す（使用済み除外）
function getModifierFromCategory(categoryKey, difficulty, usedModifiers = []) {
  const cat = MODIFIER_CATEGORIES[categoryKey];
  if (!cat) return null;
  const list = cat[difficulty] || cat.normal;
  const available = list.filter(m => !usedModifiers.includes(m));
  const pool = available.length > 0 ? available : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

// カテゴリキーからラベルを返す
function getModifierCategoryLabel(categoryKey) {
  return MODIFIER_CATEGORIES[categoryKey]?.label || categoryKey;
}

// お題をランダムに取得
function getRandomTopicWithCategory() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const list = TOPICS_BY_CATEGORY[category];
  const topic = list[Math.floor(Math.random() * list.length)];
  return { topic, category };
}

// 後方互換用（旧 getRandomModifier は game.js から呼ばれない想定だが念のため残す）
function getRandomModifier(difficulty = 'normal', usedModifiers = []) {
  const allKeys = Object.keys(MODIFIER_CATEGORIES);
  const key = allKeys[Math.floor(Math.random() * allKeys.length)];
  return getModifierFromCategory(key, difficulty, usedModifiers);
}
