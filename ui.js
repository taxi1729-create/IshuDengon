// ui.js - 画面遷移・UI制御

// ===== 画面管理 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ===== タイトル画面 =====
function initTitleScreen() {
  // 人数ボタン
  document.querySelectorAll('#playerCount .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#playerCount .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.playerCount = parseInt(btn.dataset.value);
      SoundManager.playClick();
    });
  });

  // 難易度ボタン
  document.querySelectorAll('#difficulty .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficulty .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.difficulty = btn.dataset.value;
      SoundManager.playClick();
    });
  });

  // 音量スライダー
  const volumeSlider = document.getElementById('volumeSlider');
  volumeSlider.addEventListener('input', () => {
    SoundManager.setVolume(parseFloat(volumeSlider.value));
  });

  // APIキー
  const apiKeyInput = document.getElementById('apiKeyInput');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', () => {
      GameState.apiKey = apiKeyInput.value.trim();
    });
  }

  // スタートボタン
  document.getElementById('startBtn').addEventListener('click', () => {
    SoundManager.init();
    SoundManager.playNext();
    vibrate([30]);
    startGame();
  });
}

// ===== ゲーム開始 =====
function startGame() {
  GameState.reset();
  GameState.currentTopic = getRandomTopic(GameState.difficulty);
  showScreen('gameScreen');
  renderPlayerTurn();
}

// ===== プレイヤーターン描画 =====
function renderPlayerTurn() {
  const idx = GameState.currentPlayerIndex;
  const content = document.getElementById('gameContent');

  updateProgressDots();

  if (GameState.isLastPlayer) {
    // 最後の人：前の人のコンテンツ確認 → 判定
    renderLastPlayerScreen(content);
  } else {
    // それ以外：プレイヤー確認 → アクション選択
    renderPlayerConfirm(content, idx);
  }
}

function updateProgressDots() {
  const container = document.getElementById('progressDots');
  container.innerHTML = '';
  for (let i = 0; i < GameState.playerCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (i < GameState.currentPlayerIndex) dot.classList.add('done');
    else if (i === GameState.currentPlayerIndex) dot.classList.add('current');
    container.appendChild(dot);
  }

  const badge = document.getElementById('playerBadge');
  badge.textContent = `${GameState.currentPlayer}人目`;
}

// ===== プレイヤー確認画面 =====
function renderPlayerConfirm(container, idx) {
  container.innerHTML = `
    <div class="player-confirm">
      <div class="confirm-icon">👤</div>
      <h2 class="confirm-title">${idx + 1}人目の方、<br>準備はいいですか？</h2>
      <div class="private-warning">📵 他の方は画面を見ないでください</div>
      <button class="btn btn-primary" id="confirmReadyBtn">準備OK ▶</button>
    </div>
  `;

  document.getElementById('confirmReadyBtn').addEventListener('click', () => {
    SoundManager.playClick();
    vibrate([20]);
    if (GameState.isFirstPlayer) {
      renderTopicReveal(container);
    } else {
      renderPreviousContent(container);
    }
  });
}

// ===== お題表示（1人目） =====
function renderTopicReveal(container) {
  container.innerHTML = `
    <div class="topic-reveal">
      <p class="topic-label">今回のお題</p>
      <div class="topic-text">${GameState.currentTopic}</div>
      <p class="action-desc">このお題を次の人に伝えてください。</p>
      <button class="btn btn-primary" id="topicOkBtn">アクションを選ぶ ▶</button>
    </div>
  `;
  document.getElementById('topicOkBtn').addEventListener('click', () => {
    SoundManager.playClick();
    renderActionSelect(container, null);
  });
}

