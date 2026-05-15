// config.js - 設定ファイル
// ⚠️ APIキーをGitHubに公開しないよう注意してください

const CONFIG = {
  // Anthropic APIキー
  // GitHub Pagesで公開する場合は、APIキーをフロントに直接書かないことを推奨
  // 開発・テスト用にここに記載するか、ユーザーにゲーム内で入力してもらう方式を採用
  ANTHROPIC_API_KEY: '', // ← ここにAPIキーを入力するか、ゲーム内入力フォームを使用

  // AIモデル設定
  AI_MODEL: 'claude-sonnet-4-20250514',
  AI_MAX_TOKENS: 200,

  // デバッグモード（trueにするとコンソールにログを出力）
  DEBUG: false,
};
