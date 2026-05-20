// actions/shapes.js - 抽象図形アクション

const SHAPE_TYPES = ['triangle', 'diamond', 'circle', 'square', 'star', 'hexagon'];
const SHAPE_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#1abc9c','#34495e','#ffffff','#000000'];
const SHAPE_LABELS = { triangle:'▲三角形', diamond:'◆菱形', circle:'●円', square:'■正方形', star:'★星形', hexagon:'⬡六角形' };

function renderShapesAction(container, topic, onComplete) {
  container.innerHTML = `
    <div class="action-container shapes-action">
      <h2 class="action-title">🔷 抽象図形</h2>
      <p class="action-desc">図形を配置・色付けしてお題を表現してください。</p>

      <div class="shapes-toolbar">
        <div class="shape-buttons">
          ${SHAPE_TYPES.map(s => `<button class="shape-add-btn" data-shape="${s}" title="${SHAPE_LABELS[s]}">${SHAPE_LABELS[s].charAt(0)}</button>`).join('')}
        </div>
        <div class="color-palette">
          ${SHAPE_COLORS.map(c => `<button class="color-dot" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}
        </div>
      </div>

      <canvas id="shapesCanvas" class="shapes-canvas"></canvas>
      <p class="shape-hint">図形をタップで選択 → 色変更 | ドラッグで移動 | 長押しで削除</p>

      <button class="btn btn-primary" id="shapesDoneBtn">完成！次の人へ渡す ▶</button>
    </div>
  `;

  const canvas = document.getElementById('shapesCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.min(rect.width - 32, 400);
    canvas.width = w;
    canvas.height = w;
    drawAll();
  }

  let shapes = [];
  let selectedId = null;
  let dragging = false;
  let dragOffX = 0, dragOffY = 0;
  let longPressTimer = null;

  function getNewShape(type) {
    return {
      id: Date.now() + Math.random(),
      type,
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 40,
      color: '#3498db',
      selected: false
    };
  }

  function drawShape(shape) {
    ctx.save();
    ctx.fillStyle = shape.color;
    ctx.strokeStyle = shape.selected ? '#ff0' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = shape.selected ? 3 : 1;
    const { x, y, size, type } = shape;

    ctx.beginPath();
    switch (type) {
      case 'triangle':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.866, y + size * 0.5);
        ctx.lineTo(x - size * 0.866, y + size * 0.5);
        ctx.closePath();
        break;
      case 'diamond':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.6, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.6, y);
        ctx.closePath();
        break;
      case 'circle':
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(x - size, y - size, size * 2, size * 2);
        break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? size : size * 0.4;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          i === 0 ? ctx.moveTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
                  : ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          i === 0 ? ctx.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle))
                  : ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
        }
        ctx.closePath();
        break;
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(drawShape);
  }

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

  function hitTest(pos) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      const dx = pos.x - s.x, dy = pos.y - s.y;
      if (Math.sqrt(dx * dx + dy * dy) < s.size * 1.2) return s;
    }
    return null;
  }

  // 図形追加
  document.querySelectorAll('.shape-add-btn').forEach(btn => {
    btn.onclick = () => {
      const shape = getNewShape(btn.dataset.shape);
      shapes.push(shape);
      selectedId = shape.id;
      shapes.forEach(s => s.selected = s.id === selectedId);
      drawAll();
    };
  });

  // 色変更
  document.querySelectorAll('.color-dot').forEach(btn => {
    btn.onclick = () => {
      if (selectedId) {
        const s = shapes.find(s => s.id === selectedId);
        if (s) { s.color = btn.dataset.color; drawAll(); }
      }
    };
  });

  // マウス/タッチ操作
  function onStart(e) {
    e.preventDefault();
    const pos = getPos(e);
    const hit = hitTest(pos);

    // 長押し削除
    longPressTimer = setTimeout(() => {
      if (hit) {
        shapes = shapes.filter(s => s.id !== hit.id);
        selectedId = null;
        drawAll();
        if ('vibrate' in navigator) navigator.vibrate(30);
      }
    }, 600);

    if (hit) {
      selectedId = hit.id;
      shapes.forEach(s => s.selected = s.id === selectedId);
      dragOffX = pos.x - hit.x;
      dragOffY = pos.y - hit.y;
      dragging = true;
    } else {
      selectedId = null;
      shapes.forEach(s => s.selected = false);
    }
    drawAll();
  }

  function onMove(e) {
    e.preventDefault();
    if (!dragging || !selectedId) return;
    clearTimeout(longPressTimer);
    const pos = getPos(e);
    const s = shapes.find(s => s.id === selectedId);
    if (s) {
      s.x = pos.x - dragOffX;
      s.y = pos.y - dragOffY;
      drawAll();
    }
  }

  function onEnd(e) {
    e.preventDefault();
    clearTimeout(longPressTimer);
    dragging = false;
  }

  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd, { passive: false });

  resizeCanvas();

  // 完成
  document.getElementById('shapesDoneBtn').onclick = () => {
    const imageData = canvas.toDataURL('image/png');
    onComplete({ imageData, shapes: JSON.parse(JSON.stringify(shapes)) });
  };
}

// 図形配置を表示（次の人へ渡す）
function renderShapesResult(container, data, onComplete) {
  container.innerHTML = `
    <div class="action-container shapes-action">
      <h2 class="action-title">🔷 前の人の図形</h2>
      <p class="action-desc">この図形からお題を推測し、次の人に伝えましょう。</p>
      <img src="${data.imageData}" class="result-drawing" alt="図形配置">
      <button class="btn btn-primary">アクションを選ぶ ▶</button>
    </div>
  `;
  container.querySelector('.btn-primary').onclick = onComplete;
}