// ===== 前の人のコンテンツ表示 =====
function renderPreviousContent(container) {
  const prevData = GameState.roundData[GameState.roundData.length - 1];
  if (!prevData) {
    renderActionSelect(container, null);
    return;
  }

  const { actionType, actionData } = prevData;
  let content = '';

  if (actionType === 'ai') {
    content = `
      <div class="ai-result-box">
        <p class="ai-text">${actionData.text}</p>
      </div>
      <p class="text-dim text-center">（前の人がAIに変換してもらったヒントです）</p>
    `;
  } else if (actionType === 'drawing') {
    content = `
      <img src="${actionData.imageData}" class="result-drawing" alt="前の人の絵">
      <p class="text-dim text-center">（前の人が描いた絵です）</p>
    `;
  } else if (actionType === 'shapes') {
    content = `
      <img src="${actionData.imageData}" class="result-drawing" alt="前の人の図形">
      <p class="text-dim text-center">（前の人が作った図形です）</p>
    `;
  } else if (actionType === 'gesture') {
    content = `
      <div class="gesture-stage">
        <div class="gesture-icon">🙌</div>
        <p>前の人がジェスチャーで伝えます。<br>よく見てください。</p>
      </div>
    `;
  } else if (actionType === 'verbal') {
    content = `
      <div class="constraint-badge" style="flex-direction:column;align-items:flex-start;">
        <div><span class="constraint-label">縛り</span> <span class="constraint-name">${actionData.constraint}</span></div>
        <p style="font-size:0.8rem;margin-top:4px;color:#1a1a2e;">${actionData.constraintDesc}</p>
      </div>
      <p class="text-dim text-center">前の人が口頭でお題を伝えます。</p>
    `;
  }

  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">前の人からのヒント</h2>
      ${content}
      <button class="btn btn-primary" id="prevOkBtn">確認した → アクションを選ぶ ▶</button>
    </div>
  `;

  document.getElementById('prevOkBtn').addEventListener('click', () => {
    SoundManager.playClick();
    renderActionSelect(container, prevData.actionData);
  });
}

// ===== アクション選択 =====
function renderActionSelect(container, previousData) {
  const isSecondToLast = GameState.isSecondToLast;

  const actions = [
    { id: 'ai',      icon: '🤖', name: 'AI変換',   desc: '尖った視点でAIが言い換え', locked: false },
    { id: 'drawing', icon: '🎨', name: '絵を描く', desc: '手描きで表現',              locked: false },
    { id: 'gesture', icon: '🙌', name: 'ジェスチャー', desc: '身振り手振りで伝える',  locked: false },
    { id: 'shapes',  icon: '🔷', name: '抽象図形', desc: '図形を配置・色付け',        locked: false },
    { id: 'verbal',  icon: '💬', name: '口頭（縛り付き）', desc: '言葉で伝える（縛りあり）',
      locked: !isSecondToLast, badge: isSecondToLast ? null : '最後から2人目のみ' }
  ];

  container.innerHTML = `
    <div class="action-container">
      <p class="action-select-title">どのアクションで伝えますか？</p>
      <div class="action-grid">
        ${actions.map(a => `
          <div class="action-card ${a.locked ? 'locked' : ''}" data-action="${a.id}">
            <div class="action-icon">${a.icon}</div>
            <div class="action-name">${a.name}</div>
            <div class="action-desc">${a.desc}</div>
            ${a.badge ? `<div class="action-badge">${a.badge}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.action-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      SoundManager.playClick();
      vibrate([20]);
      const actionId = card.dataset.action;
      renderActionExecute(container, actionId, previousData);
    });
  });
}

// ===== アクション実行 =====
function renderActionExecute(container, actionId, previousData) {
  const topic = GameState.currentTopic;

  switch (actionId) {
    case 'ai':
      renderAiTransformAction(container, topic, (data) => {
        onActionComplete('ai', data);
      });
      break;

    case 'drawing':
      renderDrawingAction(container, topic, (data) => {
        onActionComplete('drawing', data);
      });
      break;

    case 'gesture':
      container.innerHTML = `
        <div class="action-container">
          <h2 class="action-title">🙌 ジェスチャー</h2>
          <div class="gesture-stage">
            <div class="gesture-icon">🙌</div>
            <p>身振り手振りでお題を伝えてください。</p>
            <p class="text-dim">次の人に見せながらジェスチャーしてください。</p>
          </div>
          <button class="btn btn-primary" id="gestureDoneBtn">伝えた → 次の人へ ▶</button>
        </div>
      `;
      document.getElementById('gestureDoneBtn').addEventListener('click', () => {
        onActionComplete('gesture', { note: 'ジェスチャーで伝えました' });
      });
      break;

    case 'shapes':
      renderShapesAction(container, topic, (data) => {
        onActionComplete('shapes', data);
      });
      break;

    case 'verbal':
      renderVerbalAction(container, previousData, (data) => {
        onActionComplete('verbal', data);
      });
      break;
  }
}

