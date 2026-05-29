// ui.js - 画面遷移・UI制御

// ===== 画面管理 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) { screen.classList.add('active'); window.scrollTo(0, 0); }
}

// ===== タイトル画面初期化 =====
function initTitleScreen() {
  document.querySelectorAll('#playerCount .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#playerCount .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.playerCount = parseInt(btn.dataset.value);
      SoundManager.playClick();
    });
  });

  document.querySelectorAll('#difficulty .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#difficulty .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      GameState.difficulty = btn.dataset.value;
      SoundManager.playClick();
    });
  });

  const volumeSlider = document.getElementById('volumeSlider');
  volumeSlider.addEventListener('input', () => {
    SoundManager.setVolume(parseFloat(volumeSlider.value));
  });

  const geminiKeyInput = document.getElementById('geminiKeyInput');
  if (geminiKeyInput) {
    geminiKeyInput.addEventListener('input', () => {
      GameState.geminiApiKey = geminiKeyInput.value.trim();
    });
  }

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
  const { topic, category } = getRandomTopicWithCategory();
  GameState.baseTopic    = topic;
  GameState.category     = category;
  GameState.modifierOrder = generateModifierOrder(); // 修飾語追加順序を生成
  showScreen('gameScreen');
  renderPlayerTurn();
}

// ===== プレイヤーターン描画 =====
function renderPlayerTurn() {
  const content = document.getElementById('gameContent');
  updateProgressDots();
  if (GameState.isLastPlayer) {
    renderLastPlayerScreen(content);
  } else {
    renderPlayerConfirm(content, GameState.currentPlayerIndex);
  }
}

function updateProgressDots() {
  const container = document.getElementById('progressDots');
  container.innerHTML = '';
  for (let i = 0; i < GameState.playerCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (i < GameState.currentPlayerIndex)        dot.classList.add('done');
    else if (i === GameState.currentPlayerIndex)  dot.classList.add('current');
    container.appendChild(dot);
  }
  document.getElementById('playerBadge').textContent = `${GameState.currentPlayer}人目`;
}

// ===== プレイヤー確認 =====
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
    SoundManager.playClick(); vibrate([20]);
    if (GameState.isFirstPlayer) renderTopicReveal(container);
    else                          renderActionSelect(container, getPrevRecord());
  });
}

function getPrevRecord() {
  return GameState.roundData[GameState.roundData.length - 1] || null;
}

// ===== お題表示（1人目） =====
function renderTopicReveal(container) {
  container.innerHTML = `
    <div class="topic-reveal">
      <div class="category-badge">📂 ${GameState.category}</div>
      <p class="topic-label">最初のお題</p>
      <div class="topic-text">${GameState.baseTopic}</div>
      <p class="action-desc-text">このお題を次の人に伝えてください。</p>
      <button class="btn btn-primary" id="topicOkBtn">アクションを選ぶ ▶</button>
    </div>
  `;
  document.getElementById('topicOkBtn').addEventListener('click', () => {
    SoundManager.playClick();
    renderActionSelect(container, null);
  });
}

