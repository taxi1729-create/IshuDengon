// actions/drawing.js - お絵描きアクション

function renderDrawingAction(container, topic, onComplete) {
  container.innerHTML = `
    <div class="action-container drawing-action">
      <h2 class="action-title">🎨 絵を描く</h2>
      <p class="action-desc">お題を絵で表現してください。</p>

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

      <button class="btn btn-primary" id="drawDoneBtn">完成！次の人へ渡す ▶</button>
    </div>
  `;

  const canvas = document.getElementById('drawCanvas');
  const ctx = canvas.getContext('2d');

  // キャンバスサイズ設定
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 32, 400);
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  resizeCanvas();

  let isDrawing = false;
  let currentTool = 'pen';
  let lineSize = 4;
  let lineColor = '#222222';

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    ctx.lineWidth = currentTool === 'eraser' ? lineSize * 3 : lineSize;
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : lineColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    e.preventDefault();
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });

  // ツール切替
  document.getElementById('toolPen').onclick = () => {
    currentTool = 'pen';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolPen').classList.add('active');
  };
  document.getElementById('toolEraser').onclick = () => {
    currentTool = 'eraser';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolEraser').classList.add('active');
  };

  // サイズ切替
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.onclick = () => {
      lineSize = parseInt(btn.dataset.size);
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  // カラーピッカー
  document.getElementById('colorPicker').oninput = (e) => {
    lineColor = e.target.value;
    currentTool = 'pen';
  };

  // クリア
  document.getElementById('clearBtn').onclick = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // 完成
  document.getElementById('drawDoneBtn').onclick = () => {
    const imageData = canvas.toDataURL('image/png');
    onComplete({ imageData });
  };
}

// 描いた絵を表示（次の人へ渡す）
function renderDrawingResult(container, data, onComplete) {
  container.innerHTML = `
    <div class="action-container drawing-action">
      <h2 class="action-title">🎨 前の人の絵</h2>
      <p class="action-desc">この絵からお題を推測し、次の人に伝えましょう。</p>
      <img src="${data.imageData}" class="result-drawing" alt="描かれた絵">
      <button class="btn btn-primary">アクションを選ぶ ▶</button>
    </div>
  `;
  container.querySelector('.btn-primary').onclick = onComplete;
}
