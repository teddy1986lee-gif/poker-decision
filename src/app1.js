/* ===== 앱: 공통 · 홈 · 문제 풀이 ===== */
const SHARE_BASE = '';
const LV = { 1: { nm: '입문', tp: '포지션별 시작 핸드 · 기본 팟오즈 · 체크와 밸류 베팅' }, 2: { nm: '중급', tp: '3벳 대응 · 드로우의 콜 판단 · 베팅 크기 · 턴 액션' }, 3: { nm: '고급', tp: '상대 범위 추정 · 블러프 캐치 · 숏스택 · 버블과 ICM' } };
const RV = { draft: ['검수 대기', 'draft'], ok: ['검수 완료', 'okp'], fix: ['수정 필요', 'fixp'], hidden: ['비공개', 'hidp'] };
const POINTS = 100;

const U = {
  $: (s, el = document) => el.querySelector(s),
  $$: (s, el = document) => [...el.querySelectorAll(s)],
  esc: s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])),
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  pct: (a, b) => (b ? Math.round(a / b * 100) : 0),
  toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
};

const App = (() => {
  const S = Store.S;
  const ui = { view: 'home', set: null, rankTab: 'week', notesTab: 'wrong', adminTab: 'bank' };
  const units = () => Store.pref().units || 'bb';

  // ---------- 문제은행 ----------
  const vcache = new Map();
  function valid(p) {
    const key = JSON.stringify([p.bl, p.s, p.h, p.c, p.b, p.a, p.o, p.ans, p.pl, p.lv]);
    if (!vcache.has(key)) vcache.set(key, PD.validate(p).errs);
    return vcache.get(key);
  }
  function bank() {
    const base = PROBLEMS.concat(Object.values(S.custom || {}).map(p => ({ ...p, custom: true })));
    return base.map(p => {
      const e = S.edits[p.id];
      const q = e ? { ...p, ...e } : p;
      return { ...q, rv: S.review[p.id] || 'draft' };
    });
  }
  const byId = id => bank().find(p => p.id === id);
  /** 출제 가능한 문제(난이도를 주면 그 난이도만) */
  function playable(lv) {
    const only = S.settings.onlyReviewed;
    return bank().filter(p => !p.ex && (lv == null || p.lv === lv) && p.rv !== 'hidden' && (!only || p.rv === 'ok') && valid(p).length === 0);
  }
  const ansOf = p => (p.ans == null ? [] : [].concat(p.ans));

  // ---------- 이용권 ----------
  function tickets() { Store.roll(S.p); const t = S.p.tix; return t.free + t.ad + t.inv; }
  function useTicket() {
    const t = S.p.tix;
    if (t.free > 0) t.free--; else if (t.ad > 0) t.ad--; else if (t.inv > 0) t.inv--; else return false;
    return true;
  }

  // ---------- 헤더 ----------
  function paintHeader() {
    U.$('#tix-n').textContent = tickets();
    const b = U.$('#who-btn');
    b.textContent = S.p.nick ? S.p.nick : '로그인';
    U.$$('.nav [data-nav]').forEach(x => x.setAttribute('aria-current', x.dataset.nav === navKey() ? 'page' : 'false'));
  }
  const navKey = () => ({ home: 'home', play: 'home', result: 'home', rank: 'rank', notes: 'notes', sim: 'sim', invite: 'invite', admin: '' }[ui.view] ?? '');
  const canAdmin = () => !S.runtime || S.isOwner || S.canEdit;

  function go(view, opts = {}) {
    ui.view = view;
    render();
    if (!opts.keepScroll) window.scrollTo({ top: 0 });
  }
  function render() {
    paintHeader();
    const el = U.$('#view');
    const f = { home: Home, play: Play, result: Result, rank: Rank, notes: Notes, sim: SimView, invite: Invite, admin: Admin }[ui.view] || Home;
    el.innerHTML = f.html();
    f.bind && f.bind(el);
  }

  // ---------- 공통 조각 ----------
  const protoNote = () => `<div class="proto small"><span>●</span><span><b>시제품</b> · 문제와 정답은 전문가 검수 전 초안입니다. 광고는 모의 화면이며 실제 수익이 발생하지 않습니다.</span></div>`;
  const lvPill = lv => `<span class="pill lv${lv}">${LV[lv].nm}</span>`;
  const rvPill = rv => { const [t, c] = RV[rv] || RV.draft; return `<span class="pill ${c}">${t}</span>`; };

  // ================= 홈(로비) =================
  const Home = {
    html() {
      const t = S.p.tix, total = tickets();
      const ex = PROBLEMS.find(p => p.ex);
      const mine = playable().filter(p => S.p.solved[p.id]);
      const ok = mine.filter(p => S.p.solved[p.id].ok).length;
      const courses = [
        ['pre','01','프리플랍의 기본','좋은 판단은 첫 액션에서 시작됩니다.','OPENING RANGE','As','Kh'],
        ['post','02','포스트플랍 전략','보드와 레인지를 읽고 다음 수를 찾으세요.','READ THE BOARD','Qs','Jh'],
        ['icm','03','토너먼트의 승부처','스택과 상금 구조가 바꾸는 의사결정.','TOURNAMENT PLAY','Ks','Qh']
      ];
      return `<section class="academy screen">
        <div class="academy-intro"><div><span class="eyebrow">YOUR POKER STUDY ROOM</span><h1>${S.p.nick ? U.esc(S.p.nick) + '님의 학습 공간' : '더 나은 판단을 위한 시간.'}</h1></div><span class="academy-date">HOLDEM GOSU / ACADEMY</span></div>
        <div class="academy-grid"><div class="academy-main">
          <div class="study-hero"><div class="hero-copy"><span class="lesson-tag">DAILY PRACTICE · 오늘의 훈련</span><h2>한 번의 선택.<br>더 깊어지는 실력.</h2><p>실전 속 다양한 상황을 풀어보고,<br>내 선택의 이유를 이해하세요.</p><button class="btn btn-ink" id="start" type="button">${ui.set && ui.set.mode !== 'preview' && ui.set.ids[ui.set.idx] && ui.set.answers.length < ui.set.ids.length ? '진행 중인 학습 이어하기' : total ? '오늘의 학습 시작하기' : '이용권 충전하기'} <span aria-hidden="true">↗</span></button><span class="hero-meta">한 세트 최대 3문제 · 선택 후 해설 제공</span></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-card art-back">K<span>♥</span></div><div class="art-card art-front">A<span>♠</span></div><span class="art-caption">THINK IN RANGES.</span></div></div>
          <div class="academy-section-title"><div><span class="eyebrow">LEARNING PATHS</span><h2>주제별 집중 학습</h2></div><span class="small muted">지금 필요한 판단부터</span></div>
          <div class="course-grid">${courses.map(([key,no,title,desc,en,a,b]) => { const qs=playable().filter(q=>courseMatch(q,key));const count=qs.filter(q=>S.p.solved[q.id]).length;return `<button type="button" class="course-card course-${key}" data-course="${key}"><div class="course-visual"><span class="course-no">${no}</span><span class="course-symbol">${key==='pre'?'A♠':key==='post'?'♣ ♦ ♠':'♔'}</span><span class="course-en">${en}</span></div><div class="course-copy"><h3>${title}<span>↗</span></h3><p>${desc}</p><div class="course-progress"><i style="width:${U.pct(count,qs.length)}%"></i></div><span class="small muted">${count} / ${qs.length}문제 학습</span></div></button>`; }).join('')}</div>
          <div class="academy-section-title"><div><span class="eyebrow">STUDY TOOLS</span><h2>판단을 돕는 도구</h2></div></div>
          <div class="tool-grid"><button class="study-tool" type="button" onclick="Coach.open()"><span class="tool-icon">✳</span><div><h3>GTO AI 코치 <span class="quiet-badge">${COACH_CONFIG.endpoint ? 'AI' : '연결 준비 중'}</span></h3><p>헷갈리는 상황을 질문하고<br>판단의 근거를 확인하세요.</p></div><span>↗</span></button><button class="study-tool" type="button" data-nav="sim"><span class="tool-icon">%</span><div><h3>승률 시뮬레이터</h3><p>카드와 상대 범위를 설정하고<br>가능성을 직접 비교하세요.</p></div><span>↗</span></button></div>
        </div><aside class="academy-aside"><div class="progress-panel"><span class="eyebrow">MY PROGRESS</span><h2>나의 학습 기록</h2><div class="accuracy-ring" style="--progress:${U.pct(ok,mine.length)}%"><div><b>${U.pct(ok,mine.length)}<small>%</small></b><span>첫 풀이 정답률</span></div></div><div class="metric-row"><span>학습한 문제</span><b>${mine.length}<small> 문제</small></b></div><div class="metric-row"><span>누적 포인트</span><b>${S.p.tot.p.toLocaleString('ko-KR')}<small> P</small></b></div><div class="metric-row"><span>이번 주 정답</span><b>${S.p.wk.c}<small> 문제</small></b></div><button class="btn btn-line btn-block" data-nav="notes" type="button">학습 기록 보기 →</button></div>
          <div class="review-panel"><span class="eyebrow">REVIEW & IMPROVE</span><h3>틀린 선택에서<br>한 단계 더.</h3><p>오답 ${Object.values(S.p.solved).filter(x=>!x.ok).length}문제가 기다리고 있어요.<br>재풀이는 이용권을 사용하지 않습니다.</p><button class="link" id="academy-review" type="button">오답노트 열기 ↗</button></div>
          <div class="ticket-panel"><div class="spread"><b>남은 학습 이용권</b><strong>${total}</strong></div><div class="ticket-details">무료 ${t.free} · 광고 ${t.ad} · 초대 ${t.inv}</div><button class="link" id="academy-tickets" type="button">이용권 받기 →</button></div>
        </aside></div>
        <footer class="academy-footer"><span>HOLDEM GOSU <span class="muted">· 매일 한 걸음, 더 나은 플레이.</span></span><div><button class="link" type="button" data-ex>예시 핸드 체험</button>${canAdmin() ? '<button class="link" type="button" id="to-admin">관리자</button>' : ''}</div></footer>
        <p class="academy-note">학습 문제와 정답은 전문가 검수 전 초안입니다. 광고 보상은 현재 모의 기능입니다.</p>
      </section>`;
    },
    bind(el) {
      U.$('#start', el).onclick = () => ui.set && ui.set.mode !== 'preview' && ui.set.ids[ui.set.idx] && ui.set.answers.length < ui.set.ids.length ? go('play') : startSet();
      U.$('[data-ex]', el).onclick = () => startPreview(PROBLEMS.find(p => p.ex).id);
      U.$$('[data-nav]', el).forEach(b => b.onclick = () => go(b.dataset.nav));
      U.$$('[data-course]', el).forEach(b => b.onclick = () => startSet(b.dataset.course));
      U.$('#academy-review', el).onclick = () => { ui.notesTab='wrong'; go('notes'); };
      U.$('#academy-tickets', el).onclick = () => U.$('#tix-chip').click();
      const a = U.$('#to-admin', el); if (a) a.onclick = () => go('admin');
    }
  };

  // ================= 세트 시작 =================
  /**
   * 한 테이블에서 n문제 고르기. 아직 안 푼 문제 중에서 뽑되, 푼 문제가 적을수록 입문 비중을 높이고
   * 많이 풀수록 중급·고급 비중을 늘린다. 세트 안에서는 쉬운 문제부터 낸다.
   */
  function courseMatch(p, key) {
    const tournament = /ICM|버블|상금|파이널|숏스택|푸시|리쇼브/i.test([p.tp,p.ti,p.ctx].join(' '));
    if (key === 'icm') return tournament;
    if (key === 'pre') return !tournament && !(p.b || '').trim();
    if (key === 'post') return !tournament && !!(p.b || '').trim();
    return true;
  }
  function pickProblems(n, course) {
    const list = playable().filter(p => courseMatch(p, course)), fresh = list.filter(p => !S.p.solved[p.id]);
    const solvedN = Object.keys(S.p.solved).length;
    const W = solvedN < 15 ? { 1: 6, 2: 3, 3: 1 } : solvedN < 45 ? { 1: 3, 2: 4, 3: 3 } : { 1: 2, 2: 4, 3: 4 };
    const pool = (fresh.length ? fresh : list).slice(), out = [];
    while (out.length < n && pool.length) {
      let x = Math.random() * pool.reduce((s, p) => s + (W[p.lv] || 1), 0), i = 0;
      for (; i < pool.length - 1; i++) { x -= W[pool[i].lv] || 1; if (x < 0) break; }
      out.push(pool.splice(i, 1)[0]);
    }
    return out.sort((a, b) => a.lv - b.lv).map(p => p.id);
  }
  function startSet(course) {
    const n = Math.min(3, tickets());
    if (n === 0) { ui.set = { ids: [], idx: 0, answers: [], mode: 'scored', empty: true }; S.p.ctr.offers++; Store.save(); return go('result'); }
    const ids = pickProblems(n, course);
    if (!ids.length) { U.toast('출제할 문제가 없습니다.'); return; }
    if (ui.set && ui.set.fromResult) S.p.ctr.continued++;
    S.p.ctr.setsStarted++; Store.save();
    ui.set = { ids, idx: 0, answers: [], mode: 'scored' };
    go('play');
  }
  function startRetry(ids) { ui.set = { ids, idx: 0, answers: [], mode: 'retry' }; go('play'); }
  function startPreview(id) { ui.set = { ids: [id], idx: 0, answers: [], mode: 'preview', back: ui.view }; go('play'); }

  // ================= 문제 풀이 =================
  function optText(st, tok) {
    const i = PD.optionInfo(st, tok), u = units(), other = u === 'bb' ? 'chips' : 'bb';
    const A = x => TableView.amt(x, st.bb, u), B = x => TableView.amt(x, st.bb, other);
    switch (i.kind) {
      case 'fold': return ['폴드', '이번 핸드 포기'];
      case 'check': return ['체크', '베팅 없이 넘김'];
      case 'call': {
        const limp = st.street === 'pre' && st.cur === st.bb && st.hero.k !== 'BB';
        return [`콜 ${A(i.amt)}`, [B(i.amt), i.allin ? '올인 콜' : limp ? '림프' : ''].filter(Boolean).join(' · ')];
      }
      case 'bet': return [`베팅 ${A(i.amt)}`, [B(i.amt), `팟의 ${i.pct}%`, i.allin ? '올인' : ''].filter(Boolean).join(' · ')];
      case 'raise': return [`레이즈 총 ${A(i.to)}`, [B(i.to), i.allin ? '올인' : ''].filter(Boolean).join(' · ')];
      case 'allin': return [`올인 ${A(i.to)}`, [B(i.to), st.facing ? '남은 칩 전부' : `팟의 ${i.pct}%`].join(' · ')];
    }
  }
  const optLabel = (st, tok) => optText(st, tok)[0];
  /** 버튼용: 행동 / 금액 / 보조 표기 */
  function optParts(st, tok) {
    const [lb, sb] = optText(st, tok);
    const m = /^(.*?)\s([\d.,]+(?:BB)?)$/.exec(lb);
    return m ? { act: m[1], amt: m[2], sub: sb } : { act: lb, amt: '', sub: '' };
  }
  const ACT_KO = { f: '폴드', x: '체크', c: '콜', b: '베팅', r: '레이즈', a: '올인' };

  function logHtml(st) {
    const u = units(), A = x => TableView.amt(x, st.bb, u);
    return st.log.map((L, si) => {
      const chips = [];
      let run = [];
      const flush = () => {
        if (!run.length) return;
        const nm = run.length > 1 ? `${PD.posName(run[0].k)}–${PD.posName(run[run.length - 1].k)}` : PD.posName(run[0].k);
        chips.push(`<span class="act f"><i></i>${nm} 폴드</span>`); run = [];
      };
      L.evs.forEach(e => {
        if (e.t === 'f' && !e.hero) { run.push(e); return; }
        flush();
        const amt = e.t === 'c' ? ` ${A(e.amt)}` : (e.t === 'b' || e.t === 'r') ? ` ${A(e.to)}` : '';
        const t = e.allin && e.t !== 'f' ? (e.t === 'c' ? '콜(올인)' : '올인') : ACT_KO[e.t];
        chips.push(`<span class="act ${e.allin && e.t !== 'c' ? 'a' : e.t}${e.hero ? ' me' : ''}"><i></i>${PD.posName(e.k)}${e.hero ? '(나)' : ''} ${t}${amt}</span>`);
      });
      flush();
      if (si === st.log.length - 1) chips.push(`<span class="act turn">${PD.posName(st.hero.k)}(나) 차례</span>`);
      const newCards = si === 0 ? [] : L.board.slice(si === 1 ? 0 : L.board.length - 1);
      return `<div class="st"><div class="sn">${PD.STREET_KO[L.street]}<small class="num">팟 ${A(L.potStart)}</small></div>
        <div class="acts">${newCards.length ? TableView.miniCards(newCards) : ''}${chips.join('') || '<span class="muted small">—</span>'}</div></div>`;
    }).join('');
  }

  const ICON_EXIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/></svg>';
  const Play = {
    html() {
      const set = ui.set, p = byId(set.ids[set.idx]);
      if (!p) return `<div class="empty">문제를 찾을 수 없습니다.</div>`;
      const st = PD.build(p), u = units();
      const A = x => TableView.amt(x, st.bb, u);
      const done = set.answers[set.idx];
      const ans = ansOf(p);
      const hand = PD.handLabel(st.heroCards.concat(st.board));
      const svg = TableView.render(st, { units: u, label: p.ti, heroName: S.p.nick || '나', hand });
      const prog = set.mode === 'preview' ? '미리보기' : set.mode === 'retry' ? `재풀이 ${set.idx + 1}/${set.ids.length}` : `문제 ${set.idx + 1}/${set.ids.length}`;
      const rvT = (RV[p.rv] || RV.draft)[0];
      const chips = `<span class="tog on">${U.esc(p.tp)}</span><span class="tog ${p.rv === 'ok' ? 'on' : 'warn'}">${rvT}</span>${set.mode === 'retry' ? '<span class="tog">랭킹 미반영</span>' : set.mode === 'preview' ? '<span class="tog">기록 안 됨</span>' : ''}`;
      let stamp = '';
      if (done) stamp = !ans.length ? '<div class="stamp na">검수 대기</div>' : done.ok ? '<div class="stamp ok">정답!</div>' : '<div class="stamp no">오답</div>';
      const btns = p.o.map((tok, i) => {
        const op = optParts(st, tok);
        let cls = `abtn ${PD.parseTok(tok).t}`, mark = '';
        if (done) {
          const ok = ans.includes(i);
          if (ok) { cls += ' right'; mark = done.choice === i ? '✓ 내 선택 · 권장' : '✓ 권장'; }
          else if (done.choice === i) { cls += ' wrong'; mark = '✕ 내 선택'; }
          else cls += ' dim';
        }
        return `<button type="button" class="${cls}" data-o="${i}" ${done ? 'disabled' : ''}><span class="led" aria-hidden="true"></span><span class="lb">${U.esc(op.act)}</span>${op.amt ? `<span class="am num">${U.esc(op.amt)}</span>` : ''}${op.sub ? `<span class="sb num">${U.esc(op.sub)}</span>` : ''}${mark ? `<span class="mark">${mark}</span>` : ''}</button>`;
      }).join('');
      const facing = st.facing ? `콜 금액 ${A(Math.min(st.toCall, st.hero.stack))}` : '상대 베팅 없음';
      return `<section class="stage">
        <div class="tbl">${svg}
          <div class="hud">
            <div class="hud-l">
              <div class="row" style="gap:7px">
                <button class="ibtn" type="button" id="p-exit" aria-label="나가기">${ICON_EXIT}</button>
                <button class="ibtn" type="button" id="p-unit" aria-label="금액 단위 바꾸기"><span style="font:900 11.5px/1 var(--f-body)">${u === 'bb' ? 'BB' : '칩'}</span></button>
                <div class="lvbadge"><b>${LV[p.lv].nm}</b><span>${prog}</span></div>
              </div>
              <div class="sidechips">${chips}</div>
            </div>
            <div class="blindbox num"><b>${st.sb.toLocaleString('ko-KR')}/${st.bb.toLocaleString('ko-KR')}</b><span>토너먼트 · ${st.n}인</span><i>유효 ${TableView.trimNum(st.effBB)}BB</i></div>
          </div>
          <div class="turnbox"><b>${PD.STREET_KO[st.street]} · 내 차례</b><span class="num">${facing}</span></div>
          ${stamp}
        </div>
        ${p.ctx ? `<div class="ctx"><b>상황</b> · ${U.esc(p.ctx)}</div>` : ''}
        <div class="acts4" style="--n:${p.o.length}" role="group" aria-label="${PD.posName(st.hero.k)}(나)의 선택">${btns}</div>
        ${done ? explainHtml(p, st, done) + '<button class="btn btn-line coach-entry" type="button" id="coach-problem">이 문제 AI 코치에게 질문하기 ↗</button>' : ''}
        <div class="ticker"><div class="log">${logHtml(st)}</div></div>
      </section>`;
    },
    bind(el) {
      U.$$('[data-o]', el).forEach(b => b.onclick = () => answer(+b.dataset.o));
      U.$('#p-unit', el).onclick = () => { Store.setPref('units', units() === 'bb' ? 'chips' : 'bb'); render(); };
      U.$('#p-exit', el).onclick = () => go(ui.set && ui.set.mode === 'preview' && ui.set.back && ui.set.back !== 'play' ? ui.set.back : 'home');
      const coach = U.$('#coach-problem', el); if (coach) coach.onclick = () => Coach.askProblem(byId(ui.set.ids[ui.set.idx]));
      const nx = U.$('#next', el); if (nx) nx.onclick = next;
    }
  };

  function explainHtml(p, st, done) {
    const ans = ansOf(p), set = ui.set;
    const last = set.idx >= set.ids.length - 1;
    let verdict;
    if (!ans.length) verdict = `<div class="verdict na"><b>검수 대기</b><span>이 예시 문제의 정답은 전문가 검수 후 공개됩니다.</span></div>`;
    else if (done.ok) verdict = `<div class="verdict ok"><b>정답</b><span>${set.mode === 'scored' && done.first ? `+${POINTS}점 · 정답 수 +1` : set.mode === 'scored' ? '이미 푼 문제라 점수는 더해지지 않습니다' : '랭킹에는 반영되지 않습니다'}</span></div>`;
    else verdict = `<div class="verdict no"><b>오답</b><span>권장: ${ans.map(i => U.esc(optLabel(st, p.o[i]))).join(' 또는 ')}${set.mode === 'scored' ? ' · 오답노트에 저장됨' : ''}</span></div>`;
    const others = p.o.map((tok, i) => (p.n && p.n[i] && !ans.includes(i)) ? `<li><b>${U.esc(optLabel(st, tok))}</b><span>${U.esc(p.n[i])}</span></li>` : '').join('');
    const btn = set.mode === 'preview' ? `<button class="btn btn-ink btn-block" id="next" type="button">돌아가기</button>`
      : `<button class="btn btn-ink btn-block" id="next" type="button">${last ? '결과 보기' : '다음 문제'}</button>`;
    return `<div class="sheet">${verdict}
      <div class="explain">
        ${ans.length ? `<div><h3>권장 행동</h3><p><b>${ans.map(i => U.esc(optLabel(st, p.o[i]))).join(' · ')}</b></p></div>` : ''}
        <div><h3>이유</h3><p>${U.esc(p.w)}</p></div>
        ${others ? `<div><h3>다른 선택의 문제점</h3><ul class="others">${others}</ul></div>` : ''}
        <div class="row small"><span class="muted">학습 주제</span><span class="pill">${U.esc(p.tp)}</span></div>
      </div>
      <div class="stick">${btn}</div></div>`;
  }

  function answer(i) {
    const set = ui.set, p = byId(set.ids[set.idx]);
    if (set.answers[set.idx]) return;
    const ans = ansOf(p), ok = ans.includes(i);
    const rec = { id: p.id, choice: i, ok, first: false };
    if (set.mode === 'scored') {
      Store.roll(S.p);
      if (!useTicket()) { U.toast('이용권이 없습니다. 광고나 초대로 받을 수 있어요.'); return go('result'); }
      const first = !S.p.solved[p.id];
      rec.first = first;
      if (first) {
        S.p.solved[p.id] = { ok, c: i, at: Date.now() };
        S.p.tot.a++; S.p.wk.a++;
        if (ok) { S.p.tot.c++; S.p.wk.c++; S.p.tot.p += POINTS; S.p.wk.p += POINTS; }
      } else {
        S.p.retry[p.id] = { ok, at: Date.now() };
      }
      Store.save();
      if (S.p.pendingInv) completeInvite();
    } else if (set.mode === 'retry') {
      S.p.retry[p.id] = { ok, at: Date.now() };
      Store.save();
    }
    set.answers[set.idx] = rec;
    render();
    const sh = U.$('.acts4'); if (sh) sh.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function next() {
    const set = ui.set;
    if (set.mode === 'preview') return go(set.back && set.back !== 'play' ? set.back : 'home');
    if (set.idx < set.ids.length - 1) { set.idx++; return go('play'); }
    if (set.mode === 'scored') { S.p.ctr.setsDone++; S.p.ctr.offers++; Store.save(); }
    go('result');
  }

  // ---------- 초대 완료 처리(초대받은 쪽) ----------
  async function completeInvite() {
    const p = S.p, code = p.pendingInv;
    if (!code) return;
    p.pendingInv = null;
    if (code === p.code) { Store.save(); return; }
    p.invitedBy = code; Store.save();
    if (!S.db || !S.uid) return;
    try {
      const q = await S.db.collection('players').where('code', '==', code).limit(1).get();
      if (q.empty) return;
      const inviter = q.docs[0].id;
      if (inviter === S.uid) return;
      const ref = S.db.doc('invites/' + S.uid);
      const ex = await ref.get();
      if (!ex.exists) await ref.set({ inviter, code, at: Date.now() });
    } catch (e) { console.warn('invite', e && e.code); }
  }

  return { ui, S, go, render, bank, byId, playable, ansOf, tickets, valid, startSet, startRetry, startPreview, units, optLabel, protoNote, lvPill, rvPill, canAdmin, paintHeader };
})();