// ===== 前のアクション内容HTML生成 =====
// ・前の人のお題文面は非表示
// ・今回追加された修飾語（カテゴリラベル付き）のみ表示
// ・flashdraw はアクション選択画面で絵を非表示
function buildPrevContentHtml(prevRecord) {
  if (!prevRecord) return '';
  const { actionType, actionData } = prevRecord;

  let inner = '';
  if (actionType === 'ai') {
    inner = `<p class="ai-text">${actionData.text}</p>`;
  } else if (actionType === 'drawing') {
    inner = typeof buildBugImageHtml === 'function'
      ? buildBugImageHtml(actionData.imageData, actionData.bugPositions)
      : `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の絵">`;
  } else if (actionType === 'shapes') {
    inner = `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の図形">`;
  } else if (actionType === 'flashdraw') {
    inner = `<div class="flash-hidden-notice">⚡ 5秒消え絵でした<br><span style="font-size:0.8rem;">絵は一瞬しか見えませんでした</span></div>`;
  } else if (actionType === 'gesture') {
    inner = `<div style="text-align:center;padding:12px;font-size:1.8rem;">🙌<br><span style="font-size:0.85rem;">ジェスチャーで伝えます</span></div>`;
  } else if (actionType === 'gesturehint') {
    inner = `<div style="text-align:center;padding:12px;font-size:1.8rem;">🙌✍️<br><span style="font-size:0.85rem;">ジェスチャー＋ヒント「${actionData.hintText || ''}」で伝えます</span></div>`;
  } else if (actionType === 'halftalk') {
    inner = `<div style="text-align:center;padding:12px;font-size:1.8rem;">🎤<br><span style="font-size:0.85rem;">1秒しゃべります</span></div>`;
  } else if (actionType === 'verbal') {
    inner = `<p style="font-weight:700;">縛り：${actionData.constraint}<br><span style="font-size:0.8rem;color:#555;">${actionData.constraintDesc}</span></p>`;
  }

  // 今回追加された修飾語＋カテゴリラベル
  const newModifier  = GameState.currentModifiers.length > 0 ? GameState.currentModifiers[0] : null;
  const newCatKey    = GameState.modifierCategories.length > 0 ? GameState.modifierCategories[0] : null;
  const catLabel     = newCatKey ? getModifierCategoryLabel(newCatKey) : null;

  const modifierHtml = newModifier
    ? `<div class="new-modifier-chip">
         <span class="modifier-cat-badge">${catLabel || '修飾語'}</span>
         今回追加：<strong>「${newModifier}」</strong>
       </div>`
    : '';

  return `
    <div class="prev-hint-box">
      <div class="prev-hint-label">前の人からのヒント</div>
      ${modifierHtml}
      <div class="prev-hint-content">${inner}</div>
    </div>
  `;
}

