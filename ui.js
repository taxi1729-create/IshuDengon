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
  GameState.baseTopic = topic;
  GameState.category  = category;
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
    if (i < GameState.currentPlayerIndex)      dot.classList.add('done');
    else if (i === GameState.currentPlayerIndex) dot.classList.add('current');
    container.appendChild(dot);
  }
  document.getElementById('playerBadge').textContent = `${GameState.currentPlayer}人目`;
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
      renderActionSelect(container, getPrevRecord());
    }
  });
}

function getPrevRecord() {
  return GameState.roundData[GameState.roundData.length - 1] || null;
}

// ===== お題表示（1人目のみ） =====
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
// ※ 6番の修正：前の人の「お題文面」（topicAtTime）は表示しない
//               追加された修飾語（新しく加わった1語）のみ表示する
// ※ 3番の修正：flashdraw の絵はアクション選択画面では表示しない
function buildPrevContentHtml(prevRecord) {
  if (!prevRecord) return '';
  const { actionType, actionData } = prevRecord;

  // flashdraw はアクション選択画面に絵を出さない（「5秒消え絵でした」とだけ伝える）
  let inner = '';
  if (actionType === 'ai') {
    inner = `<p class="ai-text">${actionData.text}</p>`;
  } else if (actionType === 'drawing') {
    // お邪魔虫付き（固定座標）
    inner = typeof buildBugImageHtml === 'function'
      ? buildBugImageHtml(actionData.imageData, actionData.bugPositions)
      : `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の絵">`;
  } else if (actionType === 'shapes') {
    inner = `<img src="${actionData.imageData}" class="result-drawing" alt="前の人の図形">`;
  } else if (actionType === 'flashdraw') {
    // ★ 絵は見せない
    inner = `<div class="flash-hidden-notice">⚡ 5秒消え絵でした<br><span style="font-size:0.8rem;">絵の内容は一瞬しか見えませんでした</span></div>`;
  } else if (actionType === 'gesture') {
    inner = `<div style="text-align:center;padding:12px;font-size:1.8rem;">🙌<br><span style="font-size:0.85rem;">ジェスチャーで伝えます</span></div>`;
  } else if (actionType === 'halftalk') {
    inner = `<div style="text-align:center;padding:12px;font-size:1.8rem;">🎤<br><span style="font-size:0.85rem;">1秒しゃべります</span></div>`;
  } else if (actionType === 'verbal') {
    inner = `<p style="font-weight:700;">縛り：${actionData.constraint}<br><span style="font-size:0.8rem;color:#555;">${actionData.constraintDesc}</span></p>`;
  }

  // ★ 6番：お題文面は出さない。追加された修飾語（currentModifiers[0]）だけ見せる
  const newModifier = GameState.currentModifiers.length > 0
    ? GameState.currentModifiers[0]   // 一番最近追加された修飾語（unshiftしているので先頭）
    : null;

  const modifierHtml = newModifier
    ? `<div class="new-modifier-chip">今回追加された修飾語：<strong>「${newModifier}」</strong></div>`
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
// 前の人のヒントと「追加された修飾語」を表示（お題全体は非表示）
function renderActionSelect(container, prevRecord) {
  const usedActions   = GameState.roundData.map(r => r.actionType);
  const isSecondToLast = GameState.currentPlayerIndex === GameState.playerCount - 2;

  // ★ 6番：アクション選択でも「あなたが伝えるお題全体」は表示しない
  //         追加された修飾語だけを示すヒントは buildPrevContentHtml 内で表示済み
  const prevHtml = prevRecord ? buildPrevContentHtml(prevRecord) : '';

  // 今回追加された修飾語（1人目は表示なし）
  const newMod = GameState.currentModifiers.length > 0 ? GameState.currentModifiers[0] : null;

  const actions = [
    { id: 'ai',        icon: '🤖', name: 'AI変換',         desc: '自分の解釈をAIが言い換え' },
    { id: 'drawing',   icon: '🎨', name: '絵を描く',        desc: '手描き（お邪魔虫あり）' },
    { id: 'flashdraw', icon: '⚡', name: '5秒消え絵',       desc: '5秒で左から消える手描き' },
    { id: 'halftalk',  icon: '🎤', name: '1秒しゃべる',     desc: '3秒後に1秒だけ声で伝える' },
    { id: 'gesture',   icon: '🙌', name: 'ジェスチャー',    desc: '身振り手振りで伝える' },
    { id: 'shapes',    icon: '🔷', name: '抽象図形',        desc: '図形を配置・色付け' },
    { id: 'verbal',    icon: '💬', name: '口頭（縛り付き）', desc: '縛りあり・最後から2人目のみ' },
  ];

  container.innerHTML = `
    <div class="action-container">
      ${prevHtml}
      ${newMod ? `
        <div class="current-topic-display">
          <span class="current-topic-label">あなたに追加された修飾語</span>
          <span class="current-topic-value">${newMod}</span>
        </div>
      ` : ''}
      <p class="action-select-title">アクションを選んでください</p>
      <div class="action-grid">
        ${actions.map(a => {
          const isLocked = (a.id === 'verbal' && !isSecondToLast) || usedActions.includes(a.id);
          const lockReason = a.id === 'verbal' && !isSecondToLast
            ? '最後から2人目のみ'
            : usedActions.includes(a.id) ? '使用済み' : null;
          return `
            <div class="action-card ${isLocked ? 'locked' : ''}" data-action="${a.id}">
              <div class="action-icon">${a.icon}</div>
              <div class="action-name">${a.name}</div>
              <div class="action-desc">${a.desc}</div>
              ${lockReason ? `<div class="action-badge">${lockReason}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.action-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      SoundManager.playClick();
      vibrate([20]);
      renderActionExecute(container, card.dataset.action, prevRecord);
    });
  });
}

// ===== アクション実行 =====
function renderActionExecute(container, actionId, prevRecord) {
  // ★ 各アクションには「累積お題」を渡す（アクション実行画面では伝えるお題を確認できる）
  const topic   = GameState.currentTopic;
  const prevData = prevRecord ? prevRecord.actionData : null;

  const reselect = () => { SoundManager.playClick(); renderActionSelect(container, prevRecord); };
  const complete = (data) => onActionComplete(actionId, data);

  switch (actionId) {
    case 'ai':
      renderAiTransformAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'drawing':
      renderDrawingAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'flashdraw':
      renderFlashDrawAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'halftalk':
      renderHalfTalkAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'gesture':
      renderGestureAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'shapes':
      renderShapesAction(container, topic, prevRecord, complete, reselect);
      break;
    case 'verbal':
      renderVerbalAction(container, prevData, complete, reselect);
      break;
  }
}

// ===== ジェスチャーアクション =====
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
  document.getElementById('gestureDoneBtn').onclick  = () => onComplete({ note: 'ジェスチャー' });
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

// ===== 最後の人の画面（文字入力 → Gemini判定） =====
function renderLastPlayerScreen(container) {
  const prevRecord = getPrevRecord();
  const prevHtml   = prevRecord ? buildPrevContentHtml(prevRecord) : '';
  // ★ 7番修正：判定に使うお題は nextPlayer() で修飾語が追加される前の状態
  //   renderLastPlayerScreen は isLastPlayer が true の時点で呼ばれる。
  //   この時点の GameState.currentTopic が正解お題（修飾語追加済み最終形）
  const correctTopic = GameState.currentTopic;
  const baseTopic    = GameState.baseTopic;
      //${prevHtml}
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
    const answer   = document.getElementById('answerInput').value.trim();
    if (!answer) return;

    const judgeBtn = document.getElementById('judgeBtn');
    judgeBtn.disabled = true;
    judgeBtn.textContent = '判定中…';

    const resultDiv = document.getElementById('judgeResult');
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
        const lines = result.split('\n').filter(l => l.trim());
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
          <button class="btn ${isCorrect ? 'btn-success' : 'btn-danger'}" id="goResultBtn">
            リザルトへ ▶
          </button>
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
    if (isCorrect) { SoundManager.playCorrect(); vibrate([50, 30, 50, 30, 100]); }
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
    `${GameState.currentTopic}<br><span style="font-size:0.75rem;color:#666;">（元のお題：${GameState.baseTopic} ／ カテゴリ：${GameState.category}）</span>`;

  if (isCorrect) showConfetti();

  const actionLabels = {
    ai: '🤖 AI変換', drawing: '🎨 絵を描く', flashdraw: '⚡ 5秒消え絵',
    halftalk: '🎤 1秒しゃべる', gesture: '🙌 ジェスチャー',
    shapes: '🔷 抽象図形', verbal: '💬 口頭（縛り付き）'
  };

  // ★ 4番修正：flashdraw のリザルトは5秒ワイプ→再出現。他のアクションは通常表示。
  document.getElementById('actionHistory').innerHTML = GameState.roundData.map((record, i) => {
    const { actionType, actionData, topicAtTime } = record;
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
      // ★ 4番：ユニークIDを付けて後でwipe処理
      const uid = `flash_result_${i}`;
      contentHtml = `
        <div class="flash-result-wrap" id="wrap_${uid}">
          <img id="${uid}" src="${actionData.imageData}"
            class="result-drawing flash-wipe-img" alt="消え絵">
          <div id="timer_${uid}" class="flash-timer-overlay">5</div>
        </div>
        <button class="btn btn-secondary flash-replay-btn" id="replay_${uid}"
          style="display:none;font-size:0.8rem;padding:8px;" data-img="${actionData.imageData}" data-uid="${uid}">
          🔄 もう一度見る
        </button>
      `;
    } else if (actionType === 'gesture') {
      contentHtml = `<p>🙌 ジェスチャーで伝えました</p>`;
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

  // ★ 4番：flashdraw のリザルト画像に対してワイプ処理を実行
  GameState.roundData.forEach((record, i) => {
    if (record.actionType !== 'flashdraw') return;
    const uid      = `flash_result_${i}`;
    const imgEl    = document.getElementById(uid);
    const timerEl  = document.getElementById(`timer_${uid}`);
    const replayBtn = document.getElementById(`replay_${uid}`);
    if (!imgEl) return;

    // 5秒ワイプアウト
    startFlashWipeOnElement(imgEl, 5, () => {
      // 消えた後にタイマー非表示・再生ボタン表示
      if (timerEl)   timerEl.style.display  = 'none';
      if (replayBtn) replayBtn.style.display = 'block';

      // ★ 5秒後に再出現
      setTimeout(() => {
        if (imgEl) {
          imgEl.style.transition = 'clip-path 0.8s ease';
          imgEl.style.clipPath   = 'inset(0 0% 0 0)';
        }
        if (replayBtn) replayBtn.style.display = 'none';
        // また5秒後に消える（繰り返し）
        setTimeout(() => {
          startFlashWipeOnElement(imgEl, 5, () => {
            if (replayBtn) replayBtn.style.display = 'block';
          });
        }, 1000);
      }, 5000);
    });

    // タイマー表示を1秒ごとに更新
    let rem = 5;
    const tick = setInterval(() => {
      rem--;
      if (timerEl) timerEl.textContent = rem > 0 ? rem : '';
      if (rem <= 0) clearInterval(tick);
    }, 1000);

    // 再生ボタン押下で手動再生
    if (replayBtn) {
      replayBtn.onclick = () => {
        replayBtn.style.display = 'none';
        imgEl.style.transition  = 'clip-path 0.5s ease';
        imgEl.style.clipPath    = 'inset(0 0% 0 0)';
        if (timerEl) { timerEl.style.display = 'block'; timerEl.textContent = 5; }
        setTimeout(() => {
          startFlashWipeOnElement(imgEl, 5, () => {
            if (timerEl)   timerEl.style.display  = 'none';
            if (replayBtn) replayBtn.style.display = 'block';
          });
          let r2 = 5;
          const t2 = setInterval(() => {
            r2--;
            if (timerEl) timerEl.textContent = r2 > 0 ? r2 : '';
            if (r2 <= 0) clearInterval(t2);
          }, 1000);
        }, 600);
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
