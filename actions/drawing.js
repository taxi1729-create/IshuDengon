// actions/drawing.js - お絵描きアクション（お邪魔虫 bug.png 付き）

function renderDrawingAction(container, topic, prevRecord, onComplete, onReselect) {
  const prevHtml = prevRecord
    ? (typeof buildPrevContentHtml === 'function' ? buildPrevContentHtml(prevRecord) : '')
    : '';

  container.innerHTML = `
    <div class="action-container drawing-action">
      <h2 class="action-title">🎨 絵を描く</h2>
      ${prevHtml}
      <div class="current-topic-display">
        <span class="current-topic-label">伝えるお題</span>
        <span class="current-topic-value">${topic}</span>
      </div>

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
      <p class="action-desc-text" style="font-size:0.75rem;">※ 完成後、次の人が見る時にお邪魔虫が現れます！</p>

      <button class="btn btn-primary" id="drawDoneBtn">完成！次の人へ渡す ▶</button>
      <button class="btn btn-reselect" id="drawReselectBtn">↩ アクションを選び直す</button>
    </div>
  `;

  initDrawCanvas('drawCanvas');

  document.getElementById('drawDoneBtn').onclick = () => {
    const canvas = document.getElementById('drawCanvas');
    // 次の人に渡す前にお邪魔虫画面へ
    renderDrawingWithBug(container, imageData, onComplete);
    const imageData = canvas.toDataURL('image/png');
  };

  document.getElementById('drawReselectBtn').onclick = onReselect;
}

// ===== キャンバス初期化（drawing / flashdraw 共用） =====
function initDrawCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 16, 420);
    // 現在の絵を保持しながらリサイズ
    const tmp = canvas.toDataURL();
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 絵を復元
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = tmp;
  }
  resize();

  let drawing = false;
  let tool = 'pen';
  let lineSize = 4;
  let lineColor = '#222222';

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
  }

  canvas.addEventListener('mousedown', e => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    const p = pos(e);
    ctx.lineWidth = tool === 'eraser' ? lineSize * 3 : lineSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : lineColor;
    ctx.lineTo(p.x, p.y); ctx.stroke();
  });
  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!drawing) return;
    const p = pos(e);
    ctx.lineWidth = tool === 'eraser' ? lineSize * 3 : lineSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : lineColor;
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }, { passive: false });
  canvas.addEventListener('touchend', e => { e.preventDefault(); drawing = false; }, { passive: false });

  document.getElementById('toolPen') && (document.getElementById('toolPen').onclick = () => {
    tool = 'pen';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolPen').classList.add('active');
  });
  document.getElementById('toolEraser') && (document.getElementById('toolEraser').onclick = () => {
    tool = 'eraser';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolEraser').classList.add('active');
  });
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => {
      lineSize = parseInt(btn.dataset.size);
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
  const cp = document.getElementById('colorPicker');
  cp && (cp.oninput = e => { lineColor = e.target.value; tool = 'pen'; });
  document.getElementById('clearBtn') && (document.getElementById('clearBtn').onclick = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}

// ===== 次の人に見せる：お邪魔虫オーバーレイ =====
function renderDrawingWithBug(container, imageData, onComplete) {
  container.innerHTML = `
    <div class="action-container">
      <h2 class="action-title">🎨 前の人の絵</h2>
      <p class="action-desc-text">この絵からお題を推測してください。<br>お邪魔虫に邪魔されないように！</p>
      <div class="drawing-bug-wrap" id="bugWrap" style="position:relative;display:inline-block;width:100%;">
        <img src="${imageData}" class="result-drawing" alt="前の人の絵" style="display:block;width:100%;">
        <!-- お邪魔虫はJSで動的に配置 -->
      </div>
      <button class="btn btn-primary" id="bugDoneBtn">アクションを選ぶ ▶</button>
    </div>
  `;

  spawnBugs('bugWrap');

  document.getElementById('bugDoneBtn').onclick = () => {
    stopBugs();
    onComplete({ imageData });
  };
}

let bugTimers = [];
function stopBugs() {
  bugTimers.forEach(t => clearInterval(t));
  bugTimers = [];
}

function spawnBugs(wrapId) {
  stopBugs();
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;

  const bugCount = 3;
  for (let i = 0; i < bugCount; i++) {
    const bug = document.createElement('img');
    bug.src = 'bug.png';
    bug.style.cssText = `
      position:absolute;
      width:480px; height:480px;
      object-fit:contain;
      pointer-events:none;
      left:${Math.random() * 10}%;
      top:${Math.random() * 10}%;
      transform:rotate(10deg);
      transition:left 0.1s linear, top 0.1s linear;
    `;
    wrap.appendChild(bug);

    let angle = 0;
    const timer = setInterval(() => {
      // ぐるぐる移動
      bug.style.left = `${10 + Math.random() * 75}%`;
      bug.style.top  = `${10 + Math.random() * 75}%`;
      angle += 20;
      bug.style.transform = `rotate(${angle}deg)`;
    }, 700);
    bugTimers.push(timer);
  }
}
