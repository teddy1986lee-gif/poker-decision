/* ===== 승률 시뮬레이터 엔진: 7장 족보 판정 · 레인지 · 전수 계산 / 무작위 시뮬레이션 ===== */
const SimEngine = (() => {
  const RANKS = '23456789TJQKA', SUITS = 'shdc';
  const toInt = s => RANKS.indexOf(s[0]) * 4 + SUITS.indexOf(s[1]);
  const toStr = c => RANKS[c >> 2] + SUITS[c & 3];

  // 13비트 랭크 마스크 표: 가장 높은 스트레이트(3=5하이 … 12=A하이, 없으면 -1), 비트 수, 위에서 5개 랭크
  const STR = new Int8Array(8192), POP = new Int8Array(8192), TOP5 = new Int32Array(8192);
  for (let m = 0; m < 8192; m++) {
    let s = -1;
    for (let h = 12; h >= 4; h--) { const need = 31 << (h - 4); if ((m & need) === need) { s = h; break; } }
    if (s < 0 && (m & 0x100F) === 0x100F) s = 3;
    STR[m] = s;
    let v = 0, k = 0, c = 0;
    for (let r = 12; r >= 0; r--) if (m >> r & 1) { c++; if (k < 5) { v = v << 4 | r; k++; } }
    while (k < 5) { v <<= 4; k++; }
    POP[m] = c; TOP5[m] = v;
  }

  // 족보 값: 위 4비트 = 족보 종류(0 하이카드 … 8 스트레이트 플러시), 아래 20비트 = 같은 족보 안의 비교값
  const CNT = new Int8Array(13);
  function evalCards(cs, n) {
    CNT.fill(0);
    let m0 = 0, m1 = 0, m2 = 0, m3 = 0, rm = 0;
    for (let i = 0; i < n; i++) {
      const c = cs[i], r = c >> 2, b = 1 << r;
      CNT[r]++; rm |= b;
      switch (c & 3) { case 0: m0 |= b; break; case 1: m1 |= b; break; case 2: m2 |= b; break; default: m3 |= b; }
    }
    // 7장 안에서는 플러시가 있으면 풀하우스·포카드가 나올 수 없다
    const fm = POP[m0] >= 5 ? m0 : POP[m1] >= 5 ? m1 : POP[m2] >= 5 ? m2 : POP[m3] >= 5 ? m3 : 0;
    if (fm) { const s = STR[fm]; return s >= 0 ? (8 << 20) | s : (5 << 20) | TOP5[fm]; }
    let quad = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
    for (let r = 12; r >= 0; r--) {
      const k = CNT[r];
      if (k < 2) continue;
      if (k === 4) quad = r;
      else if (k === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; }
      else if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r;
    }
    if (quad >= 0) return (7 << 20) | (quad << 4) | (TOP5[rm & ~(1 << quad)] >> 16);
    if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return (6 << 20) | (t1 << 4) | (t2 > p1 ? t2 : p1);
    const s = STR[rm];
    if (s >= 0) return (4 << 20) | s;
    if (t1 >= 0) return (3 << 20) | (t1 << 8) | (TOP5[rm & ~(1 << t1)] >> 12);
    if (p2 >= 0) return (2 << 20) | (p1 << 8) | (p2 << 4) | (TOP5[rm & ~(1 << p1) & ~(1 << p2)] >> 16);
    if (p1 >= 0) return (1 << 20) | (p1 << 12) | (TOP5[rm & ~(1 << p1)] >> 8);
    return TOP5[rm];
  }
  const CAT_KO = ['하이카드', '원페어', '투페어', '트리플', '스트레이트', '플러시', '풀하우스', '포카드', '스트레이트 플러시'];

  // ---------- 레인지 ----------
  // 169가지 시작 패를 무작위 패 하나를 상대로 한 승률 순서로 늘어놓은 것(위가 강함, 미리 계산)
  const ORDER = 'AA KK QQ JJ TT 99 88 AKs 77 AQs AJs AKo AQo ATs AJo KQs 66 A9s ATo KJs A8s KTs KQo A7s A9o KJo 55 QJs A5s K9s A8o A6s KTo QTs A4s A7o A3s K8s QJo K9o A6o A5o Q9s JTs K7s A2s QTo 44 A4o K6s K8o Q8s A3o K5s J9s Q9o K7o JTo K4s A2o K6o Q7s T9s K3s 33 J8s Q8o Q6s J9o K5o K2s Q5s T8s K4o J7s Q4s Q7o T9o J8o K3o Q6o Q3s 98s T7s K2o J6s 22 Q5o Q2s J5s T8o J7o 97s Q4o J4s T6s J3s 98o Q3o 87s T7o J6o J2s T5s 96s Q2o J5o T4s 97o 86s T6o J4o T3s 95s 76s J3o 87o T2s 85s 96o J2o T5o 94s 75s T4o 86o 93s 65s 95o 84s T3o 92s 76o 74s T2o 85o 64s 54s 83s 94o 75o 82s 73s 65o 93o 53s 84o 63s 92o 43s 74o 54o 72s 64o 52s 62s 83o 42s 82o 73o 53o 63o 32s 43o 72o 52o 62o 42o 32o'.split(' ');
  function classCombos(h) {
    const r1 = RANKS.indexOf(h[0]), r2 = RANKS.indexOf(h[1]), out = [];
    if (r1 === r2) { for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) out.push([r1 * 4 + a, r1 * 4 + b]); }
    else for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { if (h[2] === 's' ? a !== b : a === b) continue; out.push([r1 * 4 + a, r2 * 4 + b]); }
    return out;
  }
  const rcache = {};
  /** 상위 pct%(1,326조합 기준) 안의 시작 패 종류와 조합 */
  function range(pct) {
    if (rcache[pct]) return rcache[pct];
    if (pct >= 100) {
      const combos = []; for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) combos.push([a, b]);
      return (rcache[pct] = { classes: ORDER.slice(), combos });
    }
    const target = 1326 * pct / 100, classes = [], combos = [];
    for (const h of ORDER) { if (combos.length >= target - 1e-9) break; classes.push(h); combos.push(...classCombos(h)); }
    return (rcache[pct] = { classes, combos });
  }

  // ---------- 계산 준비 ----------
  const nCk = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const EXACT_LIMIT = 4.5e6;   // 이보다 족보 판정이 많으면 무작위 시뮬레이션
  /**
   * setup = { players: [{ c: ['As', null], pct: 100 }], board: ['Kh', '8h', '2c'] }
   * players[0]은 나. 카드 두 장을 모두 지정하지 않은 상대는 pct% 레인지 안에서 무작위.
   */
  function prepare(setup) {
    const known = new Uint8Array(52);
    const players = setup.players.map(p => ({ c: (p.c || []).filter(Boolean).map(toInt), pct: p.pct || 100 }));
    const board = (setup.board || []).filter(Boolean).map(toInt);
    for (const c of players.flatMap(p => p.c).concat(board)) {
      if (c < 0) return { err: '카드 표기가 올바르지 않습니다.' };
      if (known[c]) return { err: '같은 카드가 두 번 쓰였어요.' };
      known[c] = 1;
    }
    if (players.length < 2) return { err: '2명 이상이어야 계산할 수 있어요.' };
    if (players[0].c.length < 2) return { err: '내 카드 2장을 먼저 골라 주세요.' };
    if (board.length > 5) return { err: '보드는 5장까지입니다.' };
    const deck = []; for (let c = 0; c < 52; c++) if (!known[c]) deck.push(c);
    const missing = 5 - board.length;
    for (const p of players) {
      p.kind = p.c.length === 2 ? 'known' : p.c.length === 1 ? 'one' : 'range';
      if (p.kind === 'range') {
        p.any = p.pct >= 100;
        p.combos = range(p.pct).combos.filter(([a, b]) => !known[a] && !known[b]);
        if (!p.combos.length) return { err: '상대 레인지에 남은 패가 없어요. 레인지를 넓히거나 카드를 바꿔 주세요.' };
      }
    }
    const unk = players.filter(p => p.kind !== 'known');
    if (deck.length - unk.reduce((s, p) => s + (p.kind === 'one' ? 1 : 2), 0) < missing) return { err: '남은 카드가 모자라요.' };
    let boards = Infinity;
    if (!unk.length) boards = nCk(deck.length, missing);
    else if (unk.length === 1) { const u = unk[0]; boards = (u.kind === 'one' ? deck.length : u.combos.length) * nCk(deck.length - (u.kind === 'one' ? 1 : 2), missing); }
    const mode = boards * players.length <= EXACT_LIMIT ? 'exact' : 'mc';
    return { players, board, deck, missing, unk, mode, boards };
  }

  // ---------- 집계 ----------
  function tally(acc, vals, n) {
    let best = -1, nb = 0;
    for (let i = 0; i < n; i++) { const v = vals[i]; if (v > best) { best = v; nb = 1; } else if (v === best) nb++; }
    if (nb === 1) { for (let i = 0; i < n; i++) if (vals[i] === best) { acc.win[i]++; acc.eq[i]++; } }
    else { const sh = 1 / nb; for (let i = 0; i < n; i++) if (vals[i] === best) { acc.tie[i]++; acc.eq[i] += sh; } }
    acc.cat[vals[0] >> 20]++;
    acc.n++;
  }

  // ---------- 전수 계산 ----------
  function* exactGen(P, acc) {
    const n = P.players.length, cards = new Int32Array(7), vals = new Int32Array(n), k = P.missing;
    for (let i = 0; i < P.board.length; i++) cards[2 + i] = P.board[i];
    const u = P.unk[0];
    const choices = !u ? [null] : u.kind === 'one' ? P.deck.map(x => [u.c[0], x]) : u.combos;
    const hands = P.players.map(p => p.c);
    const ui = u ? P.players.indexOf(u) : -1;
    let tick = 0;
    for (const ch of choices) {
      if (ch) hands[ui] = ch;
      const d = ch ? P.deck.filter(x => x !== ch[0] && x !== ch[1]) : P.deck, N = d.length;
      const idx = new Int32Array(k);
      for (let i = 0; i < k; i++) idx[i] = i;
      for (;;) {
        for (let i = 0; i < k; i++) cards[2 + P.board.length + i] = d[idx[i]];
        for (let p = 0; p < n; p++) { cards[0] = hands[p][0]; cards[1] = hands[p][1]; vals[p] = evalCards(cards, 7); }
        tally(acc, vals, n);
        if (++tick === 3000) { tick = 0; yield; }
        let i = k - 1;
        while (i >= 0 && idx[i] === N - k + i) i--;
        if (i < 0) break;
        idx[i]++;
        for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
      }
    }
  }

  // ---------- 무작위 시뮬레이션 ----------
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function* mcGen(P, acc, iters, rng, fail) {
    const n = P.players.length, deck = P.deck, D = deck.length;
    const stamp = new Int32Array(52), cards = new Int32Array(7), vals = new Int32Array(n);
    const hands = P.players.map(p => (p.kind === 'known' ? p.c.slice() : [-1, -1]));
    const order = P.players.map((p, i) => i).filter(i => P.players[i].kind !== 'known');
    const draw = it => { let x; do { x = deck[(rng() * D) | 0]; } while (stamp[x] === it); stamp[x] = it; return x; };
    let it = 0, done = 0, misses = 0;
    while (done < iters) {
      it++;
      for (let i = order.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = order[i]; order[i] = order[j]; order[j] = t; }
      let ok = true;
      for (const pi of order) {
        const p = P.players[pi], h = hands[pi];
        if (p.kind === 'one') { h[0] = p.c[0]; h[1] = draw(it); }
        else if (p.any) { h[0] = draw(it); h[1] = draw(it); }
        else {
          let cmb, tries = 0;
          do { cmb = p.combos[(rng() * p.combos.length) | 0]; } while ((stamp[cmb[0]] === it || stamp[cmb[1]] === it) && ++tries < 80);
          if (tries >= 80) { ok = false; break; }
          stamp[cmb[0]] = it; stamp[cmb[1]] = it; h[0] = cmb[0]; h[1] = cmb[1];
        }
      }
      if (!ok) { if (++misses > 20000 && misses > done * 4) { fail('상대들의 레인지가 서로 겹쳐서 계산할 수 없어요. 레인지를 넓혀 주세요.'); return; } continue; }
      for (let i = 0; i < P.board.length; i++) cards[2 + i] = P.board[i];
      for (let i = P.board.length; i < 5; i++) cards[2 + i] = draw(it);
      for (let p = 0; p < n; p++) { cards[0] = hands[p][0]; cards[1] = hands[p][1]; vals[p] = evalCards(cards, 7); }
      tally(acc, vals, n);
      if ((++done & 1023) === 0) yield;
    }
  }

  // ---------- 실행 ----------
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  /**
   * 계산을 잘게 나눠 화면이 멈추지 않게 돌린다. onProgress·onDone에 같은 모양의 결과를 넘긴다.
   * 돌려주는 값의 cancel()로 중단.
   */
  function run(setup, { onProgress = () => { }, onDone = () => { }, iters = 60000, seed, slice = 22, sync = false } = {}) {
    const P = prepare(setup);
    if (P.err) { onDone({ err: P.err }); return { cancel() { } }; }
    const n = P.players.length;
    const acc = { n: 0, win: new Float64Array(n), tie: new Float64Array(n), eq: new Float64Array(n), cat: new Float64Array(9) };
    let err = null;
    const rng = mulberry(seed ?? ((Math.random() * 2 ** 31) | 0));
    const gen = P.mode === 'exact' ? exactGen(P, acc) : mcGen(P, acc, iters, rng, e => { err = e; });
    const total = P.mode === 'exact' ? P.boards : iters;
    const out = fin => (err ? { err } : {
      mode: P.mode, n: acc.n, total, progress: Math.min(1, acc.n / total), done: fin,
      street: P.board.length, players: P.players.map((p, i) => ({ win: acc.win[i] / (acc.n || 1), tie: acc.tie[i] / (acc.n || 1), eq: acc.eq[i] / (acc.n || 1) })),
      cat: Array.from(acc.cat, x => x / (acc.n || 1))
    });
    if (sync) { for (let r = gen.next(); !r.done; r = gen.next()); const res = out(true); onDone(res); return { cancel() { }, result: res }; }
    let stopped = false;
    const step = () => {
      if (stopped) return;
      const t0 = now();
      let r;
      do { r = gen.next(); } while (!r.done && !err && now() - t0 < slice);
      if (r.done || err) { onDone(out(true)); return; }
      onProgress(out(false));
      setTimeout(step, 0);
    };
    setTimeout(step, 0);
    return { cancel() { stopped = true; } };
  }

  return { RANKS, SUITS, toInt, toStr, evalCards, CAT_KO, ORDER, classCombos, range, prepare, run, nCk, EXACT_LIMIT };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SimEngine;
