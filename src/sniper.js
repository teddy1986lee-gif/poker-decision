/* ===== 저격 홀덤: 미나와 1:1 =====
 * 넷플릭스 〈데블스 플랜: 데스룸〉 감옥 매치의 규칙을 바탕으로 한 모드.
 * 1~10 숫자 카드 4벌(40장, 무늬 없음) · 개인 2장 + 공용 4장 · 베팅 2번 · 공개 전 저격.
 * 저격: '숫자 + 족보'를 선언하면 그 족보를 가진 손패(선언한 사람 포함)는 최하위가 된다.
 */
const Sniper = (() => {
  const START = 60, GOAL = 75, ANTE = 1;
  const CAT = ['하이', '원페어', '투페어', '트리플', '스트레이트', '풀하우스', '포카드'];

  // ---------- 족보 판정 (6장 중 최고 5장) ----------
  function best(cards) {
    const c = Array(11).fill(0); cards.forEach(n => c[n]++);
    const nums = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const has = k => nums.filter(n => c[n] >= k);
    const kick = (ex, k) => cards.filter(n => !ex.includes(n)).sort((a, b) => b - a).slice(0, k);
    const q = has(4);
    if (q.length) return { cat: 6, key: [q[0], ...kick([q[0]], 1)] };
    const t = has(3);
    if (t.length) {
      const p = nums.filter(n => n !== t[0] && c[n] >= 2);
      if (p.length) return { cat: 5, key: [t[0], p[0]] };
    }
    for (let h = 10; h >= 5; h--) if ([0, 1, 2, 3, 4].every(d => c[h - d])) return { cat: 4, key: [h] };
    if (t.length) return { cat: 3, key: [t[0], ...kick([t[0]], 2)] };
    const p = has(2);
    if (p.length >= 2) return { cat: 2, key: [p[0], p[1], ...kick([p[0], p[1]], 1)] };
    if (p.length) return { cat: 1, key: [p[0], ...kick([p[0]], 3)] };
    return { cat: 0, key: kick([], 5) };
  }
  const cmpKey = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; };
  const cmpHand = (a, b) => (a.cat - b.cat) || cmpKey(a.key, b.key);
  const declOf = h => ({ cat: h.cat, top: h.key[0] });
  const declNm = d => `${d.top} ${CAT[d.cat]}`;
  const hit = (h, d) => d && h.cat === d.cat && h.key[0] === d.top;
  /** 저격을 반영한 승부: 1 = a 승, -1 = b 승, 0 = 무승부(팟 나눔) */
  function judge(ha, hb, holeA, holeB, decls) {
    const sa = decls.some(d => hit(ha, d)), sb = decls.some(d => hit(hb, d));
    if (sa && sb) return { r: 0, sa, sb };
    if (sa !== sb) return { r: sa ? -1 : 1, sa, sb };
    const c = cmpHand(ha, hb); if (c) return { r: Math.sign(c), sa, sb };
    const mx = Math.max(...holeA) - Math.max(...holeB); if (mx) return { r: Math.sign(mx), sa, sb };
    const sm = holeA[0] + holeA[1] - holeB[0] - holeB[1]; if (sm) return { r: Math.sign(sm), sa, sb };
    return { r: 0, sa, sb };
  }

  // ---------- 덱 ----------
  const newDeck = () => { const d = []; for (let n = 1; n <= 10; n++) for (let k = 0; k < 4; k++) d.push(n); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
  function unseen(known) { const c = Array(11).fill(4); known.forEach(n => c[n]--); const out = []; for (let n = 1; n <= 10; n++) for (let k = 0; k < c[n]; k++) out.push(n); return out; }

  // ---------- 미나 AI ----------
  /** 남은 카드로 몬테카를로: 미나 승률(저격 제외) */
  function equity(hole, board, N = 500) {
    const pool = unseen([...hole, ...board]); let w = 0;
    for (let s = 0; s < N; s++) {
      const a = pool.slice(); const take = () => a.splice(Math.floor(Math.random() * a.length), 1)[0];
      const opp = [take(), take()], b = board.slice(); while (b.length < 4) b.push(take());
      const c = cmpHand(best([...hole, ...b]), best([...opp, ...b]));
      w += c > 0 ? 1 : c === 0 ? 0.5 : 0;
    }
    return w / N;
  }
  /** 상대가 가질 수 있는 족보 분포(내 카드·보드 제외, 공격성 가중) */
  function rangeDist(myHole, board, aggr = 0, onlyBeating = false) {
    const pool = unseen([...myHole, ...board]), mine = best([...myHole, ...board]);
    const tally = new Map(); let tot = 0;
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) {
      const h = best([pool[i], pool[j], ...board]);
      if (onlyBeating && cmpHand(h, mine) <= 0) continue;
      const w = 1 + aggr * h.cat / 2;
      const k = h.cat + ':' + h.key[0];
      tally.set(k, (tally.get(k) || 0) + w); tot += w;
    }
    const all = (() => { let t = 0; for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) t++; return t; })();
    return [...tally.entries()].map(([k, w]) => { const [cat, top] = k.split(':').map(Number); return { cat, top, p: w / tot, share: onlyBeating ? tot / all : 1 }; }).sort((a, b) => b.p - a.p);
  }
  function aiSnipe(g) {
    const mine = declOf(best([...g.hole.o, ...g.board]));
    const aggr = Math.min(2, g.commitP / Math.max(1, g.pot / 2));
    const dist = rangeDist(g.hole.o, g.board, aggr, true).filter(d => !(d.cat === mine.cat && d.top === mine.top));
    const already = g.decls.map(d => d.cat + ':' + d.top);
    const cand = dist.filter(d => !already.includes(d.cat + ':' + d.top));
    if (!cand.length || Math.random() < 0.1) return null; // 가끔은 저격을 쉰다
    const pick = cand[Math.random() < 0.25 && cand[1] ? 1 : 0]; // 늘 정답만 고르지는 않게
    return { cat: pick.cat, top: pick.top };
  }
  function aiBet(g) {
    const e = equity(g.hole.o, g.board), toCall = g.bet.p - g.bet.o, room = g.cap - g.commit.o;
    const pot = g.pot, r = Math.random();
    const size = f => Math.max(1, Math.min(room - toCall, Math.round(pot * f)));
    if (toCall <= 0) {
      if (e > 0.72 && room > 0) return { t: 'bet', n: size(r < 0.3 ? 1.2 : 0.7) };
      if (e > 0.55 && r < 0.55 && room > 0) return { t: 'bet', n: size(0.5) };
      if (e < 0.3 && r < 0.14 && room > 0) return { t: 'bet', n: size(0.6) }; // 블러프
      return { t: 'check' };
    }
    const odds = toCall / (pot + toCall);
    if (e > 0.78 && room > toCall && r < 0.6) return { t: 'raise', n: size(0.9) };
    if (e > odds + 0.04 || (r < 0.08 && toCall <= 3)) return { t: 'call' };
    return { t: 'fold' };
  }

  // ---------- 미나 대사 ----------
  const SAY = {
    start: { early: ['오늘은 딜러 말고 상대로 앉을게요. 봐주는 거 없어요.', '저격 홀덤, 해 보셨어요? 눈치 싸움이에요.'], late: ['오늘은 내가 상대야. 봐주는 거 없다?', '저격 홀덤 한 판. 지는 사람이 커피 사기.'] },
    bet: { early: ['이 정도는 받아 주셔야죠.', '음… 조금 올려 볼게요.'], late: ['받을 거지?', '이번엔 내가 좀 세다.'] },
    check: { early: ['저는 체크요.', '일단 지켜볼게요.'], late: ['체크. 네 차례야.', '음, 넘길게.'] },
    call: { early: ['콜할게요.', '따라갈게요.'], late: ['콜. 블러프면 혼난다.', '받아 줄게.'] },
    fold: { early: ['이번 판은 양보할게요.', '…접을게요.'], late: ['이번 건 줄게. 다음엔 안 돼.', '폴드. 운 좋았다.'] },
    snipe: { early: ['{d}, 저격할게요.', '제 생각엔… {d}.'], late: ['{d}. 맞지?', '{d} 저격. 표정 봤어.'] },
    pass: { early: ['저격은 패스할게요.'], late: ['이번엔 저격 안 해.'] },
    winHand: { early: ['이번 판은 제 거예요.', '후훗, 읽혔어요.'], late: ['내가 이겼다.', '이번 건 내 거.'] },
    loseHand: { early: ['와… 졌다. 잘하시네요.', '이걸 맞혀요?'], late: ['칫, 졌다.', '너 진짜 늘었다.'] },
    sniped: { early: ['헉, 그걸 어떻게 알았어요?', '저격당했다…'], late: ['어떻게 알았어?!', '너… 내 표정 읽었지.'] }
  };
  const say = (k, d) => { const ph = Love.st().lv >= 3 ? 'late' : 'early', a = SAY[k][ph]; return a[Math.floor(Math.random() * a.length)].replace('{d}', d || ''); };

  // ---------- 진행 ----------
  let g = null; // 현재 대결
  function newMatch() { g = { stack: { p: START, o: START }, hand: 0, first: Math.random() < 0.5 ? 'p' : 'o', over: null, said: say('start'), log: [] }; dealHand(); }
  function dealHand() {
    const deck = newDeck();
    g.hand++; g.first = g.hand === 1 ? g.first : (g.first === 'p' ? 'o' : 'p');
    g.deck = deck; g.hole = { p: [deck.pop(), deck.pop()], o: [deck.pop(), deck.pop()] }; g.board = [deck.pop(), deck.pop()];
    g.cap = Math.min(g.stack.p, g.stack.o); // 가장 적은 스택까지만 걸 수 있다
    g.commit = { p: 0, o: 0 }; g.bet = { p: 0, o: 0 }; g.pot = 0; g.decls = []; g.snipeBy = {}; g.result = null; g.show = null;
    ['p', 'o'].forEach(x => { g.stack[x] -= ANTE; g.commit[x] += ANTE; g.pot += ANTE; });
    g.round = 1; g.phase = 'bet'; g.acted = { p: false, o: false }; g.toAct = g.first;
    g.commitP = 0; g.log = [`${g.hand}번째 핸드 · 선 ${g.first === 'p' ? '나' : '미나'} · 기본 베팅 1씩`];
    if (g.cap - ANTE <= 0) { g.round = 2; while (g.board.length < 4) g.board.push(g.deck.pop()); startSnipe(); }
  }
  const other = x => (x === 'p' ? 'o' : 'p');
  const allIn = () => g.commit.p >= g.cap || g.commit.o >= g.cap;
  function pay(x, n) { n = Math.max(0, Math.min(n, g.cap - g.commit[x])); g.stack[x] -= n; g.commit[x] += n; g.bet[x] += n; g.pot += n; if (x === 'p') g.commitP += n; return n; }
  function act(x, a) {
    const y = other(x), who = x === 'p' ? '나' : '미나';
    if (a.t === 'fold') { g.log.push(`${who}: 폴드`); finish(y, `${x === 'p' ? '내가' : '미나가'} 폴드`); return; }
    if (a.t === 'check') g.log.push(`${who}: 체크`);
    if (a.t === 'call') { const n = pay(x, g.bet[y] - g.bet[x]); g.log.push(`${who}: 콜 ${n}`); }
    if (a.t === 'bet' || a.t === 'raise') {
      const call = pay(x, g.bet[y] - g.bet[x]); const n = pay(x, a.n);
      g.log.push(`${who}: ${call ? `콜 ${call} + 레이즈 ${n}` : `베팅 ${n}`}`); g.acted[y] = false;
    }
    g.acted[x] = true;
    if (x === 'o') g.said = say(a.t === 'raise' ? 'bet' : a.t);
    const even = g.bet.p === g.bet.o;
    if (even && g.acted.p && g.acted.o) return endRound();
    if (even && allIn()) return endRound();
    if (!even && g.commit[y] >= g.cap) return endRound(); // 상대가 이미 올인: 더 받을 수 없음
    g.toAct = y; tick();
  }
  function endRound() {
    if (g.round === 1 && !allIn()) {
      g.round = 2; g.board.push(g.deck.pop(), g.deck.pop()); g.bet = { p: 0, o: 0 }; g.acted = { p: false, o: false }; g.toAct = g.first;
      g.log.push('공용 카드 2장 추가 공개'); return tick();
    }
    while (g.board.length < 4) g.board.push(g.deck.pop());
    startSnipe();
  }
  function startSnipe() {
    const mine = declOf(best([...g.hole.p, ...g.board]));
    pick = { cat: 1, top: Math.max(...g.board) };
    if (pick.cat === mine.cat && pick.top === mine.top) pick = { cat: 3, top: pick.top };
    g.phase = 'snipe'; g.toAct = g.first; g.log.push('저격 시간'); tick(); }
  function snipe(x, d) {
    const who = x === 'p' ? '나' : '미나';
    g.snipeBy[x] = d || 'pass';
    if (d) { g.decls.push(d); g.log.push(`${who}: ${declNm(d)} 저격`); } else g.log.push(`${who}: 저격 패스`);
    if (x === 'o') g.said = d ? say('snipe', declNm(d)) : say('pass');
    if (g.snipeBy.p && g.snipeBy.o) return showdown();
    g.toAct = other(x); tick();
  }
  function showdown() {
    const hp = best([...g.hole.p, ...g.board]), ho = best([...g.hole.o, ...g.board]);
    const j = judge(hp, ho, g.hole.p, g.hole.o, g.decls);
    g.show = { hp, ho, j };
    finish(j.r > 0 ? 'p' : j.r < 0 ? 'o' : null, j.r === 0 ? '무승부 · 팟을 나눠요' : '');
    if (j.sb) g.said = say('sniped');
  }
  function finish(w, why) {
    const pot = g.pot;
    if (w) g.stack[w] += pot; else { const h = Math.floor(pot / 2); g.stack.p += h; g.stack.o += pot - h; }
    g.pot = 0; g.phase = 'done';
    g.result = { w, pot, why };
    if (w === 'o' && !(g.show && g.show.j.sb)) g.said = say('winHand');
    if (w === 'p') g.said = g.show && g.show.j.sb ? say('sniped') : say('loseHand');
    g.log.push(w ? `${w === 'p' ? '내가' : '미나가'} 팟 ${pot} 획득${why ? ' · ' + why : ''}` : why);
    // 대결 종료 판정
    if (g.stack.p >= GOAL || g.stack.o <= 0) g.over = 'win';
    else if (g.stack.o >= GOAL || g.stack.p <= 0) g.over = 'lose';
    if (g.over) reward(g.over === 'win');
    App.render();
  }
  let aiTimer = null;
  function tick() { App.render(); }
  /** 미나 차례면 한 번만 예약(화면이 다시 그려질 때마다 호출돼도 중복 없음) */
  function scheduleAI() {
    if (aiTimer || !g || g.over || g.toAct !== 'o' || !(g.phase === 'bet' || g.phase === 'snipe')) return;
    aiTimer = setTimeout(() => {
      aiTimer = null;
      if (!g || g.toAct !== 'o') return;
      if (g.phase === 'bet') act('o', aiBet(g)); else if (g.phase === 'snipe') snipe('o', aiSnipe(g));
    }, 750);
  }

  // ---------- 보상 (하루 3판까지) ----------
  function reward(win) {
    const l = Love.st(); l.sniper = l.sniper || { w: 0, l: 0, d: '', n: 0 };
    const s = l.sniper; if (s.d !== Store.dayKey()) { s.d = Store.dayKey(); s.n = 0; }
    win ? s.w++ : s.l++;
    g.reward = null;
    if (s.n < 3) { s.n++; g.reward = win ? { c: 200, h: 8 } : { c: 0, h: 2 }; Love.addReward(g.reward.c, g.reward.h); }
    Store.save();
  }

  // ---------- 화면 ----------
  const card = (n, cls = '') => `<span class="sn-card ${cls}">${n == null ? '' : n}</span>`;
  const back = () => '<span class="sn-card back" aria-label="뒷면"></span>';
  let pick = { cat: 1, top: 10 };
  function actionsHtml() {
    if (g.over) {
      const r = g.reward;
      return `<div class="sn-over ${g.over}"><b>${g.over === 'win' ? '대결 승리!' : '대결 패배'}</b><p>${g.over === 'win' ? `칩 ${GOAL}개에 먼저 도달했어요.` : '미나가 먼저 목표에 닿았어요.'}</p>
        ${r ? `<div class="lv-gain">${r.c ? `<span class="lv-tag">칩 +${r.c}</span>` : ''}<span class="lv-tag heart">하트 +${r.h}</span></div>` : '<small>오늘 보상은 모두 받았어요(하루 3판).</small>'}
        <div class="row"><button class="btn btn-ink" type="button" id="sn-new">한 판 더</button><button class="btn btn-line" type="button" data-go="mina">미나에게</button></div></div>`;
    }
    if (g.phase === 'done') return `<div class="sn-row"><span class="sn-res">${g.result.w ? (g.result.w === 'p' ? `팟 ${g.result.pot} 획득!` : `미나가 팟 ${g.result.pot} 가져감`) : U.esc(g.result.why)}</span><button class="btn btn-ink" type="button" id="sn-next">다음 핸드 ▸</button></div>`;
    if (g.toAct !== 'p') return `<div class="sn-row"><span class="sn-wait">미나가 생각 중…</span></div>`;
    if (g.phase === 'snipe') {
      const cats = CAT.map((nm, i) => `<button type="button" class="sn-chip${pick.cat === i ? ' on' : ''}" data-cat="${i}">${nm}</button>`).join('');
      const tops = Array.from({ length: 10 }, (_, i) => 10 - i).filter(n => pick.cat !== 4 || n >= 5).map(n => `<button type="button" class="sn-chip num${pick.top === n ? ' on' : ''}" data-top="${n}">${n}</button>`).join('');
      const mine = declOf(best([...g.hole.p, ...g.board]));
      const self = pick.cat === mine.cat && pick.top === mine.top ? '<p class="sn-warn">내 족보와 같아요. 이대로 저격하면 나도 최하위가 돼요.</p>' : '';
      const opp = g.snipeBy.o ? `<p class="sn-note">미나의 선언: <b>${g.snipeBy.o === 'pass' ? '패스' : U.esc(declNm(g.snipeBy.o))}</b></p>` : '';
      return `<div class="sn-snipe"><p class="sn-note">미나의 족보를 저격하세요. 가장 높은 숫자와 족보를 함께 고릅니다. 내 족보와 같으면 나도 최하위가 돼요.</p>${opp}
        <div class="sn-chips">${cats}</div><div class="sn-chips">${tops}</div>${self}
        <div class="sn-row"><button class="btn btn-line" type="button" id="sn-pass">저격 안 함</button><button class="btn btn-ink" type="button" id="sn-fire">${U.esc(declNm(pick))} 저격</button></div></div>`;
    }
    const toCall = g.bet.o - g.bet.p, room = g.cap - g.commit.p;
    const ups = [1, 3, 5, 10].filter(n => n < room - Math.max(0, toCall));
    const raiseBtns = ups.map(n => `<button class="btn btn-line" type="button" data-up="${n}">${toCall > 0 ? '레이즈' : '베팅'} ${n}</button>`).join('') + (room - Math.max(0, toCall) > 0 ? `<button class="btn btn-line" type="button" data-up="${room - Math.max(0, toCall)}">올인 ${room}</button>` : '');
    return `<div class="sn-bet"><div class="sn-row">${toCall > 0 ? `<button class="btn btn-line" type="button" id="sn-fold">폴드</button><button class="btn btn-ink" type="button" id="sn-call">콜 ${Math.min(toCall, room)}</button>` : `<button class="btn btn-ink" type="button" id="sn-check">체크</button>`}</div><div class="sn-row wrap">${raiseBtns}</div>
      <small class="sn-note">한 핸드에 걸 수 있는 칩은 둘 중 적은 스택(${g.cap})까지예요.</small></div>`;
  }
  const View = {
    html() {
      if (!g) newMatch();
      const l = Love.st(), reveal = g.phase === 'done' && g.show;
      const hp = best([...g.hole.p, ...g.board]);
      const tag = (h, sn) => `<span class="sn-hand${sn ? ' sniped' : ''}">${U.esc(declNm(declOf(h)))}${sn ? ' · 저격됨' : ''}</span>`;
      const gauge = x => `<div class="sn-goal"><i style="width:${Math.min(100, g.stack[x] / GOAL * 100)}%"></i></div>`;
      const decls = g.decls.length ? `<div class="sn-decls">${g.decls.map(d => `<span>${U.esc(declNm(d))}</span>`).join('')}</div>` : '';
      return `<section class="sn-screen">
        <div class="sn-head"><div><span class="lv-eyebrow">SNIPER HOLD'EM · 미나와 1:1</span><h1>저격 홀덤</h1></div><button class="btn btn-line" type="button" id="sn-rules">규칙</button></div>
        <div class="sn-table">
          <div class="sn-side o"><img class="sn-face" src="${MINA_BASE}t${l.outfit}.webp" alt="미나">
            <div class="sn-who"><b>미나</b><span>칩 ${g.stack.o}${g.bet.o ? ` · 이번 베팅 ${g.bet.o}` : ''}</span>${gauge('o')}</div>
            <div class="sn-cards">${reveal ? g.hole.o.map(n => card(n)).join('') : back() + back()}</div>
            ${reveal ? tag(g.show.ho, g.show.j.sb) : ''}</div>
          <p class="sn-say">“${U.esc(g.said || '')}”</p>
          <div class="sn-board"><span class="sn-pot">팟 ${g.pot || (g.result ? g.result.pot : 0)}</span><div class="sn-cards">${[0, 1, 2, 3].map(i => g.board[i] != null ? card(g.board[i], 'bd') : '<span class="sn-card empty"></span>').join('')}</div>${decls}</div>
          <div class="sn-side p"><div class="sn-cards">${g.hole.p.map(n => card(n, 'me')).join('')}</div>
            ${tag(reveal ? g.show.hp : hp, reveal && g.show.j.sa)}
            <div class="sn-who"><b>나</b><span>칩 ${g.stack.p}${g.bet.p ? ` · 이번 베팅 ${g.bet.p}` : ''}</span>${gauge('p')}</div></div>
        </div>
        <div class="sn-actions">${actionsHtml()}</div>
        ${reveal ? hintHtml() : ''}
        <details class="sn-log"><summary>진행 기록</summary><ol>${g.log.map(t => `<li>${U.esc(t)}</li>`).join('')}</ol></details>
        <p class="lv-note">목표: 칩 ${GOAL}개 먼저 모으기(미나가 0이 돼도 승리) · 승리 시 칩 +200·하트 +8, 패배 시 하트 +2 (하루 3판)</p>
      </section>`;
    },
    bind(el) {
      const $ = s => U.$(s, el);
      U.$$('[data-go]', el).forEach(b => b.onclick = () => App.go(b.dataset.go));
      $('#sn-rules').onclick = rules;
      const on = (s, f) => { const b = $(s); if (b) b.onclick = f; };
      on('#sn-check', () => act('p', { t: 'check' }));
      on('#sn-call', () => act('p', { t: 'call' }));
      on('#sn-fold', () => act('p', { t: 'fold' }));
      U.$$('[data-up]', el).forEach(b => b.onclick = () => act('p', { t: g.bet.o > g.bet.p ? 'raise' : 'bet', n: +b.dataset.up }));
      U.$$('[data-cat]', el).forEach(b => b.onclick = () => { pick.cat = +b.dataset.cat; if (pick.cat === 4 && pick.top < 5) pick.top = 5; App.render(); });
      U.$$('[data-top]', el).forEach(b => b.onclick = () => { pick.top = +b.dataset.top; App.render(); });
      on('#sn-fire', () => snipe('p', { ...pick }));
      on('#sn-pass', () => snipe('p', null));
      on('#sn-next', () => { dealHand(); g.said = ''; tick(); });
      on('#sn-new', () => { newMatch(); tick(); });
      scheduleAI();
    }
  };
  /** 핸드가 끝난 뒤 미나의 해설: 내 카드로 본 상대 족보 분포 TOP3 */
  function hintHtml() {
    const dist = rangeDist(g.hole.p, g.board).slice(0, 3);
    return `<div class="sn-hint"><span class="lv-eyebrow">미나의 저격 해설</span><p>내 카드와 보드만 보면 미나가 가질 수 있었던 족보는 이 순서였어요. 저격은 이 확률과 상대의 베팅을 같이 읽는 싸움이에요.</p>
      <ol>${dist.map(d => `<li><b>${U.esc(declNm(d))}</b><span>${Math.round(d.p * 100)}%</span></li>`).join('')}</ol></div>`;
  }
  function rules() {
    const v = Layer.open(`<div class="modal sn-rules"><h2>저격 홀덤 규칙</h2>
      <ol><li>1~10 숫자 카드 4벌(40장)을 써요. 무늬가 없어서 플러시는 없어요.</li>
      <li>매 핸드 칩 1개씩 걸고, 개인 카드 2장을 받아요.</li>
      <li>공용 카드 2장 공개 → 첫 번째 베팅 → 공용 카드 2장 더 공개 → 두 번째 베팅.</li>
      <li>한 핸드에 걸 수 있는 칩은 둘 중 적은 스택까지예요.</li>
      <li>베팅이 끝나면 카드를 열기 전에 선 플레이어부터 상대 족보를 <b>‘가장 높은 숫자 + 족보’</b>로 저격해요. 예: 8 스트레이트(4·5·6·7·8), 7 투페어(7·7·5·5), 3 풀하우스(3·3·3 + 페어).</li>
      <li>저격당한 족보는 최하위가 돼요. 선언한 족보가 내 족보와 같으면 나도 저격당해요.</li>
      <li>족보 순위: 포카드 > 풀하우스 > 스트레이트 > 트리플 > 투페어 > 원페어 > 하이. 같은 족보면 높은 숫자, 그다음 개인 카드 중 높은 숫자, 개인 카드 합 순서로 비교하고, 그래도 같거나 둘 다 저격당하면 팟을 나눠요.</li>
      <li>칩 ${GOAL}개를 먼저 모으거나 상대 칩이 0이 되면 이겨요. 둘 다 ${START}개로 시작해요.</li></ol>
      <p class="sn-src">넷플릭스 〈데블스 플랜: 데스룸〉 감옥 매치 ‘저격 홀덤’ 규칙을 바탕으로 1:1용으로 만들었어요.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-ink" type="button" id="sn-close">확인</button></div></div>`, '저격 홀덤 규칙');
    U.$('#sn-close', v).onclick = Layer.close; v.onclick = e => { if (e.target === v) Layer.close(); };
  }

  return { View, best, judge, cmpHand, declOf, declNm, rangeDist, equity, CAT };
})();
