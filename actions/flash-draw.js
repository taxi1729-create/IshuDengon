// actions/flash-draw.js - 5秒消え絵アクション
// ・描画者には通常通り描かせる
// ・次の人が見る画面でのみ5秒間左からワイプアウト（clipPath）
// ・アクション選択画面には絵を表示しない（buildPrevContentHtmlで制御）
// ・リザルト画面でも同様のワイプ → 5秒後に再出現

function renderFlashDrawAction(container, topic, prevRecord, onComplete, onReselect) {
  const prevHtml = prevRecord
    ? (typeof buildPrevContentHtml === 'function' ? buildPrevContentHtml(prevRecord) : '')
    : '';

  container.innerHTML = `
    <div class="action-container drawing-action">
      <h2 class="action-title">⚡ 5秒消え絵</h2>
      ${prevHtml}
      <div class="current-topic-display">
        <span class="current-topic-label">伝えるお題</span>
        <span class="current-topic-value">${topic}</span>
      </div>
      <p class="action-desc-text">
        描いた絵は次の人が見た瞬間から<strong>5秒で左からワイプアウト</strong>します。<br>
        色・書き直し自由です。
      </p>

      <div class="drawing-toolbar">
        <div class="tool-group">
          <button class="tool-btn active" id="toolPen" title="ペン">✏️</button>
          <button class="tool-btn" id="toolEraser" title="消しゴム">🧹</button>
        </div>
        <div class="tool-group size-group">
          <button class="size-btn active" data-size="4">細</button>
          <button class="size-btn" data-size="10">中</button>
          <button class="size-btn" data-size="20">太</button>
        </div>
        <div class="tool-group">
          <input type="color" id="colorPicker" value="#222222" title="色">
        </div>
        <button class="tool-btn danger" id="clearBtn" title="全消去">🗑️</button>
      </div>

      <canvas id="drawCanvas" class="draw-canvas"></canvas>

      <button class="btn btn-primary" id="flashDoneBtn">完成！次の人へ渡す ▶</button>
      <button class="btn btn-reselect" id="flashReselectBtn">↩ アクションを選び直す</button>
    </div>
  `;

  initDrawCanvas('drawCanvas');

  document.getElementById('flashDoneBtn').onclick = () => {
    const canvas = document.getElementById('drawCanvas');
    const imageData = canvas.toDataURL('image/png');
    renderFlashDrawViewer(container, imageData, onComplete);
  };

  document.getElementById('flashReselectBtn').onclick = onReselect;
}

// ===== 次の人に見せる：5秒で左からワイプアウト =====
function renderFlashDrawViewer(container, imageData, onComplete) {
  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">⚡ 5秒で消えます！</h2>
      <p class="action-desc-text">今すぐ絵を見てください。左から消えていきます！</p>
      <div class="flash-img-wrap" id="flashWrap">
        <img id="flashImg" src="${imageData}" class="result-drawing flash-wipe-img" alt="前の人の絵">
        <div id="flashTimer" class="flash-timer-overlay">5</div>
      </div>
      <button class="btn btn-primary" id="flashNextBtn" style="display:none;">アクションを選ぶ ▶</button>
    </div>
  `;

  startFlashWipe('flashImg', 'flashTimer', 5, () => {
    const btn = document.getElementById('flashNextBtn');
    if (btn) btn.style.display = 'block';
  });

  document.getElementById('flashNextBtn').onclick = () => onComplete({ imageData });
}

// ===== 共通：左からワイプアウト関数 =====
// targetImgId: 対象の<img>要素ID
// timerElId:   カウンター要素ID（null可）
// seconds:     消えるまでの秒数
// onDone:      消え終わり後のコールバック
function startFlashWipe(targetImgId, timerElId, seconds, onDone) {
  const img     = document.getElementById(targetImgId);
  const timerEl = timerElId ? document.getElementById(timerElId) : null;
  if (!img) return;

  // clip-path で右端から左端へ削っていく
  // inset(0 100% 0 0) → inset(0 0 0 0) を逆にして左→右に消す
  // 「左から消える」= 右側が残り続け、左側が削られる
  // inset(top right bottom left)
  // left を 0→100% にすると左から削られる
  img.style.clipPath = 'inset(0 0% 0 0)';
  img.style.transition = `clip-path ${seconds}s linear`;

  // 1フレーム後にアニメーション開始
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      img.style.clipPath = 'inset(0 0% 0 100%)';
    });
  });

  // 1秒ごとにカウントダウン表示
  let remaining = seconds;
  const tick = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = remaining > 0 ? remaining : '';
    SoundManager && SoundManager.playCountdown && SoundManager.playCountdown();
    if (remaining <= 0) {
      clearInterval(tick);
      if (timerEl) timerEl.style.display = 'none';
      // 完全に消えた後にコールバック
      setTimeout(() => onDone && onDone(), 200);
    }
  }, 1000);

  return tick; // 必要なら外でclearInterval可能
}

// ===== リザルト画面用：消え絵を再生するヘルパー =====
// imgEl: すでにDOMにある<img>要素
// onDone: 消え終わり後コールバック（再出現処理など）
function startFlashWipeOnElement(imgEl, seconds, onDone) {
  if (!imgEl) return;

  imgEl.style.clipPath = 'inset(0 0% 0 0)';
  imgEl.style.transition = `clip-path ${seconds}s linear`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      imgEl.style.clipPath = 'inset(0 0% 0 100%)';
    });
  });

  setTimeout(() => {
    onDone && onDone();
  }, seconds * 1000 + 200);
}
