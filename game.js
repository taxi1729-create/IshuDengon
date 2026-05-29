// game.js - ゲームロジック・状態管理

const GameState = {
  // 設定
  playerCount: 3,
  difficulty: 'normal',
  volume: 0.7,
  geminiApiKey: '',

  // ゲーム中の状態
  baseTopic: '',
  category: '',
  currentModifiers: [],      // 累積修飾語（文字列）
  modifierCategories: [],    // 各修飾語のカテゴリキー（表示用）
  modifierOrder: [],         // このゲームの修飾語追加順序（generateModifierOrderで生成）
  currentPlayerIndex: 0,
  roundData: [],
  isCorrect: null,
  usedModifiers: [],

  reset() {
    this.baseTopic = '';
    this.category = '';
    this.currentModifiers = [];
    this.modifierCategories = [];
    this.modifierOrder = [];
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

  get currentPlayer() { return this.currentPlayerIndex + 1; },
  get isLastPlayer()  { return this.currentPlayerIndex === this.playerCount - 1; },
  get isFirstPlayer() { return this.currentPlayerIndex === 0; },

  // 次のプレイヤーへ進む
  // 修飾語は「次の人が最後の人でない場合」のみ追加
  nextPlayer() {
    const nextIdx    = this.currentPlayerIndex + 1;
    const nextIsLast = nextIdx === this.playerCount - 1;

    if (!nextIsLast) {
      // 修飾語フェーズのインデックス = すでに追加された数
      const phaseIdx  = this.currentModifiers.length;
      const catKey    = this.modifierOrder[phaseIdx] || 'outer'; // 順序を使い切ったら外見
      const newMod    = getModifierFromCategory(catKey, this.difficulty, this.usedModifiers);

      this.currentModifiers.unshift(newMod);   // 先頭に追加（最新修飾語が[0]になる）
      this.modifierCategories.unshift(catKey);
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
      // 今回追加された修飾語とそのカテゴリ
      newModifier:         this.currentModifiers[0]    || null,
      newModifierCategory: this.modifierCategories[0]  || null,
      timestamp: Date.now()
    });
  }
};

// ===== サウンド管理 =====
const SoundManager = {
  context: null, gainNode: null,

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.setVolume(GameState.volume);
    } catch(e) { console.warn('Web Audio API not supported'); }
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
      const eg  = this.context.createGain();
      osc.connect(eg); eg.connect(this.gainNode);
      osc.type = type; osc.frequency.value = freq;
      eg.gain.setValueAtTime(0.5, this.context.currentTime);
      eg.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      osc.start(this.context.currentTime);
      osc.stop(this.context.currentTime + duration);
    } catch(e) {}
  },

  playNext()      { this.playBeep(600,0.1); setTimeout(()=>this.playBeep(800,0.1),100); },
  playWrong()     { this.playBeep(300,0.2,'sawtooth'); setTimeout(()=>this.playBeep(200,0.3,'sawtooth'),150); },
  playCorrect()   { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.playBeep(f,0.15),i*100)); },
  playClick()     { this.playBeep(700,0.05); },
  playCountdown() { this.playBeep(880,0.08,'square'); },
  playBuzz()      { this.playBeep(200,0.4,'sawtooth'); setTimeout(()=>this.playBeep(150,0.4,'sawtooth'),100); }
};

function vibrate(pattern = [50]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ===== Gemini API =====
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
    if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message); }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch(e) {
    console.error('Gemini error:', e);
    return null;
  }
}
