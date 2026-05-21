// actions/flash-draw.js - 5秒消え絵アクション

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
      <p class="action-desc-text">描いた絵は次の人が見た瞬間から5秒でフェードアウトします。<br>色・書き直し自由。動画は最大5秒です。</p>

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
    renderFlashDrawResult(container, imageData, onComplete);
  };

  document.getElementById('flashReselectBtn').onclick = onReselect;
}

// ===== 次の人に見せる：5秒で消えるビュー =====
function renderFlashDrawResult(container, imageData, onComplete) {
  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">⚡ 5秒で消えます！</h2>
      <p class="action-desc-text">今すぐ絵を見てください。5秒後に消えます！</p>
      <div style="position:relative;">
        <img id="flashImg" src="${imageData}" class="result-drawing" alt="前の人の絵"
          style="display:block;width:100%;transition:opacity 1s linear;">
        <div id="flashTimer" class="flash-timer-overlay">5</div>
      </div>
      <button class="btn btn-primary" id="flashNextBtn" style="display:none;">アクションを選ぶ ▶</button>
    </div>
  `;

  const img = document.getElementById('flashImg');
  const timerEl = document.getElementById('flashTimer');
  let remaining = 5;

  SoundManager && SoundManager.playCountdown && SoundManager.playCountdown();

  const tick = setInterval(() => {
    remaining--;
    if (timerEl) timerEl.textContent = remaining;
    SoundManager && SoundManager.playCountdown && SoundManager.playCountdown();
    if (remaining <= 0) {
      clearInterval(tick);
      // フェードアウト
      img.style.opacity = '0';
      if (timerEl) timerEl.style.display = 'none';
      setTimeout(() => {
        img.style.display = 'none';
        const nextBtn = document.getElementById('flashNextBtn');
        if (nextBtn) nextBtn.style.display = 'block';
      }, 1000);
    }
  }, 1000);

  document.getElementById('flashNextBtn').onclick = () => {
    clearInterval(tick);
    onComplete({ imageData });
  };
}