// ===== アクション選択画面 =====
function renderActionSelect(container, prevRecord) {
  const usedActions    = GameState.roundData.map(r => r.actionType);
  const isSecondToLast = GameState.currentPlayerIndex === GameState.playerCount - 2;
  const prevHtml       = prevRecord ? buildPrevContentHtml(prevRecord) : '';
  const newMod         = GameState.currentModifiers.length > 0 ? GameState.currentModifiers[0] : null;
  const newCatKey      = GameState.modifierCategories.length > 0 ? GameState.modifierCategories[0] : null;
  const catLabel       = newCatKey ? getModifierCategoryLabel(newCatKey) : '修飾語';

  const actions = [
    { id: 'ai',          icon: '🤖', name: 'AI変換',            desc: '自分の解釈をAIが言い換え' },
    { id: 'drawing',     icon: '🎨', name: '絵を描く',           desc: '手描き（お邪魔虫あり）' },
    { id: 'flashdraw',   icon: '⚡', name: '5秒消え絵',          desc: '準備完了後5秒で左から消える' },
    { id: 'halftalk',    icon: '🎤', name: '1秒しゃべる',        desc: '3秒カウント後1秒だけ声で' },
    { id: 'gesture',     icon: '🙌', name: 'ジェスチャー',       desc: '身振り手振りで伝える' },
    { id: 'gesturehint', icon: '🙌✍️', name: 'ジェスチャー＋ヒント', desc: '修飾語の先頭2文字も見せる' },
    { id: 'shapes',      icon: '🔷', name: '抽象図形',           desc: '図形を配置・色付け' },
    { id: 'verbal',      icon: '💬', name: '口頭（縛り付き）',   desc: '縛りあり・最後から2人目のみ',
      locked: !isSecondToLast, lockReason: !isSecondToLast ? '最後から2人目のみ' : null },
  ];

  container.innerHTML = `
    <div class="action-container">
      ${prevHtml}
      ${newMod ? `
        <div class="current-topic-display">
          <span class="current-topic-label">追加された修飾語（${catLabel}）</span>
          <span class="current-topic-value">${newMod}</span>
        </div>
      ` : ''}
      <p class="action-select-title">アクションを選んでください</p>
      <div class="action-grid">
        ${actions.map(a => {
          const locked = a.locked || usedActions.includes(a.id);
          const reason = a.locked ? a.lockReason : (usedActions.includes(a.id) ? '使用済み' : null);
          return `
            <div class="action-card ${locked ? 'locked' : ''}" data-action="${a.id}">
              <div class="action-icon">${a.icon}</div>
              <div class="action-name">${a.name}</div>
              <div class="action-desc">${a.desc}</div>
              ${reason ? `<div class="action-badge">${reason}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.action-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      SoundManager.playClick(); vibrate([20]);
      renderActionExecute(container, card.dataset.action, prevRecord);
    });
  });
}

// ===== アクション実行 =====
function renderActionExecute(container, actionId, prevRecord) {
  const topic       = newCatKey ? getModifierCategoryLabel(newCatKey) : GameState.currentTopic;

  //const topic    = GameState.currentTopic;
  const reselect = () => { SoundManager.playClick(); renderActionSelect(container, prevRecord); };
  const complete = (data) => onActionComplete(actionId, data);

  switch (actionId) {
    case 'ai':          renderAiTransformAction(container, topic, prevRecord, complete, reselect); break;
    case 'drawing':     renderDrawingAction(container, topic, prevRecord, complete, reselect);     break;
    case 'flashdraw':   renderFlashDrawAction(container, topic, prevRecord, complete, reselect);   break;
    case 'halftalk':    renderHalfTalkAction(container, topic, prevRecord, complete, reselect);    break;
    case 'gesture':     renderGestureAction(container, topic, prevRecord, complete, reselect);     break;
    case 'gesturehint': renderGestureHintAction(container, topic, prevRecord, complete, reselect); break;
    case 'shapes':      renderShapesAction(container, topic, prevRecord, complete, reselect);      break;
    case 'verbal':      renderVerbalAction(container, prevRecord ? prevRecord.actionData : null, complete, reselect); break;
  }
}

// ===== ジェスチャー =====
function renderGestureAction(container, topic, prevRecord, onComplete, onReselect) {
  const prevHtml = prevRecord ? buildPrevContentHtml(prevRecord) : '';
  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">🙌 ジェスチャー</h2>
      ${prevHtml}
      <div class="current-topic-display">
        <span class="current-topic-label">伝えるお題（累積）</span>
        <span class="current-topic-value">${topic}</span>
      </div>
      <div class="gesture-stage">
        <div class="gesture-icon">🙌</div>
        <p>身振り手振りでお題を伝えてください。</p>
        <p class="text-dim">次の人に見せながらジェスチャーしてください。</p>
      </div>
      <button class="btn btn-primary" id="gestureDoneBtn">伝えた → 次の人へ ▶</button>
      <button class="btn btn-reselect" id="gestureReselectBtn">↩ アクションを選び直す</button>
    </div>
  `;
  document.getElementById('gestureDoneBtn').onclick   = () => onComplete({ note: 'ジェスチャー' });
  document.getElementById('gestureReselectBtn').onclick = onReselect;
}

// ===== アクション完了 =====
function onActionComplete(actionType, actionData) {
  GameState.recordAction(actionType, actionData);
  SoundManager.playNext();
  vibrate([30, 20, 30]);
  GameState.nextPlayer();
  renderPlayerTurn();
}

// ===== 最後の人（文字入力 → Gemini判定） =====
function renderLastPlayerScreen(container) {
  const prevRecord   = getPrevRecord();
  const prevHtml     = prevRecord ? buildPrevContentHtml(prevRecord) : '';
  const correctTopic = GameState.currentTopic;
  const baseTopic    = GameState.baseTopic;

  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">🎯 あなたが最後！</h2>

      <p class="action-desc-text">ヒントを見て答えを入力してください。<br>修飾語も含めて答えてみましょう！</p>
      <div class="answer-input-box">
        <input type="text" id="answerInput" class="answer-input"
          placeholder="例：翼が生えたりんご" autocomplete="off">
        <button class="btn btn-primary" id="judgeBtn">判定する ▶</button>
      </div>
      <div id="judgeResult" style="display:none;"></div>
    </div>
  `;

  document.getElementById('judgeBtn').onclick = async () => {
    const answer  = document.getElementById('answerInput').value.trim();
    if (!answer) return;

    const judgeBtn  = document.getElementById('judgeBtn');
    const resultDiv = document.getElementById('judgeResult');
    judgeBtn.disabled = true;
    judgeBtn.textContent = '判定中…';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `<div class="loading-box"><div class="loading-spinner"></div><p>AIが判定しています…</p></div>`;

    let isCorrect = false;
    const geminiKey = GameState.geminiApiKey || CONFIG.GEMINI_API_KEY;

    if (geminiKey) {
      const prompt = `
以下のゲームの答え合わせをしてください。

【正解のお題】：「${correctTopic}」
（ベースの名詞：「${baseTopic}」に修飾語が累積したものです。）

【プレイヤーの回答】：「${answer}」

判定ルール：
- 「${baseTopic}」という名詞が含まれていること（必須）
- 修飾語は完全一致でなくてよい。ニュアンスや意図が概ね伝わっていれば正解
- 修飾語の順番は問わない
- 修飾語が一部抜けていても、大半が伝わっていれば正解とする
- 「正解」または「不正解」のみ最初の行に書き、次の行に一言理由を添えること

回答形式（必ずこの形式で）：
正解
理由：（一文）
または
不正解
理由：（一文）
      `.trim();

      const result = await callGemini(prompt);
      if (result) {
        isCorrect = result.trimStart().startsWith('正解');
        const lines      = result.split('\n').filter(l => l.trim());
        const reasonLine = lines.find(l => l.startsWith('理由')) || lines[1] || '';
        resultDiv.innerHTML = `
          <div class="judge-result-box ${isCorrect ? 'correct' : 'wrong'}">
            <div class="judge-result-title">${isCorrect ? '🎉 正解！' : '😢 不正解…'}</div>
            <p class="judge-result-reason">${reasonLine.replace(/^理由[：:]\s*/, '')}</p>
          </div>
          <div class="correct-answer-reveal">
            <span class="correct-label">正解のお題</span>
            <span class="correct-value">${correctTopic}</span>
          </div>
          <button class="btn ${isCorrect ? 'btn-success' : 'btn-danger'}" id="goResultBtn">リザルトへ ▶</button>
        `;
      } else {
        isCorrect = answer.includes(baseTopic);
        resultDiv.innerHTML = buildSimpleJudgeHtml(isCorrect, correctTopic);
      }
    } else {
      isCorrect = answer.includes(baseTopic);
      resultDiv.innerHTML = buildSimpleJudgeHtml(isCorrect, correctTopic);
    }

    GameState.isCorrect = isCorrect;
    if (isCorrect) { SoundManager.playCorrect(); vibrate([50,30,50,30,100]); }
    else           { SoundManager.playWrong();   vibrate([200]); }

    const goBtn = document.getElementById('goResultBtn');
    if (goBtn) goBtn.onclick = () => showResultScreen();
  };
}

function buildSimpleJudgeHtml(isCorrect, correctTopic) {
  return `
    <div class="judge-result-box ${isCorrect ? 'correct' : 'wrong'}">
      <div class="judge-result-title">${isCorrect ? '🎉 正解！' : '😢 不正解…'}</div>
    </div>
    <div class="correct-answer-reveal">
      <span class="correct-label">正解のお題</span>
      <span class="correct-value">${correctTopic}</span>
    </div>
    <button class="btn ${isCorrect ? 'btn-success' : 'btn-danger'}" id="goResultBtn">リザルトへ ▶</button>
  `;
}

// ===== リザルト画面 =====
function showResultScreen() {
  showScreen('resultScreen');
  const isCorrect = GameState.isCorrect;

  document.getElementById('resultEmoji').textContent = isCorrect ? '🎉' : '😢';
  document.getElementById('resultTitle').textContent  = isCorrect ? '正解！' : '不正解…';
  document.getElementById('resultTitle').className    = 'result-title ' + (isCorrect ? 'correct' : 'wrong');
  document.getElementById('resultTopicText').innerHTML =
    `${GameState.currentTopic}<br>
     <span style="font-size:0.75rem;color:#666;">元のお題：${GameState.baseTopic} ／ カテゴリ：${GameState.category}</span>`;

  if (isCorrect) showConfetti();

  const actionLabels = {
    ai: '🤖 AI変換', drawing: '🎨 絵を描く', flashdraw: '⚡ 5秒消え絵',
    halftalk: '🎤 1秒しゃべる', gesture: '🙌 ジェスチャー',
    gesturehint: '🙌✍️ ジェスチャー＋ヒント',
    shapes: '🔷 抽象図形', verbal: '💬 口頭（縛り付き）'
  };

  document.getElementById('actionHistory').innerHTML = GameState.roundData.map((record, i) => {
    const { actionType, actionData } = record;
    let contentHtml = '';

    if (actionType === 'ai') {
      contentHtml = `<p class="ai-text" style="font-size:0.85rem;">${actionData.text}</p>`;
    } else if (actionType === 'drawing') {
      contentHtml = typeof buildBugImageHtml === 'function'
        ? buildBugImageHtml(actionData.imageData, actionData.bugPositions)
        : `<img src="${actionData.imageData}" class="result-drawing" alt="絵">`;
    } else if (actionType === 'shapes') {
      contentHtml = `<img src="${actionData.imageData}" class="result-drawing" alt="図形">`;
    } else if (actionType === 'flashdraw') {
      const uid = `flash_result_${i}`;
      contentHtml = `
        <div class="flash-result-wrap" id="wrap_${uid}">
          <img id="${uid}" src="${actionData.imageData}" class="result-drawing flash-wipe-img" alt="消え絵">
          <div id="timer_${uid}" class="flash-timer-overlay">5</div>
        </div>
        <button class="btn btn-secondary flash-replay-btn" id="replay_${uid}" style="display:none;font-size:0.8rem;padding:8px;">
          🔄 もう一度見る
        </button>
      `;
    } else if (actionType === 'gesture') {
      contentHtml = `<p>🙌 ジェスチャーで伝えました</p>`;
    } else if (actionType === 'gesturehint') {
      contentHtml = `<p>🙌✍️ ジェスチャー＋ヒント「<strong>${actionData.hintText}</strong>」で伝えました</p>`;
    } else if (actionType === 'halftalk') {
      contentHtml = `<p>🎤 1秒しゃべりました</p>`;
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

  // flashdraw リザルト処理（ワイプ→5秒後再出現ループ）
  GameState.roundData.forEach((record, i) => {
    if (record.actionType !== 'flashdraw') return;
    const uid      = `flash_result_${i}`;
    const imgEl    = document.getElementById(uid);
    const timerEl  = document.getElementById(`timer_${uid}`);
    const replayBtn = document.getElementById(`replay_${uid}`);
    if (!imgEl) return;

    function runWipe() {
      startFlashWipeOnElement(imgEl, 5, () => {
        if (timerEl)    timerEl.style.display  = 'none';
        if (replayBtn)  replayBtn.style.display = 'block';
        // 5秒後に再出現→またワイプ
        setTimeout(() => {
          imgEl.style.transition = 'clip-path 0.8s ease';
          imgEl.style.clipPath   = 'inset(0 0% 0 0)';
          if (replayBtn) replayBtn.style.display = 'none';
          if (timerEl)   { timerEl.style.display = 'block'; timerEl.textContent = 5; }
          setTimeout(() => runWipe(), 1000);
        }, 5000);
      });
      let rem = 5;
      const tick = setInterval(() => {
        rem--;
        if (timerEl) timerEl.textContent = rem > 0 ? rem : '';
        if (rem <= 0) clearInterval(tick);
      }, 1000);
    }
    runWipe();

    if (replayBtn) {
      replayBtn.onclick = () => {
        replayBtn.style.display = 'none';
        imgEl.style.transition  = 'clip-path 0.5s ease';
        imgEl.style.clipPath    = 'inset(0 0% 0 0)';
        if (timerEl) { timerEl.style.display = 'block'; timerEl.textContent = 5; }
        setTimeout(() => runWipe(), 600);
      };
    }
  });
}

// ===== 紙吹雪 =====
function showConfetti() {
  const colors = ['#f0d000','#ff2d55','#0a0a0a','#ffffff','#34c759'];
  const cont = document.createElement('div');
  cont.className = 'confetti-container';
  document.body.appendChild(cont);
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${1.5+Math.random()*2}s;
      animation-delay:${Math.random()*0.5}s;
      width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
      transform:rotate(${Math.random()*360}deg);
    `;
    cont.appendChild(p);
  }
  setTimeout(() => cont.remove(), 4000);
}
