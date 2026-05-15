// game.js - ゲームロジック・状態管理

const GameState = {
  // 設定
  playerCount: 3,
  difficulty: 'normal',
  volume: 0.7,
  apiKey: '',

  // ゲーム中の状態
  currentTopic: '',
  currentPlayerIndex: 0,
  roundData: [], // 各プレイヤーのアクション記録
  isCorrect: null,

  // リセット
  reset() {
    this.currentTopic = '';
    this.currentPlayerIndex = 0;
    this.roundData = [];
    this.isCorrect = null;
  },

  // 現在のプレイヤー番号（1始まり）
  get currentPlayer() {
    return this.currentPlayerIndex + 1;
  },

  // 最後のプレイヤーかどうか
  get isLastPlayer() {
    return this.currentPlayerIndex === this.playerCount - 1;
  },

  // 最後から1人前かどうか（口頭アクション解放条件）
  get isSecondToLast() {
    return this.currentPlayerIndex === this.playerCount - 2;
  },

  // 1人目かどうか
  get isFirstPlayer() {
    return this.currentPlayerIndex === 0;
  },

  // 次のプレイヤーへ
  nextPlayer() {
    this.currentPlayerIndex++;
  },

  // アクション結果を記録
  recordAction(actionType, actionData) {
    this.roundData.push({
      playerIndex: this.currentPlayerIndex,
      actionType,
      actionData,
      timestamp: Date.now()
    });
  }
};

// ===== サウンド管理 =====
const SoundManager = {
  context: null,
  gainNode: null,

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.setVolume(GameState.volume);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  },

  setVolume(vol) {
    GameState.volume = vol;
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    }
  },

  // 簡易ビープ音生成
  playBeep(freq = 440, duration = 0.15, type = 'sine') {
    if (!this.context) return;
    try {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      const osc = this.context.createOscillator();
      const envGain = this.context.createGain();
      osc.connect(envGain);
      envGain.connect(this.gainNode);
      osc.type = type;
      osc.frequency.value = freq;
      envGain.gain.setValueAtTime(0.5, this.context.currentTime);
      envGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      osc.start(this.context.currentTime);
      osc.stop(this.context.currentTime + duration);
    } catch (e) {}
  },

  playNext() {
    this.playBeep(600, 0.1);
    setTimeout(() => this.playBeep(800, 0.1), 100);
  },

  playWrong() {
    this.playBeep(300, 0.2, 'sawtooth');
    setTimeout(() => this.playBeep(200, 0.3, 'sawtooth'), 150);
  },

  playCorrect() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playBeep(f, 0.15), i * 100);
    });
  },

  playClick() {
    this.playBeep(700, 0.05);
  }
};

// ===== バイブレーション =====
function vibrate(pattern = [50]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