// ===== アクション完了 =====
function onActionComplete(actionType, actionData) {
  GameState.recordAction(actionType, actionData);
  SoundManager.playNext();
  vibrate([30, 20, 30]);
  GameState.nextPlayer();
  renderPlayerTurn();
}

// ===== 最後の人の画面 =====
function renderLastPlayerScreen(container) {
  const prevData = GameState.roundData[GameState.roundData.length - 1];

  let prevContent = '';
  if (prevData) {
    const { actionType, actionData } = prevData;
    if (actionType === 'ai') {
      prevContent = `<div class="ai-result-box"><p class="ai-text">${actionData.text}</p></div>`;
    } else if (actionType === 'drawing') {
      prevContent = `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の絵">`;
    } else if (actionType === 'shapes') {
      prevContent = `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の図形">`;
    } else if (actionType === 'gesture') {
      prevContent = `<div class="gesture-stage"><div class="gesture-icon">🙌</div><p>前の人がジェスチャーで伝えます</p></div>`;
    } else if (actionType === 'verbal') {
      prevContent = `
        <div class="constraint-badge">
          <span class="constraint-label">縛り</span>
          <span class="constraint-name">${actionData.constraint}</span>
        </div>
        <p class="constraint-desc">${actionData.constraintDesc}</p>
      `;
    }
  }

  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">🎯 あなたが最後です！</h2>
      ${prevContent}
      <p class="text-dim text-center">お題が分かりましたか？<br>口頭で答えを言い、最初の人が判定してください。</p>
      <div class="judge-section">
        <p class="judge-title">— 最初の人が判定 —</p>
        <button class="btn btn-success" id="correctBtn">🎉 正解！</button>
        <button class="btn btn-danger" id="wrongBtn">😢 不正解…</button>
      </div>
    </div>
  `;

  document.getElementById('correctBtn').addEventListener('click', () => {
    GameState.isCorrect = true;
    SoundManager.playCorrect();
    vibrate([50, 30, 50, 30, 100]);
    showResultScreen();
  });

  document.getElementById('wrongBtn').addEventListener('click', () => {
    GameState.isCorrect = false;
    SoundManager.playWrong();
    vibrate([200]);
    showResultScreen();
  });
}

// ===== リザルト画面 =====
function showResultScreen() {
  showScreen('resultScreen');

  const isCorrect = GameState.isCorrect;
  const topic = GameState.currentTopic;

  document.getElementById('resultEmoji').textContent = isCorrect ? '🎉' : '😢';
  document.getElementById('resultTitle').textContent = isCorrect ? '正解！' : '不正解…';
  document.getElementById('resultTitle').className = 'result-title ' + (isCorrect ? 'correct' : 'wrong');
  document.getElementById('resultTopicText').textContent = topic;

  if (isCorrect) showConfetti();

  // アクション履歴
  const historyContainer = document.getElementById('actionHistory');
  historyContainer.innerHTML = GameState.roundData.map((record, i) => {
    const { actionType, actionData } = record;
    const actionLabels = {
      ai: '🤖 AI変換',
      drawing: '🎨 絵を描く',
      gesture: '🙌 ジェスチャー',
      shapes: '🔷 抽象図形',
      verbal: '💬 口頭（縛り付き）'
    };

    let contentHtml = '';
    if (actionType === 'ai') {
      contentHtml = `<p class="ai-text" style="font-size:0.9rem;">${actionData.text}</p>`;
    } else if (actionType === 'drawing' || actionType === 'shapes') {
      contentHtml = `<img src="${actionData.imageData}" class="result-drawing" alt="アクション内容">`;
    } else if (actionType === 'gesture') {
      contentHtml = `<p>ジェスチャーで伝えました 🙌</p>`;
    } else if (actionType === 'verbal') {
      contentHtml = `<p>縛り：<strong>${actionData.constraint}</strong><br><span class="text-dim">${actionData.constraintDesc}</span></p>`;
    }

    return `
      <div class="history-item">
        <div class="history-player">${i + 1}人目</div>
        <div class="history-action-type">${actionLabels[actionType] || actionType}</div>
        ${contentHtml}
      </div>
    `;
  }).join('');
}

// ===== 紙吹雪 =====
function showConfetti() {
  const colors = ['#ff6b35','#ffe66d','#4ecdc4','#ff6b6b','#a8e6cf'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.5}s;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      transform: rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4000);
}
