// actions/verbal.js - 口頭アクション（縛り付き）

const VERBAL_CONSTRAINTS = [
  {
    id: 'char_limit',
    name: '文字数制限',
    description: '10文字以内で説明してください',
    check: null // 口頭なのでチェック不要
  },
  {
    id: 'no_voiced',
    name: '濁音禁止',
    description: '「が・ぎ・ぐ・げ・ご・ざ・じ・ず・ぜ・ぞ・だ・ぢ・づ・で・ど・ば・び・ぶ・べ・ぼ・ぱ・ぴ・ぷ・ぺ・ぽ」は使用禁止！',
    check: null
  },
  {
    id: 'suffix',
    name: '語尾縛り「〜にゃ」',
    description: '全ての文の語尾を「〜にゃ」で終わらせてください',
    check: null
  },
  {
    id: 'question_only',
    name: '疑問文のみ',
    description: '全ての説明を疑問文（「〜ですか？」）で行ってください',
    check: null
  },
  {
    id: 'onomatopoeia',
    name: 'オノマトペのみ',
    description: '擬音語・擬態語のみで説明してください（例：ふわふわ、ガツン、キラキラ）',
    check: null
  },
  {
    id: 'no_noun',
    name: '名詞禁止',
    description: '名詞を使わずに動詞・形容詞のみで説明してください',
    check: null
  }
];

function getRandomConstraint() {
  return VERBAL_CONSTRAINTS[Math.floor(Math.random() * VERBAL_CONSTRAINTS.length)];
}

function renderVerbalAction(container, previousData, onComplete) {
  const constraint = getRandomConstraint();

  container.innerHTML = `
    <div class="action-container verbal-action">
      <h2 class="action-title">💬 口頭で伝える</h2>

      <div class="constraint-badge">
        <span class="constraint-label">縛り</span>
        <span class="constraint-name">${constraint.name}</span>
      </div>
      <p class="constraint-desc">${constraint.description}</p>

      ${previousData ? `
        <div class="verbal-hint-box">
          <p class="verbal-hint-label">前の人からのヒント：</p>
          ${previousData.imageData
            ? `<img src="${previousData.imageData}" class="result-drawing-small" alt="前の人の内容">`
            : `<p class="verbal-hint-text">${previousData.text || ''}</p>`
          }
        </div>
      ` : ''}

      <div class="verbal-instructions">
        <p>この縛りを守りながら口頭でお題を伝えてください。</p>
        <p>最後の人が答えを言ったら、判定に進みます。</p>
      </div>

      <button class="btn btn-primary" id="verbalDoneBtn">口頭で伝えた → 判定へ ▶</button>
    </div>
  `;

  document.getElementById('verbalDoneBtn').onclick = () => {
    onComplete({ constraint: constraint.name, constraintDesc: constraint.description });
  };
}
