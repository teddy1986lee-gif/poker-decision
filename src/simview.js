/* ===== 승률 시뮬레이터 화면 ===== */
const SimView = (() => {
  const E = SimEngine;
  const LS_SIM = 'hg.sim.v1';
  const MAXN = 8;
  const PCTS = [100, 50, 30, 20, 10, 5];
  const COL = ['#ffd54a', '#78e6f3', '#ff8fb0', '#8ef2b8', '#b79cff', '#ffb36b', '#6fa0ff', '#d5dde5'];
  const HAND_KO = { 'HIGH CARD': '하이카드', 'ONE PAIR': '원페어', 'TWO PAIR': '투페어', 'TRIPS': '트리플', 'STRAIGHT': '스트레이트', 'FLUSH': '플러시', 'FULL HOUSE': '풀하우스', 'FOUR OF A KIND': '포카드', 'STRAIGHT FLUSH': '스트레이트 플러시' };
  const SUIT_KO = { s: '스페이드', h: '하트', d: '다이아', c: '클로버' };
  const STREET = [['pre', '프리플랍', 0], ['flop', '플랍', 3], ['turn', '턴', 4], ['river', '리버', 5]];
  const PRESETS = [
    { nm: 'AA vs KK', d: '프리플랍 최강 대결', p: [['Ah', 'As'], ['Kc', 'Kd']], b: [] },
    { nm: 'AK vs QQ', d: '대표적인 코인플립', p: [['As', 'Kd'], ['Qh', 'Qc']], b: [] },
    { nm: 'AK vs AQ', d: '키커에 눌린 패', p: [['Ad', 'Kc'], ['As', 'Qh']], b: [] },
    { nm: '넛 플러시 드로우', d: '플랍 · 탑페어 상대', p: [['Ah', '5h'], ['Kd', 'Qs']], b: ['Kh', '8h', '2c'] },
    { nm: '양방 스트레이트 드로우', d: '플랍 · 오버페어 상대', p: [['9s', '8s'], ['Qh', 'Qd']], b: ['7c', '6d', '2h'] },
    { nm: '3명 올인', d: 'AK 수딧 · QQ · JT 수딧', p: [['As', 'Ks'], ['Qh', 'Qd'], ['Jc', 'Tc']], b: [] },
    { nm: 'KK vs 상위 10%', d: '강한 범위를 상대로', p: [['Ks', 'Kh'], [null, null]], pct: [100, 10], b: [] },
    { nm: 'AA vs 아무 패 3명', d: '인원이 늘면 승률은?', p: [['Ah', 'As'], [null, null], [null, null], [null, null]], b: [] }
  ];

  // ---------- 상태(이 기기에만 저장) ----------
  const blank = () => ({ n: 2, hands: Array.from({ length: MAXN }, () => [null, null]), pct: Array(MAXN).fill(100), board: [null, null, null, null, null], pot: '', call: '', hist: {} });
  const okCard = c => typeof c === 'string' && /^[2-9TJQKA][shdc]$/.test(c);
  function sanitize(v) {
    const s = blank();
    if (!v || typeof v !== 'object') return s;
    s.n = Math.min(MAXN, Math.max(2, +v.n || 2));
    const seen = new Set(), take = c => (okCard(c) && !seen.has(c) ? (seen.add(c), c) : null);
    for (let i = 0; i < MAXN; i++) { const h = (v.hands || [])[i] || []; s.hands[i] = [take(h[0]), take(h[1])]; s.pct[i] = PCTS.includes(+(v.pct || [])[i]) ? +v.pct[i] : 100; }
    for (let k = 0; k < 5; k++) s.board[k] = take((v.board || [])[k]);
    if (!s.board[0] || !s.board[1] || !s.board[2]) s.board = [s.board[0], s.board[1], s.board[2], null, null];
    else if (!s.board[3]) s.board[4] = null;
    s.pot = String(v.pot ?? '').slice(0, 9); s.call = String(v.call ?? '').slice(0, 9);
    s.hist = v.hist && typeof v.hist === 'object' ? v.hist : {};
    return s;
  }
  let st = (() => { try { return sanitize(JSON.parse(localStorage.getItem(LS_SIM) || 'null')); } catch (e) { return blank(); } })();
  const persist = () => { try { localStorage.setItem(LS_SIM, JSON.stringify(st)); } catch (e) { /* 저장 불가 환경 */ } };

  // ---------- 카드 칸 ----------
  const getSlot = id => (id[0] === 'b' ? st.board[+id.slice(1)] : st.hands[+id[1]][+id[3]]);
  function setSlot(id, v) {
    if (id[0] === 'b') {
      const k = +id.slice(1);
      st.board[k] = v;
      if (!v) { if (k <= 2) st.board[3] = st.board[4] = null; else if (k === 3) st.board[4] = null; }
    } else st.hands[+id[1]][+id[3]] = v;
  }
  function used(except) {
    const s = new Set();
    st.hands.slice(0, st.n).forEach((h, i) => h.forEach((c, j) => { if (c && except !== `p${i}c${j}`) s.add(c); }));
    st.board.forEach((c, k) => { if (c && except !== `b${k}`) s.add(c); });
    return s;
  }
  const freeCards = except => { const u = used(except), out = []; for (const r of E.RANKS) for (const s of E.SUITS) if (!u.has(r + s)) out.push(r + s); return out; };
  const pick1 = arr => arr[Math.floor(Math.random() * arr.length)];
  const boardN = () => st.board.filter(Boolean).length;
  const who = i => (i === 0 ? '나' : `상대 ${i}`);
  const slotName = id => {
    if (id[0] === 'p') return `${who(+id[1])} · ${+id[3] === 0 ? '첫' : '두'} 번째 카드`;
    const k = +id.slice(1); return k <= 2 ? `플랍 · ${k + 1}번째 카드` : k === 3 ? '턴 카드' : '리버 카드';
  };
  function cardBtn(id, o = {}) {
    const c = getSlot(id), big = id[0] === 'b';
    if (c) {
      const [g, col] = TableView.SUIT[c[1]];
      return `<button type="button" class="cs${big ? ' big' : ''}" data-slot="${id}" style="color:${col}" aria-label="${U.esc(slotName(id))}: ${SUIT_KO[c[1]]} ${TableView.RK(c[0])}"><span class="r">${TableView.RK(c[0])}</span><span class="s">${g}&#xFE0E;</span></button>`;
    }
    const rand = o.rand;
    return `<button type="button" class="cs${big ? ' big' : ''} ${rand ? 'rand' : 'empty'}" data-slot="${id}" aria-label="${U.esc(slotName(id))}: ${rand ? '무작위' : '비어 있음'}">${rand ? '?' : '+'}</button>`;
  }

  // ---------- 시작 패 정보 ----------
  function handClass(a, b) {
    const ra = E.RANKS.indexOf(a[0]), rb = E.RANKS.indexOf(b[0]);
    const [hi, lo] = ra >= rb ? [a, b] : [b, a];
    return hi[0] === lo[0] ? hi[0] + lo[0] : hi[0] + lo[0] + (hi[1] === lo[1] ? 's' : 'o');
  }
  function classTop(cls) {
    let tot = 0;
    for (const h of E.ORDER) { tot += h.length === 2 ? 6 : h[2] === 's' ? 4 : 12; if (h === cls) break; }
    return tot / 1326 * 100;
  }
  const showCls = h => h.replace(/T/g, '10');
  const pct1 = x => (x * 100).toFixed(1);
  const fmtTop = x => (x < 1 ? x.toFixed(1) : Math.round(x)) + '%';

  // ---------- 화면 ----------
  function rowSub(i) {
    const h = st.hands[i], nC = h.filter(Boolean).length;
    if (i === 0) {
      if (nC < 2) return '<span class="sub">카드 2장을 골라 주세요</span>';
      const b = st.board.filter(Boolean);
      if (b.length >= 3) { const L = PD.handLabel(h.concat(b)); return `<span class="sub">지금 <b>${HAND_KO[L.name] || L.name} ${U.esc(L.key)}</b></span>`; }
      const cls = handClass(h[0], h[1]);
      return `<span class="sub num">${showCls(cls)} · 시작 패 중 상위 ${fmtTop(classTop(cls))}</span>`;
    }
    if (nC === 2) return '<span class="sub">패를 지정함</span>';
    if (nC === 1) return '<span class="sub">한 장은 무작위</span>';
    const r = E.range(st.pct[i]);
    return `<label class="rsel"><span class="sr">상대 ${i} 범위</span><select data-pct="${i}">${PCTS.map(p => `<option value="${p}" ${st.pct[i] === p ? 'selected' : ''}>${p === 100 ? '모든 패' : `상위 ${p}%`}</option>`).join('')}</select></label>
      <span class="sub num" title="${U.esc(r.classes.map(showCls).join(' '))}">${st.pct[i] === 100 ? '1,326조합 중 무작위' : `${showCls(r.classes.slice(0, 3).join(' '))} 등 ${r.classes.length}종류`}</span>`;
  }
  function rowsHtml() {
    return Array.from({ length: st.n }, (_, i) => {
      const rand = i > 0 && !st.hands[i][0] && !st.hands[i][1];
      return `<div class="prow" style="--pc:${COL[i]}">
        <div class="pl"><b>${who(i)}</b>${rowSub(i)}</div>
        <div class="ph">${cardBtn(`p${i}c0`, { rand: i > 0 })}${cardBtn(`p${i}c1`, { rand: i > 0 })}</div>
        <div class="pr num" id="sim-r${i}"><b>—</b><span>${rand && st.pct[i] < 100 ? `상위 ${st.pct[i]}%` : ''}</span></div>
        <div class="pbar" aria-hidden="true"><i id="sim-b${i}"></i></div>
      </div>`;
    }).join('');
  }
  function boardHtml() {
    const n = boardN();
    const nextLb = n === 0 ? '플랍 깔기' : n < 3 ? '플랍 채우기' : n === 3 ? '턴 깔기' : n === 4 ? '리버 깔기' : '보드 완성';
    return `<div class="board">
        <div class="bgrp"><div class="cards">${cardBtn('b0')}${cardBtn('b1')}${cardBtn('b2')}</div><span>플랍</span></div>
        <div class="bgrp"><div class="cards">${cardBtn('b3')}</div><span>턴</span></div>
        <div class="bgrp"><div class="cards">${cardBtn('b4')}</div><span>리버</span></div>
      </div>
      <div class="row brow"><button class="btn btn-line" type="button" id="sim-next" ${n === 5 ? 'disabled' : ''}>${nextLb}</button><button class="btn btn-line" type="button" id="sim-bclear" ${n ? '' : 'disabled'}>보드 비우기</button></div>
      ${hiddenOpp() ? (n === 5 ? `<button class="btn btn-brass btn-block" type="button" id="sim-reveal">${revealRes && revealRes.sig === sigOf() ? '한 번 더 열어 보기' : '상대 패 열어 보기'}</button><div id="sim-rv">${revealHtml()}</div>`
        : '<p class="small muted" style="margin:0">리버까지 깔면 가려진 상대 패를 무작위로 한 번 열어 볼 수 있어요.</p>') : ''}`;
  }
  const streetName = () => { const n = boardN(); return n === 0 ? '프리플랍' : n < 3 ? '플랍 고르는 중' : n === 3 ? '플랍' : n === 4 ? '턴' : '리버'; };

  function html() {
    return `<section class="screen sim" id="sim-root">
      <div><div class="eyebrow">승률 시뮬레이터</div><h2 class="title">상황을 만들고 승률 보기</h2>
        <p class="small muted" style="margin:6px 0 0">카드 칸을 눌러 패와 보드를 고르세요. 상대 카드를 비워 두면 고른 범위 안의 아무 패로 계산해요.</p></div>
      <div class="presets" role="group" aria-label="빠른 예시">${PRESETS.map((p, i) => `<button type="button" class="pchip" data-preset="${i}"><b>${U.esc(p.nm)}</b><span>${U.esc(p.d)}</span></button>`).join('')}</div>
      <div class="panel pad simbox">
        <div class="spread"><span class="eyebrow">인원 (나 포함)</span>
          <div class="tabs nseg" role="radiogroup" aria-label="인원">${[2, 3, 4, 5, 6, 7, 8].map(k => `<button type="button" role="radio" data-n="${k}" aria-checked="${st.n === k}" aria-selected="${st.n === k}">${k}</button>`).join('')}</div></div>
        <div class="plist">${rowsHtml()}</div>
        <div class="row prow-act"><button class="btn btn-line" type="button" id="sim-rme">내 패 무작위</button><button class="btn btn-line" type="button" id="sim-reset">모두 비우기</button></div>
      </div>
      <div class="panel pad simbox">
        <div class="spread"><span class="eyebrow">보드</span><span class="small muted" id="sim-street">${streetName()}</span></div>
        ${boardHtml()}
      </div>
      <div class="panel pad simsum" id="sim-sum"></div>
      <div class="panel pad simbox"><div class="spread"><span class="eyebrow">스트리트별 내 승률</span><span class="small muted">보드를 깔 때마다 기록</span></div><div class="hist" id="sim-hist"></div></div>
      <div class="panel pad simbox">
        <div class="eyebrow">팟오즈와 비교</div>
        <p class="small muted" style="margin:0">상대 베팅에 콜할지 정할 때 쓰세요. BB든 칩이든 같은 단위로 넣으면 돼요.</p>
        <div class="oddsin">
          <label><span>팟 <small>상대 베팅 포함</small></span><input id="sim-pot" inputmode="decimal" autocomplete="off" placeholder="예: 12" value="${U.esc(st.pot)}"></label>
          <label><span>내가 낼 콜 금액</span><input id="sim-call" inputmode="decimal" autocomplete="off" placeholder="예: 4" value="${U.esc(st.call)}"></label>
        </div>
        <div id="sim-odds"></div>
      </div>
      <div class="panel pad simbox"><div class="spread"><span class="eyebrow">리버까지 내 족보 확률</span><span class="small muted" id="sim-catnote"></span></div><div class="cats" id="sim-cats"></div></div>
    </section>`;
  }

  // ---------- 결과 그리기 ----------
  let job = null, timer = null, last = null;
  const sigOf = () => JSON.stringify([st.n, st.hands.slice(0, st.n), st.pct.slice(0, st.n), st.board]);
  const psOf = () => JSON.stringify([st.n, st.hands.slice(0, st.n), st.pct.slice(0, st.n)]);
  const $ = id => document.getElementById(id);
  const alive = () => App.ui.view === 'sim' && !!$('sim-root');

  function paintRows(r) {
    for (let i = 0; i < st.n; i++) {
      const el = $('sim-r' + i), bar = $('sim-b' + i);
      if (!el) continue;
      const p = r && !r.err && r.players[i];
      el.classList.toggle('stale', !!(r && !r.done));
      if (!p) { el.innerHTML = '<b>—</b><span></span>'; if (bar) bar.style.width = '0'; continue; }
      el.innerHTML = `<b>${pct1(p.eq)}%</b><span>승 ${pct1(p.win)} · 무 ${pct1(p.tie)}</span>`;
      if (bar) bar.style.width = (p.eq * 100).toFixed(2) + '%';
    }
  }
  function paintSum(r, stale) {
    const el = $('sim-sum'); if (!el) return;
    el.classList.toggle('stale', !!stale);
    if (!r) { el.innerHTML = `<div class="eyebrow">내 승률</div><p class="muted" style="margin:6px 0 0">계산 중…</p>`; return; }
    if (r.err) { el.innerHTML = `<div class="eyebrow">내 승률</div><p style="margin:6px 0 0;color:var(--amber)">${U.esc(r.err)}</p>`; return; }
    const me = r.players[0];
    let method;
    if (stale) method = '바뀐 상황으로 다시 계산 중…';
    else if (!r.done) method = `계산 중… ${Math.round(r.progress * 100)}%`;
    else if (r.mode === 'exact') {
      const hidden = st.hands.slice(1, st.n).some(h => !h[0] || !h[1]);
      method = `${hidden ? '상대 패와 남은 보드' : '남은 보드'} ${r.total.toLocaleString('ko-KR')}가지를 모두 계산한 정확한 값이에요.`;
    } else {
      const moe = 1.96 * Math.sqrt(Math.max(me.eq * (1 - me.eq), .01) / Math.max(r.n, 1)) * 100;
      method = `무작위로 ${r.n.toLocaleString('ko-KR')}판을 돌려 본 값이에요. 오차는 약 ±${moe < .1 ? '0.1' : moe.toFixed(1)}%p예요.`;
    }
    el.innerHTML = `<div class="sumtop"><div><div class="eyebrow">내 승률 · ${streetName()}</div><div class="bignum num">${pct1(me.eq)}<small>%</small></div>
        <div class="small muted num">혼자 이길 확률 ${pct1(me.win)}% · 비길 확률 ${pct1(me.tie)}%</div></div>
        <div class="vs num">${st.n - 1}명 상대</div></div>
      <div class="prog" aria-hidden="true"><i style="width:${stale ? 0 : (r.progress * 100).toFixed(1)}%"></i></div>
      <p class="small muted" style="margin:0">${method} 비기면 팟을 나눠 가진 만큼 승률에 넣었어요.</p>`;
  }
  function paintHist(r) {
    const el = $('sim-hist'); if (!el) return;
    const ps = psOf(), b = st.board.filter(Boolean), cur = boardN();
    el.innerHTML = STREET.map(([k, nm, L]) => {
      const e = st.hist.ps === ps && st.hist[k] && L <= cur && st.hist[k].b === b.slice(0, L).join('') ? st.hist[k] : null;
      const isCur = L === cur;
      const v = isCur && r && !r.err && r.done ? r.players[0].eq : e ? e.eq : null;
      return `<div class="hs${isCur ? ' cur' : ''}"><span>${nm}</span><b class="num">${v == null ? '—' : pct1(v) + '%'}</b></div>`;
    }).join('');
  }
  function paintOdds(r) {
    const el = $('sim-odds'); if (!el) return;
    const pot = parseFloat(String(st.pot).replace(/,/g, '')), call = parseFloat(String(st.call).replace(/,/g, ''));
    if (!(pot > 0) || !(call > 0)) { el.innerHTML = `<p class="small muted" style="margin:0">팟과 콜 금액을 넣으면 콜에 필요한 승률과 비교해 드려요.</p>`; return; }
    const need = call / (pot + call);
    const me = r && !r.err ? r.players[0].eq : null;
    const fmtN = x => (Math.round(x * 10) / 10).toLocaleString('ko-KR');
    let verdict = '';
    if (me != null) {
      const ev = me * (pot + call) - call, diff = (me - need) * 100;
      verdict = Math.abs(diff) < 0.5
        ? `<div class="odv eq"><b>거의 본전이에요</b><span class="num">콜 한 번에 평균 ${ev >= 0 ? '+' : '−'}${fmtN(Math.abs(ev))}</span></div>`
        : diff > 0
          ? `<div class="odv ok"><b>콜이 이득이에요</b><span class="num">필요보다 ${diff.toFixed(1)}%p 높음 · 콜 한 번에 평균 +${fmtN(ev)}</span></div>`
          : `<div class="odv no"><b>폴드가 나아요</b><span class="num">필요보다 ${(-diff).toFixed(1)}%p 낮음 · 콜 한 번에 평균 −${fmtN(-ev)}</span></div>`;
    }
    el.innerHTML = `<div class="oddsout num"><div><span>콜에 필요한 승률</span><b>${pct1(need)}%</b></div><div><span>내 승률</span><b>${me == null ? '—' : pct1(me) + '%'}</b></div></div>${verdict}
      <p class="small muted" style="margin:0">필요 승률 = 콜 ÷ (팟 + 콜). 앞으로 더 오갈 베팅은 넣지 않은 값이에요.</p>`;
  }
  function paintCats(r, stale) {
    const el = $('sim-cats'), note = $('sim-catnote'); if (!el) return;
    el.classList.toggle('stale', !!stale);
    if (!r || r.err) { el.innerHTML = `<p class="small muted" style="margin:0">${r ? '내 카드를 고르면 보여 드려요.' : '계산 중…'}</p>`; if (note) note.textContent = ''; return; }
    if (note) note.textContent = boardN() === 5 ? '완성된 족보' : '남은 카드까지 다 받았을 때';
    el.innerHTML = r.cat.map((x, k) => ({ x, k })).reverse().filter(o => o.x > 0 || o.k <= 6).map(({ x, k }) =>
      `<div class="cat"><span>${E.CAT_KO[k]}</span><div class="cbar" aria-hidden="true"><i style="width:${(x * 100).toFixed(2)}%"></i></div><b class="num">${x > 0 && x < .001 ? '&lt;0.1%' : pct1(x) + '%'}</b></div>`).join('');
  }
  function paint(r) { paintRows(r); paintSum(r); paintHist(r); paintOdds(r); paintCats(r); }

  function record(r) {
    const b = st.board.filter(Boolean), s = STREET.find(x => x[2] === b.length);
    if (!s) return;
    const ps = psOf();
    if (st.hist.ps !== ps) st.hist = { ps };
    st.hist[s[0]] = { eq: r.players[0].eq, b: b.join('') };
    persist();
  }
  function schedule(delay = 140) {
    clearTimeout(timer);
    if (job) { job.cancel(); job = null; }
    const sig = sigOf();
    if (last && last.sig === sig) { paint(last.res); return; }
    const prev = last && !last.res.err ? last.res : null;
    paintRows(prev ? { ...prev, done: false } : null);
    paintSum(prev, !!prev); paintHist(null); paintOdds(null); paintCats(prev, true);
    timer = setTimeout(() => {
      job = E.run({ players: st.hands.slice(0, st.n).map((h, i) => ({ c: h.slice(), pct: i ? st.pct[i] : 100 })), board: st.board.filter(Boolean) }, {
        onProgress: r => { if (!alive()) { if (job) job.cancel(); job = null; return; } paint(r); },
        onDone: r => { job = null; last = { sig, res: r }; if (!r.err) record(r); if (alive()) paint(r); }
      });
    }, delay);
  }

  // ---------- 상대 패 열어 보기(리버에서 가려진 패를 레인지 안에서 한 번 뽑기) ----------
  let revealRes = null;
  const hiddenOpp = () => st.hands.slice(1, st.n).some(h => !h[0] || !h[1]);
  function drawReveal() {
    for (let attempt = 0; attempt < 60; attempt++) {
      const taken = used(), hands = [];
      let ok = true;
      for (let i = 0; i < st.n && ok; i++) {
        const h = st.hands[i];
        if (h[0] && h[1]) { hands.push({ c: h.slice(), hid: false }); continue; }
        let c;
        if (h[0] || h[1]) { const k = h[0] || h[1], free = []; for (const r of E.RANKS) for (const s of E.SUITS) if (!taken.has(r + s)) free.push(r + s); c = [k, pick1(free)]; }
        else {
          const cs = E.range(st.pct[i]).combos.filter(([a, b]) => !taken.has(E.toStr(a)) && !taken.has(E.toStr(b)));
          if (!cs.length) { ok = false; break; }
          c = pick1(cs).map(E.toStr);
        }
        c.forEach(x => taken.add(x));
        hands.push({ c, hid: true });
      }
      if (!ok) continue;
      const b = st.board.filter(Boolean);
      const vals = hands.map(o => E.evalCards(Int32Array.from(o.c.concat(b).map(E.toInt)), 7));
      const best = Math.max(...vals), nb = vals.filter(x => x === best).length;
      return { sig: sigOf(), hands: hands.map((o, i) => ({ ...o, v: vals[i], win: vals[i] === best, split: nb > 1, L: PD.handLabel(o.c.concat(b)) })) };
    }
    return { sig: sigOf(), err: '레인지가 겹쳐서 상대 패를 뽑지 못했어요.' };
  }
  function revealHtml() {
    const r = revealRes;
    if (!r || r.sig !== sigOf()) return '';
    if (r.err) return `<p class="small" style="margin:0;color:var(--amber)">${U.esc(r.err)}</p>`;
    const me = r.hands[0], same = o => o.L.name === me.L.name && o.L.key === me.L.key;
    const kick = me.win ? !me.split && r.hands.some(o => !o.win && same(o)) : r.hands.some(o => o.win && same(o));
    const line = (me.win ? (me.split ? '이번엔 팟을 나눠 가졌어요' : '이번엔 내가 이겼어요') : '이번엔 내가 졌어요') + (kick ? ' · 키커 차이' : '');
    return `<div class="reveal"><div class="spread"><b class="rvt ${me.win ? 'ok' : 'no'}">${line}</b><span class="small muted">무작위로 한 번 뽑은 예</span></div>
      ${r.hands.map((o, i) => `<div class="rvrow${o.win ? ' win' : ''}" style="--pc:${COL[i]}"><span class="nm">${who(i)}</span>${TableView.miniCards(o.c)}<span class="hn">${HAND_KO[o.L.name] || o.L.name} ${U.esc(o.L.key)}</span><span class="wl">${o.win ? (o.split ? '무' : '승') : ''}</span></div>`).join('')}
      <p class="small muted" style="margin:0">승률은 이런 판을 수없이 반복했을 때 내가 가져가는 몫이에요. 다시 열면 다른 경우가 나와요.</p></div>`;
  }

  // ---------- 카드 고르기 ----------
  function nextSlot(id) {
    if (id[0] === 'p') { const o = `p${id[1]}c${1 - +id[3]}`; return getSlot(o) ? null : o; }
    const k = +id.slice(1);
    if (k <= 2) for (const kk of [0, 1, 2]) if (!st.board[kk]) return 'b' + kk;
    return null;
  }
  function openPicker(id) {
    if (id[0] === 'b') {
      const k = +id.slice(1);
      if (k === 3 && boardN() < 3) { U.toast('플랍 3장을 먼저 골라 주세요'); return; }
      if (k === 4 && !st.board[3]) { U.toast('턴 카드를 먼저 골라 주세요'); return; }
    }
    const u = used(id), cur = getSlot(id);
    const grp = id[0] === 'p' ? [`p${id[1]}c0`, `p${id[1]}c1`] : +id.slice(1) <= 2 ? ['b0', 'b1', 'b2'] : [id];
    const prev = grp.map(g => {
      const c = getSlot(g), on = g === id ? ' on' : '';
      if (!c) return `<span class="pv empty${on}">${g === id ? '?' : ''}</span>`;
      const [gl, col] = TableView.SUIT[c[1]];
      return `<span class="pv${on}" style="color:${col}">${TableView.RK(c[0])}${gl}&#xFE0E;</span>`;
    }).join('');
    const cells = E.SUITS.split('').map(s => 'AKQJT98765432'.split('').map(r => {
      const c = r + s, [gl, col] = TableView.SUIT[s];
      return `<button type="button" class="pk" data-c="${c}" style="color:${col}" ${u.has(c) ? 'disabled' : ''} aria-pressed="${cur === c}" aria-label="${SUIT_KO[s]} ${TableView.RK(r)}"><span>${TableView.RK(r)}</span><span>${gl}&#xFE0E;</span></button>`;
    }).join('')).join('');
    const v = Layer.open(`<div class="picker">
      <div class="pk-head"><div><b>${U.esc(slotName(id))}</b><div class="pvs">${prev}</div></div><button class="adx" type="button" id="pk-x">닫기</button></div>
      <div class="pk-grid">${cells}</div>
      <div class="pk-foot"><button class="btn btn-line" type="button" id="pk-rand">무작위 카드</button><button class="btn btn-line" type="button" id="pk-clear" ${cur ? '' : 'disabled'}>이 칸 비우기</button></div>
    </div>`, '카드 고르기');
    v.classList.add('sheetveil');
    v.onclick = e => { if (e.target === v) Layer.close(); };
    U.$('#pk-x', v).onclick = Layer.close;
    const choose = c => {
      setSlot(id, c); persist(); App.render();
      const nx = c && nextSlot(id);
      if (nx) openPicker(nx); else Layer.close();
    };
    U.$$('.pk', v).forEach(b => b.onclick = () => choose(b.dataset.c));
    U.$('#pk-rand', v).onclick = () => choose(pick1(freeCards(id)));
    U.$('#pk-clear', v).onclick = () => choose(null);
    const first = U.$('.pk[aria-pressed="true"]', v) || U.$('.pk:not([disabled])', v);
    if (first) first.focus({ preventScroll: true });
  }

  // ---------- 동작 ----------
  function applyPreset(p) {
    st.n = p.p.length;
    st.hands = Array.from({ length: MAXN }, (_, i) => (p.p[i] ? p.p[i].slice() : [null, null]));
    st.pct = Array.from({ length: MAXN }, (_, i) => (p.pct && p.pct[i]) || 100);
    st.board = [0, 1, 2, 3, 4].map(k => p.b[k] || null);
    persist(); App.render();
  }
  function bind(el) {
    U.$$('[data-preset]', el).forEach(b => b.onclick = () => applyPreset(PRESETS[+b.dataset.preset]));
    U.$$('[data-n]', el).forEach(b => b.onclick = () => {
      const k = +b.dataset.n;
      for (let i = k; i < MAXN; i++) { st.hands[i] = [null, null]; st.pct[i] = 100; }
      st.n = k; persist(); App.render();
    });
    U.$$('[data-slot]', el).forEach(b => b.onclick = () => openPicker(b.dataset.slot));
    U.$$('[data-pct]', el).forEach(s => s.onchange = () => { st.pct[+s.dataset.pct] = +s.value; persist(); App.render(); });
    U.$('#sim-rme', el).onclick = () => {
      st.hands[0] = [null, null];
      const a = pick1(freeCards()); st.hands[0][0] = a;
      st.hands[0][1] = pick1(freeCards());
      persist(); App.render();
    };
    U.$('#sim-reset', el).onclick = () => { const keep = st.n; st = blank(); st.n = keep; last = null; persist(); App.render(); };
    U.$('#sim-next', el).onclick = () => {
      const n = boardN(), upto = n < 3 ? 3 : n + 1;
      for (let k = 0; k < upto; k++) if (!st.board[k]) st.board[k] = pick1(freeCards());
      persist(); App.render();
    };
    U.$('#sim-bclear', el).onclick = () => { st.board = [null, null, null, null, null]; persist(); App.render(); };
    const rv = U.$('#sim-reveal', el);
    if (rv) rv.onclick = () => { revealRes = drawReveal(); U.$('#sim-rv', el).innerHTML = revealHtml(); rv.textContent = '한 번 더 열어 보기'; };
    const onOdds = () => { st.pot = U.$('#sim-pot', el).value.slice(0, 9); st.call = U.$('#sim-call', el).value.slice(0, 9); persist(); paintOdds(last && last.sig === sigOf() ? last.res : null); };
    U.$('#sim-pot', el).oninput = onOdds; U.$('#sim-call', el).oninput = onOdds;
    schedule();
  }

  return { html, bind, state: () => st, PRESETS };
})();
