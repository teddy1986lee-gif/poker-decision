/* ===== Poker Decision 엔진: 액션 토큰 → 테이블 상태 계산 + 문제 검증 ===== */
const PD = (() => {
  const POS = {
    8: ['UTG', 'U1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    7: ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    6: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
    4: ['CO', 'BTN', 'SB', 'BB'],
    3: ['BTN', 'SB', 'BB']
  };
  const POS_NAME = { U1: 'UTG+1' };
  const posName = k => POS_NAME[k] || k;
  const STREETS = ['pre', 'flop', 'turn', 'river'];
  const STREET_KO = { pre: '프리플랍', flop: '플랍', turn: '턴', river: '리버' };
  const BOARD_LEN = [0, 3, 4, 5];
  const RANKS = 'AKQJT98765432';
  const SUITS = 'shdc';

  function parseCards(s) {
    if (!s) return [];
    const t = s.replace(/\s+/g, '');
    if (t.length % 2) throw new Error('카드 표기 오류: ' + s);
    const out = [];
    for (let i = 0; i < t.length; i += 2) {
      const r = t[i].toUpperCase(), su = t[i + 1].toLowerCase();
      if (!RANKS.includes(r) || !SUITS.includes(su)) throw new Error('카드 표기 오류: ' + t.slice(i, i + 2));
      out.push(r + su);
    }
    return out;
  }

  function parseTok(tok) {
    const m = /^([fxcbra])(\d+(?:\.\d+)?)?$/.exec(tok);
    if (!m) throw new Error('액션 표기 오류: ' + tok);
    return { t: m[1], n: m[2] != null ? parseFloat(m[2]) : null };
  }

  // 스택: 숫자(모두 같은 BB) 또는 {d: 기본, POS: BB}
  function stackOf(p, k) {
    const s = p.s;
    if (typeof s === 'number') return s;
    if (s && s[k] != null) return s[k];
    return (s && s.d) || 100;
  }

  /** 문제 → 결정 시점의 테이블 상태 */
  function build(p) {
    const n = p.pl || 8;
    const order = POS[n];
    if (!order) throw new Error('지원하지 않는 인원: ' + n);
    const [sb, bb, ante] = p.bl;
    const chips = x => Math.round(x * bb);
    const pl = order.map((k, i) => ({
      k, i, start: chips(stackOf(p, k)), stack: chips(stackOf(p, k)),
      bet: 0, inv: 0, folded: false, allin: false, hero: k === p.h
    }));
    if (!pl.some(x => x.hero)) throw new Error('히어로 포지션 없음: ' + p.h);
    const P = k => pl.find(x => x.k === k);
    let pot = 0;
    const log = [];
    const put = (x, amt) => {
      amt = Math.min(amt, x.stack);
      x.stack -= amt; x.bet += amt; x.inv += amt;
      if (x.stack === 0) x.allin = true;
      return amt;
    };
    // 앤티(BB 앤티) → 데드머니
    if (ante) {
      const b = P('BB'); const a = Math.min(ante, b.stack);
      b.stack -= a; b.inv += a; pot += a;
    }
    put(P('SB'), sb);
    put(P('BB'), bb);

    const streetsTok = (p.a || '').split('|').map(s => s.trim().split(/\s+/).filter(Boolean));
    const nStreets = streetsTok.length;
    const board = parseCards(p.b);
    if (board.length !== BOARD_LEN[nStreets - 1]) throw new Error(`보드 카드 수(${board.length})가 스트리트(${STREETS[nStreets - 1]})와 맞지 않음`);

    let cur = 0, minRaise = bb, acted = new Set(), ptr = 0;
    let decision = null;

    for (let s = 0; s < nStreets; s++) {
      const street = STREETS[s];
      if (s === 0) {
        cur = bb; minRaise = bb; acted = new Set(); ptr = 0;
      } else {
        // 베팅 수거
        pl.forEach(x => { pot += x.bet; x.bet = 0; });
        cur = 0; minRaise = bb; acted = new Set();
        ptr = n - 2; // SB부터
      }
      const live = () => pl.filter(x => !x.folded);
      const canAct = x => !x.folded && !x.allin;
      const needs = x => canAct(x) && (!acted.has(x.k) || x.bet < cur);
      const nextActor = () => {
        if (live().length <= 1) return null;
        // 남은 행동 가능자가 1명이고 맞출 금액이 없으면 종료
        for (let j = 0; j < n; j++) {
          const x = pl[(ptr + j) % n];
          if (needs(x)) {
            // 혼자 남은 행동 가능자이고 이미 맞춘 경우 제외
            if (pl.filter(canAct).length === 1 && x.bet >= cur && acted.has(x.k)) return null;
            if (pl.filter(canAct).length === 1 && x.bet >= cur && s > 0) return null;
            return x;
          }
        }
        return null;
      };
      const toks = streetsTok[s];
      const evs = [];
      const potStart = pot + pl.reduce((a, x) => a + x.bet, 0);
      for (const raw of toks) {
        const x = nextActor();
        if (!x) throw new Error(`${STREET_KO[street]}: 행동할 사람이 없는데 액션(${raw})이 남음`);
        const tk = parseTok(raw);
        const ev = { k: x.k, t: tk.t, hero: x.hero };
        if (tk.t === 'f') { x.folded = true; }
        else if (tk.t === 'x') {
          if (x.bet !== cur) throw new Error(`${posName(x.k)} 체크 불가(콜 금액 있음)`);
        } else if (tk.t === 'c') {
          if (x.bet >= cur) throw new Error(`${posName(x.k)} 콜할 금액 없음`);
          ev.amt = put(x, cur - x.bet); ev.to = x.bet; ev.allin = x.allin;
        } else if (tk.t === 'b' || tk.t === 'r' || tk.t === 'a') {
          let to = tk.t === 'a' ? x.bet + x.stack : chips(tk.n);
          if (tk.t === 'b' && cur > 0) throw new Error(`${posName(x.k)} 베팅 불가(이미 베팅 있음) → r 사용`);
          if (tk.t === 'r' && cur === 0 && s > 0) throw new Error(`${posName(x.k)} 레이즈 불가(베팅 없음) → b 사용`);
          if (to > x.bet + x.stack) throw new Error(`${posName(x.k)} 스택 초과 베팅`);
          if (to <= cur) {
            if (tk.t !== 'a') throw new Error(`${posName(x.k)} 레이즈 금액이 현재 베팅 이하`);
            ev.amt = put(x, to - x.bet); ev.to = x.bet; ev.allin = true; ev.t = 'c';
          } else {
            const inc = to - cur;
            if (inc < minRaise && to !== x.bet + x.stack) throw new Error(`${posName(x.k)} 최소 레이즈 미달 (${to})`);
            const reopen = inc >= minRaise;
            if (reopen) { minRaise = inc; acted = new Set(); }
            const wasBet = cur === 0;
            put(x, to - x.bet); cur = to;
            ev.to = to; ev.allin = x.allin; ev.t = tk.t === 'a' ? (wasBet ? 'b' : 'r') : (wasBet ? 'b' : 'r');
            if (tk.t === 'a') ev.allin = true;
          }
        }
        acted.add(x.k);
        ptr = (x.i + 1) % n;
        evs.push(ev);
      }
      log.push({ street, evs, board: board.slice(0, BOARD_LEN[s]), potStart });
      if (s < nStreets - 1) {
        const left = nextActor();
        if (left) throw new Error(`${STREET_KO[street]}: ${posName(left.k)}의 액션이 빠짐`);
      } else {
        const who = nextActor();
        if (!who) throw new Error('결정 시점에 행동할 사람이 없음');
        if (!who.hero) throw new Error(`결정 시점 차례가 히어로가 아님 (현재 ${posName(who.k)})`);
        decision = who;
      }
    }
    const hero = decision;
    const toCall = Math.max(0, cur - hero.bet);
    const betsOnTable = pl.reduce((a, x) => a + x.bet, 0);
    // 유효 스택: 히어로 시작 스택 vs 남아 있는 상대 중 최대 시작 스택
    const opp = pl.filter(x => !x.folded && !x.hero);
    const effStart = Math.min(hero.start, Math.max(...opp.map(x => x.start)));
    return {
      p, n, order, pl, pot, betsOnTable, total: pot + betsOnTable, cur, minRaise, toCall,
      hero, street: STREETS[nStreets - 1], board, heroCards: parseCards(p.c), log, bb, sb, ante,
      eff: effStart, effBB: effStart / bb, facing: toCall > 0
    };
  }

  /** 선택지 해석 */
  function optionInfo(st, tok) {
    const tk = parseTok(tok), h = st.hero, bb = st.bb;
    const maxTo = h.bet + h.stack;
    switch (tk.t) {
      case 'f': return { t: 'f', kind: 'fold' };
      case 'x': return { t: 'x', kind: 'check' };
      case 'c': { const amt = Math.min(st.toCall, h.stack); return { t: 'c', kind: 'call', amt, allin: amt === h.stack }; }
      case 'b': { const amt = Math.round(tk.n * bb); return { t: 'b', kind: 'bet', amt, to: amt, allin: amt === maxTo, pct: Math.round(amt / st.total * 100) }; }
      case 'r': { const to = Math.round(tk.n * bb); return { t: 'r', kind: 'raise', to, add: to - h.bet, allin: to === maxTo }; }
      case 'a': return { t: 'a', kind: 'allin', to: maxTo, add: h.stack, pct: st.facing ? null : Math.round(h.stack / st.total * 100) };
    }
  }

  function validateOptions(st, opts) {
    const errs = [];
    const h = st.hero, maxTo = h.bet + h.stack;
    opts.forEach(o => {
      let tk; try { tk = parseTok(o); } catch (e) { errs.push(e.message); return; }
      const bad = m => errs.push(`선택지 ${o}: ${m}`);
      if (tk.t === 'f' && !st.facing) bad('상대 베팅이 없을 때 폴드 선택지는 제시하지 않음');
      if (tk.t === 'x' && st.facing) bad('콜 금액이 있어 체크 불가');
      if (tk.t === 'c' && !st.facing) bad('콜할 금액 없음');
      if (tk.t === 'b') {
        if (st.cur > 0) bad('이미 베팅이 있음 → r 사용');
        const amt = Math.round(tk.n * st.bb);
        if (amt > maxTo) bad('스택 초과');
        if (amt < st.bb && amt !== maxTo) bad('최소 베팅 미달');
      }
      if (tk.t === 'r') {
        if (st.cur === 0 && st.street !== 'pre') bad('베팅 없음 → b 사용');
        const to = Math.round(tk.n * st.bb);
        if (to > maxTo) bad('스택 초과');
        if (to - st.cur < st.minRaise && to !== maxTo) bad('최소 레이즈 미달');
      }
      if (tk.t === 'a' && st.facing && h.stack <= st.toCall) bad('콜이 곧 올인 → c 사용');
    });
    if (new Set(opts).size !== opts.length) errs.push('중복 선택지');
    return errs;
  }

  function validate(p) {
    const errs = [];
    let st = null;
    try { st = build(p); } catch (e) { return { st: null, errs: [e.message] }; }
    try {
      const all = [...st.heroCards, ...st.board];
      if (st.heroCards.length !== 2) errs.push('히어로 카드는 2장');
      if (new Set(all).size !== all.length) errs.push('카드 중복: ' + all.join(' '));
    } catch (e) { errs.push(e.message); }
    const o = p.o || [];
    if (o.length < 2 || o.length > 5) errs.push('선택지는 2~5개');
    errs.push(...validateOptions(st, o));
    if (!p.ex) {
      const ans = [].concat(p.ans);
      if (!ans.length || ans.some(i => !(i >= 0 && i < o.length))) errs.push('정답 인덱스 오류');
      if (!p.w || p.w.length < 20) errs.push('해설(w) 부족');
    }
    if (p.n && p.n.length !== o.length) errs.push(`선택지별 설명(n) 개수 ${p.n.length} ≠ 선택지 ${o.length}`);
    if (![1, 2, 3].includes(p.lv)) errs.push('난이도(lv) 오류');
    return { st, errs };
  }

  /** 지금 만들어진 족보: { name: 'TRIPS', key: '7' } */
  const RV = '23456789TJQKA';
  function handLabel(cards) {
    if (!cards || cards.length < 2) return null;
    const rs = cards.map(c => RV.indexOf(c[0])), ss = cards.map(c => c[1]);
    const cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    const R = r => (RV[r] === 'T' ? '10' : RV[r]);
    const straightHigh = set => { for (let h = 12; h >= 3; h--) { let ok = true; for (let k = 0; k < 5; k++) { const r = h - k; if (!set.has(r < 0 ? 12 : r === -1 ? 12 : r)) { ok = false; break; } } if (ok) return h; } return (set.has(12) && set.has(0) && set.has(1) && set.has(2) && set.has(3)) ? 3 : -1; };
    const bySuit = {}; cards.forEach((c, i) => (bySuit[ss[i]] = bySuit[ss[i]] || []).push(rs[i]));
    for (const s in bySuit) if (bySuit[s].length >= 5) {
      const sh = straightHigh(new Set(bySuit[s]));
      if (sh >= 0) return { name: 'STRAIGHT FLUSH', key: R(sh) };
    }
    const groups = Object.entries(cnt).map(([r, n]) => [n, +r]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    if (groups[0][0] === 4) return { name: 'FOUR OF A KIND', key: R(groups[0][1]) };
    if (groups[0][0] === 3 && groups[1] && groups[1][0] >= 2) return { name: 'FULL HOUSE', key: R(groups[0][1]) };
    for (const s in bySuit) if (bySuit[s].length >= 5) return { name: 'FLUSH', key: R(Math.max(...bySuit[s])) };
    const sh = straightHigh(new Set(rs)); if (sh >= 0) return { name: 'STRAIGHT', key: R(sh) };
    if (groups[0][0] === 3) return { name: 'TRIPS', key: R(groups[0][1]) };
    if (groups[0][0] === 2 && groups[1] && groups[1][0] === 2) return { name: 'TWO PAIR', key: R(groups[0][1]) + '·' + R(groups[1][1]) };
    if (groups[0][0] === 2) return { name: 'ONE PAIR', key: R(groups[0][1]) };
    return { name: 'HIGH CARD', key: R(Math.max(...rs)) };
  }

  return { POS, posName, STREETS, STREET_KO, parseCards, parseTok, build, optionInfo, validate, validateOptions, handLabel };
})();
if (typeof module !== 'undefined') module.exports = PD;
