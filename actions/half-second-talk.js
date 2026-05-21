// actions/half-second-talk.js - 0.5秒しゃべるアクション

function renderHalfTalkAction(container, topic, prevRecord, onComplete, onReselect) {
  const prevHtml = prevRecord
    ? (typeof buildPrevContentHtml === 'function' ? buildPrevContentHtml(prevRecord) : '')
    : '';

  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">🎤 1秒しゃべる</h2>
      ${prevHtml}
      <div class="current-topic-display">
        <span class="current-topic-label">伝えるお題</span>
        <span class="current-topic-value">${topic}</span>
      </div>
      <p class="action-desc-text">
        ボタンを押した瞬間から1秒だけ声に出してお題を伝えてください。<br>
        次の人はその一瞬の言葉を頼りにアクションを選びます。
      </p>

      <div class="halftalk-stage">
        <div class="halftalk-status" id="halftalkStatus">準備ができたらボタンを押してください</div>
        <div class="halftalk-countdown" id="halftalkCountdown" style="display:none;">GO!</div>
        <button class="btn btn-danger halftalk-btn" id="halktalkStartBtn">🎤 しゃべる！（1秒）</button>
      </div>

      <button class="btn btn-primary" id="halftalkDoneBtn" style="display:none;">伝えた → 次の人へ ▶</button>
      <button class="btn btn-reselect" id="halftalkReselectBtn">↩ アクションを選び直す</button>
    </div>
  `;

  const startBtn = document.getElementById('halktalkStartBtn');
  const countEl  = document.getElementById('halftalkCountdown');
  const statusEl = document.getElementById('halftalkStatus');
  const doneBtn  = document.getElementById('halftalkDoneBtn');

  startBtn.onclick = () => {
    startBtn.disabled = true;
    countEl.style.display = 'block';
    statusEl.textContent = 'まだ喋ってはいけません。';
    countEl.textContent = '3秒前!';
    SoundManager && SoundManager.playBeep && SoundManager.playBeep(880, 0.05, 'square');
    vibrate && vibrate([30]);
    settimer
    // 0.5秒後に終了
 startBtn.onclick = () => {
    startBtn.disabled = true;
    countEl.style.display = 'block';
    statusEl.textContent = 'まだ喋ってはいけません。';
    
    // 3秒前
    countEl.textContent = '3秒前!';
   SoundManager && SoundManager.playBeep && SoundManager.playBeep(880, 0.05, 'square');

    vibrate && vibrate([30]);
    playFeedback(880);

    // 1秒後（2秒前）
    setTimeout(() => {
        countEl.textContent = '2秒前!';
      SoundManager && SoundManager.playBeep && SoundManager.playBeep(880, 0.05, 'square');

    vibrate && vibrate([30]);
        playFeedback(880);

        // 2秒後（1秒前）
        setTimeout(() => {
            countEl.textContent = '1秒前!';
          SoundManager && SoundManager.playBeep && SoundManager.playBeep(880, 0.05, 'square');

    vibrate && vibrate([30]);
            playFeedback(880);
        setTimeout(() => {
            countEl.textContent = 'GO!!';
            statusEl.textContent = '今思いの丈を伝えて！';
            playFeedback(880);
            // 3秒後（終了）
            setTimeout(() => {
                SoundManager && SoundManager.playBuzz && SoundManager.playBuzz();
                vibrate && vibrate([80]);
                countEl.textContent = '⏹ 終了！';
                statusEl.textContent = '次の人へ渡してください。';
                doneBtn.style.display = 'block';
            }, 1000);
        }, 1000);
    }, 1000);
    }, 1000);
};
  };

  doneBtn.onclick = () => onComplete({ note: '1秒しゃべりました' });
  document.getElementById('halftalkReselectBtn').onclick = onReselect;
}
