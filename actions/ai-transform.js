// actions/ai-transform.js - AI変換アクション

async function aiTransformTopic(topic, apiKey) {
  const key = apiKey || GameState.apiKey || CONFIG.ANTHROPIC_API_KEY;
  if (!key) {
    return '⚠️ APIキーが設定されていません。設定画面でAPIキーを入力してください。';
  }

  const prompt = `以下のお題を、尖った・哲学的・詩的・または誇張した視点で1〜2文に言い換えてください。ユーモアや皮肉を含めてもOKです。言い換えた文章のみを返してください。余分な説明は不要です。\n\nお題：${topic}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CONFIG.AI_MODEL,
        max_tokens: CONFIG.AI_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API Error');
    }

    const data = await response.json();
    return data.content[0]?.text || 'AI変換に失敗しました';
  } catch (e) {
    console.error('AI Transform Error:', e);
    return `エラーが発生しました: ${e.message}`;
  }
}

// AI変換アクション画面を描画
function renderAiTransformAction(container, topic, onComplete) {
  container.innerHTML = `
    <div class="action-container ai-action">
      <h2 class="action-title">🤖 AI変換</h2>
      <p class="action-desc">AIがお題を「尖った視点」で言い換えます。<br>次の人にこのテキストを見せてください。</p>
      <div class="ai-result-box" id="aiResult">
        <div class="loading-spinner"></div>
        <p>変換中...</p>
      </div>
      <button class="btn btn-primary" id="aiDoneBtn" style="display:none;" onclick="onComplete()">
        次の人へ渡す ▶
      </button>
    </div>
  `;

  let resultText = '';
  const apiKey = GameState.apiKey || CONFIG.ANTHROPIC_API_KEY;

  aiTransformTopic(topic, apiKey).then(text => {
    resultText = text;
    document.getElementById('aiResult').innerHTML = `<p class="ai-text">${text}</p>`;
    document.getElementById('aiDoneBtn').style.display = 'block';
    document.getElementById('aiDoneBtn').onclick = () => onComplete({ text: resultText });
  });
}

// AI変換結果を表示（次の人へ渡す）
function renderAiTransformResult(container, data, onComplete) {
  container.innerHTML = `
    <div class="action-container ai-action">
      <h2 class="action-title">🤖 AIからのヒント</h2>
      <p class="action-desc">前の人がAIに変換してもらったヒントです。</p>
      <div class="ai-result-box">
        <p class="ai-text">${data.text}</p>
      </div>
      <p class="hint-text">このヒントをもとにお題を推測し、次の人に伝えましょう。</p>
      <button class="btn btn-primary" onclick="onComplete()">アクションを選ぶ ▶</button>
    </div>
  `;
  document.querySelector('#aiResult + button')?.addEventListener('click', onComplete);
  // ボタン再バインド
  container.querySelector('.btn-primary').onclick = onComplete;
}
