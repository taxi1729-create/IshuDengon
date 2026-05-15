# 異種伝言ゲーム (ishu_dengon)

スマホで遊ぶ、アクションが「異なる」伝言ゲーム。

---

## 遊び方

1. GitHub Pagesでホスティング後、スマホで `https://{ユーザー名}.github.io/ishu_dengon/` を開く
2. タイトル画面で人数・難易度・音量を設定してスタート
3. 各プレイヤーが順番に違うアクションでお題を伝えていく
4. 最後の人が口頭で答え、最初の人が正誤判定

---

## GitHub Pages デプロイ手順

### 1. リポジトリ作成

```bash
# GitHubでリポジトリを作成後
git clone https://github.com/{ユーザー名}/ishu_dengon.git
cd ishu_dengon
```

### 2. ファイルを配置

このフォルダの中身をすべてリポジトリのルートにコピーしてください。

```
ishu_dengon/
├── index.html
├── style.css
├── config.js
├── topics.js
├── game.js
├── ui.js
├── actions/
│   ├── ai-transform.js
│   ├── drawing.js
│   ├── shapes.js
│   └── verbal.js
├── README.md
└── SPEC.md
```

### 3. プッシュ

```bash
git add .
git commit -m "Initial release"
git push origin main
```

### 4. GitHub Pages を有効化

1. GitHubのリポジトリページ → **Settings**
2. 左メニュー → **Pages**
3. **Source**: `Deploy from a branch`
4. **Branch**: `main` / `/ (root)` を選択
5. **Save**

数分後に `https://{ユーザー名}.github.io/ishu_dengon/` でアクセス可能になります。

---

## AI変換アクションの設定

`config.js` を開いて、Anthropic APIキーを設定してください：

```javascript
const CONFIG = {
  ANTHROPIC_API_KEY: 'sk-ant-xxxxxxxx', // ← ここに入力
  ...
};
```

または、ゲームのタイトル画面でプレイ前に直接入力することもできます。

⚠️ **注意**: APIキーをGitHub（パブリックリポジトリ）にコミットしないでください。  
プライベートリポジトリを使用するか、タイトル画面での入力方式を使用してください。

---

## お題の追加・編集

`topics.js` を開いて、難易度ごとの配列にお題を追加するだけです：

```javascript
const TOPICS = {
  easy:   ["りんご", "犬", "..."],  // やさしい
  normal: ["二日酔い", "..."],       // ふつう
  hard:   ["量子もつれ", "..."],     // むずかしい
};
```

---

## ファイル構成と編集ガイド

| ファイル | 役割 | 主な編集内容 |
|---------|------|-------------|
| `index.html` | 画面のHTML構造 | UIレイアウト変更 |
| `style.css` | デザイン全般 | 色・フォント・レイアウト |
| `config.js` | API設定 | APIキー・モデル設定 |
| `topics.js` | お題リスト | お題の追加・編集 |
| `game.js` | ゲームロジック | 状態管理・サウンド |
| `ui.js` | 画面制御 | 画面遷移・描画 |
| `actions/ai-transform.js` | AI変換アクション | AIプロンプト調整 |
| `actions/drawing.js` | お絵描きアクション | 描画ツール追加 |
| `actions/shapes.js` | 抽象図形アクション | 図形種類の追加 |
| `actions/verbal.js` | 口頭アクション | 縛りルールの追加 |

---

## 技術スタック

- **HTML5 / CSS3 / Vanilla JavaScript** — フレームワーク不使用
- **HTML5 Canvas API** — お絵描き・図形配置
- **Web Audio API** — サウンド生成
- **Vibration API** — スマホバイブレーション
- **Anthropic API** — AI変換アクション
- **GitHub Pages** — ホスティング（無料）

---

## 仕様書

詳細な仕様は [SPEC.md](./SPEC.md) を参照してください。
