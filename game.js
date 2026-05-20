// game.js - ゲームロジック・状態管理

const GameState = {
  // 設定
  playerCount: 3,
  difficulty: 'normal',
  volume: 0.7,
  geminiApiKey: '',

  // ゲーム中の状態
  baseTopic: '',        // 最初のお題（名詞）
  category: '',         // カテゴリ
  currentModifiers: [], // 累積された修飾語リスト
  currentPlayerIndex: 0,
  roundData: [],        // 各プレイヤーのアクション記録
  isCorrect: null,
  usedModifiers: [],    // 重複防止

  // リセット
  reset() {
    this.baseTopic = '';
    this.category = '';
    this.currentModifiers = [];
    this.currentPlayerIndex = 0;
    this.roundData = [];
    this.isCorrect = null;
    this.usedModifiers = [];
  },

  // 現在のお題文字列（修飾語 + 名詞）
  get currentTopic() {
    if (this.currentModifiers.length === 0) return this.baseTopic;
    return this.currentModifiers.join('') + this.baseTopic;
  },

  // 1人目が伝える現在のお題（1人目は素のお題）
  get topicForFirstPlayer() {
    return this.baseTopic;
  },

  // 現在のプレイヤー番号（1始まり）
  get currentPlayer() {
    return this.currentPlayerIndex + 1;
  },

  get isLastPlayer() {
    return this.currentPlayerIndex === this.playerCount - 1;
  },

  get isFirstPlayer() {
    return this.currentPlayerIndex === 0;
  },

  // 次のプレイヤーへ進む（修飾語を1つ追加する）
  nextPlayer() {
    if (!this.isLastPlayer) {
      // 次の人に渡す前に修飾語を追加
      const newMod = getRandomModifier(this.difficulty, this.usedModifiers);
      this.currentModifiers.unshift(newMod); // 先頭に追加（後ろの名詞にかかる形）
      this.usedModifiers.push(newMod);
    }
    this.currentPlayerIndex++;
  },

  // アクション結果を記録
  recordAction(actionType, actionData) {
    this.roundData.push({
      playerIndex: this.currentPlayerIndex,
      actionType,
      actionData,
      topicAtTime: this.currentTopic,
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
    if (this.gainNode) this.gainNode.gain.value = vol;
  },

  playBeep(freq = 440, duration = 0.15, type = 'sine') {
    if (!this.context) return;
    try {
      if (this.context.state === 'suspended') this.context.resume();
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
  playClick() { this.playBeep(700, 0.05); },
  playCountdown() { this.playBeep(880, 0.08, 'square'); },
  playBuzz() {
    this.playBeep(200, 0.4, 'sawtooth');
    setTimeout(() => this.playBeep(150, 0.4, 'sawtooth'), 100);
  }
};

function vibrate(pattern = [50]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ===== Gemini API呼び出し共通 =====
async function callGemini(prompt) {
  const key = GameState.geminiApiKey || CONFIG.GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${key}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 }
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gemini API Error');
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('Gemini error:', e);
    return null;
  }
}
