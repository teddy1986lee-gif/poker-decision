/* GTO 원칙 학습 코치. 대화는 현재 탭 메모리에만 보관합니다. */
const Coach = (() => {
  const samples = [
    ['3벳 대응', '6인 캐시게임, 유효 스택 100BB입니다. BTN에서 AsQs로 2.5BB 오픈, SB가 11BB로 3벳하고 BB는 폴드했습니다. 콜·4벳을 어떻게 판단하나요? 레이크는 모릅니다.'],
    ['블러프 캐치', '리버에서 블러프 캐치를 할 때 팟오즈와 블로커를 어떻게 함께 판단하나요? 예시로 설명해 주세요.'],
    ['토너먼트 ICM', '토너먼트 버블에서 칩EV 기준으로는 콜이지만 ICM 기준으로는 폴드할 수 있는 이유를 알려주세요.']
  ];
  let messages = [], busy = false, controller = null, returnFocus = null;
  function endpoint() {
    try { const u = new URL(COACH_CONFIG.endpoint); return u.protocol === 'https:' ? u.href : ''; }
    catch { return ''; }
  }
  function open(question = '') {
    returnFocus = document.activeElement;
    let d = document.getElementById('coach-dialog');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'coach-dialog'; d.className = 'coach-dialog';
      d.setAttribute('aria-labelledby', 'coach-title');
      d.innerHTML = `<div class="coach-head"><div><span class="eyebrow">HOLDEM GOSU · STUDY</span><h2 id="coach-title">GTO AI 코치</h2></div><button type="button" class="ibtn" id="coach-close" aria-label="채팅 닫기">×</button></div>
        <div class="coach-about">콜할까, 레이즈할까?<br><b>판단의 이유까지 함께 배워보세요.</b><p>GTO 원칙에 따른 AI 해설입니다. 솔버 계산 결과가 아니며, 정확한 액션 빈도·EV를 보장하지 않습니다.</p></div>
        <div id="coach-status" class="coach-status" role="status"></div>
        <div class="coach-samples">${samples.map(([label], i) => `<button type="button" data-coach-sample="${i}">${label} ↗</button>`).join('')}</div>
        <div id="coach-messages" class="coach-messages" role="log" aria-label="코치와의 대화" aria-live="polite"></div>
        <form id="coach-form"><label for="coach-input">포커 상황 또는 궁금한 점</label><textarea id="coach-input" rows="3" maxlength="3000" placeholder="내 패 / 포지션 / 유효 스택 / 보드 / 지금까지의 액션을 적어주세요."></textarea><div id="coach-error" class="coach-error" role="alert"></div><div class="coach-actions"><button type="button" id="coach-clear" class="link">새 대화</button><button type="button" id="coach-stop" class="btn btn-line" hidden>중단</button><button type="submit" id="coach-send" class="btn btn-ink">코치에게 질문 ↗</button></div><p class="coach-privacy">전송한 질문과 최근 대화가 AI 서비스에 전달됩니다. 이름·연락처 등 개인정보는 입력하지 마세요. 대화는 새로고침하면 사라집니다.</p></form>`;
      document.body.append(d);
      d.querySelector('#coach-close').onclick = () => d.close();
      d.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
      d.querySelector('#coach-form').onsubmit = send;
      d.querySelector('#coach-input').onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); d.querySelector('#coach-form').requestSubmit(); } };
      d.querySelectorAll('[data-coach-sample]').forEach(b => b.onclick = () => { if (busy) return; input().value = samples[+b.dataset.coachSample][1]; input().focus(); });
      d.querySelector('#coach-clear').onclick = () => { if (busy) return; messages = []; input().value = ''; error(''); paint(); };
      d.querySelector('#coach-stop').onclick = () => controller?.abort();
    }
    if (question && !busy) input().value = question;
    paint(); if (!d.open) d.showModal(); input().focus();
  }
  const input = () => document.getElementById('coach-input');
  const error = text => { document.getElementById('coach-error').textContent = text; };
  function paint() {
    const log = document.getElementById('coach-messages'); if (!log) return;
    log.replaceChildren();
    const entries = messages.length ? messages : [{ role: 'assistant', content: '안녕하세요! 내 패와 테이블 상황을 알려주세요. 상황에 따라 폴드·콜·레이즈의 판단 기준을 설명해 드릴게요. 정보가 부족하면 필요한 조건부터 확인합니다.' }];
    for (const m of entries) {
      const article = document.createElement('article'); article.className = 'coach-bubble ' + m.role;
      const label = document.createElement('b'); label.textContent = m.role === 'user' ? '나' : 'GTO AI 코치';
      const text = document.createElement('p'); text.textContent = m.content;
      article.append(label, text); log.append(article);
    }
    if (busy) { const p = document.createElement('p'); p.className = 'small muted'; p.textContent = '상황을 분석하고 있어요…'; log.append(p); }
    log.scrollTop = log.scrollHeight;
    document.getElementById('coach-status').textContent = endpoint() ? '학습·복기용 · Ctrl/⌘ + Enter로 전송' : 'AI 연결 준비 중입니다. 운영자가 연결을 완료하면 질문을 보낼 수 있어요.';
    document.getElementById('coach-send').disabled = busy || !endpoint();
    document.getElementById('coach-clear').disabled = busy;
    document.getElementById('coach-stop').hidden = !busy;
    input().disabled = busy;
  }
  async function send(e) {
    e.preventDefault(); if (busy || !endpoint()) return;
    const question = input().value.trim(); if (!question) { error('질문을 입력해 주세요.'); return; }
    error(''); messages.push({ role: 'user', content: question }); busy = true; input().value = ''; paint();
    controller = new AbortController(); const timer = setTimeout(() => controller?.abort(), 55000);
    try {
      const response = await fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messages.slice(-11) }), signal: controller.signal, credentials: 'omit' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(({429:'잠시 질문이 몰렸어요. 1분 후 다시 시도해 주세요.',503:'AI 연결 준비 중입니다. 잠시 후 다시 이용해 주세요.'})[response.status] || '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
      if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('답변이 비어 있습니다. 다시 시도해 주세요.');
      messages.push({ role: 'assistant', content: data.answer }); messages = messages.slice(-20);
    } catch (err) {
      messages.pop(); input().value = question;
      error(err.name === 'AbortError' ? '요청이 중단되었거나 응답 시간이 초과되었습니다. 질문은 그대로 남겨 두었습니다.' : err.message === 'Failed to fetch' ? '연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' : err.message);
    } finally { clearTimeout(timer); controller = null; busy = false; paint(); if (document.getElementById('coach-dialog').open) input().focus(); }
  }
  function askProblem(p) {
    const st = PD.build(p), bb = x => +(x / st.bb).toFixed(2);
    const snapshot = { format: '노리밋 홀덤 토너먼트', players: st.n, heroPosition: p.h, heroCards: st.heroCards, board: st.board, effectiveStackBB: st.effBB, potIncludingBetsBB: bb(st.total), toCallBB: bb(Math.min(st.toCall, st.hero.stack)), blinds: p.bl, initialStacksBB: p.s, actionTokens: p.a, situation: p.ctx || '', options: p.o };
    open('이 학습 문제를 GTO 원칙으로 복기해 주세요. 권장 행동과 다른 선택을 비교하고, 정보가 부족한 부분은 알려주세요.\n' + JSON.stringify(snapshot) + '\n액션 표기: f 폴드, x 체크, c 콜, b 숫자BB 베팅, r 숫자BB까지 레이즈, a 올인. |는 스트리트 구분입니다. 액션은 각 스트리트의 행동 순서대로입니다.');
  }
  return { open, askProblem };
})();
