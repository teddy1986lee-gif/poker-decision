/* 입문 70문제 생성: B31–B100 */
const L = require('./lib.js');
const { PD, bbs, pc, BL, cls, need, EQ } = L;
const check = L.chk;
const out = [];
let n = 31;
const id = () => 'B' + String(n++).padStart(2, '0');
const BLS = [400, 500, 600, 800, 1000, 1200, 1500, 2000];

// ---------- A. 오픈 레이즈 또는 폴드 (16) ----------
const RFI = { UTG: [7, 15], U1: [6, 17], MP: [5, 20], HJ: [4, 25], CO: [3, 30], BTN: [2, 45] };
const rfi = [
  ['UTG', 'JcJs', 50, true, '높은 포켓페어라 콜하는 대부분의 핸드를 앞섭니다.'],
  ['UTG', 'AsJs', 40, true, '높은 카드 두 장에 넛 플러시 가능성까지 있어 앞 포지션에서도 오픈할 수 있습니다.'],
  ['UTG', 'Qh9h', 60, false, '수티드라도 Q-9는 뒤의 AQ·KQ·QJ에 자주 지배당하고, 포지션 없이 플레이하게 됩니다.'],
  ['UTG', 'Ad6c', 45, false, 'A를 맞혀도 키커가 약해 뒤의 AK·AQ·AJ에 자주 집니다.'],
  ['U1', 'KdQd', 35, true, '높은 카드 두 장이 수티드로 연결되어 탑페어·플러시·스트레이트 가능성이 모두 있습니다.'],
  ['U1', 'Td7d', 50, false, '한 칸 떨어진 낮은 수티드 핸드는 앞 포지션에서 이익을 내기 어렵습니다.'],
  ['MP', '9s9d', 30, true, '중간 포켓페어는 쇼다운 가치가 있고 세트가 되면 큰 팟을 이깁니다.'],
  ['MP', 'Kh8c', 45, false, '오프수트 K-8은 콜을 받으면 더 높은 키커에 자주 지배당합니다.'],
  ['HJ', 'QcJc', 40, true, '수티드 브로드웨이는 탑페어·스트레이트·플러시로 이길 길이 많습니다.'],
  ['HJ', '8h6c', 55, false, '오프수트에 연결도 약하고 높은 카드도 없어 플랍 이후 이기기 어렵습니다.'],
  ['HJ', 'KsJh', 35, true, '높은 카드 두 장이라 탑페어가 되면 키커도 좋습니다.'],
  ['CO', 'Ah4h', 45, true, '수티드 A는 넛 플러시와 휠 스트레이트 가능성이 있고, A를 들고 있어 상대가 AA·AK를 가질 확률도 줄여 줍니다.'],
  ['CO', '5c5d', 40, true, '작은 포켓페어도 늦은 포지션에서는 블라인드를 훔치기 좋고, 세트가 되면 크게 이깁니다.'],
  ['CO', 'Jd5c', 50, false, '오프수트 J-5는 J를 맞혀도 키커가 약하고 스트레이트 가능성도 거의 없습니다.'],
  ['BTN', 'Qs6s', 40, true, '앞이 모두 폴드했다면 BTN은 블라인드 두 명만 이기면 됩니다. 수티드 Q는 플러시 가능성도 있어 충분히 오픈할 만합니다.'],
  ['BTN', '8d2c', 50, false, '오프수트 8-2는 BTN에서도 범위 밖입니다. 블라인드가 3벳하거나 콜하면 플랍 이후 이길 길이 거의 없습니다.']
];
rfi.forEach(([pos, c, s, inR, why], i) => {
  const bb = BLS[i % BLS.length], [left, pct] = RFI[pos], h = cls(c), P = PD.posName(pos);
  const last = s <= 45 ? 'a' : 'r4';
  const p = { id: id(), lv: 1, tp: '포지션별 시작 핸드', ti: `${P}에서 ${h}`, bl: BL(bb), s, h: pos, c, b: '', a: L.foldsBefore(pos).join(' '), o: ['f', 'c', 'r2.2', last], ans: inR ? 2 : 0 };
  const head = pos === 'UTG' ? `UTG는 가장 먼저 행동하고 뒤에 7명이 남아 있습니다.` : `${P}까지 앞에서 모두 폴드했고, 뒤에는 ${left}명이 남아 있습니다.`;
  p.w = inR
    ? `${head} 이 자리의 오픈 범위는 대략 상위 ${pct}%이고 ${h} 핸드는 그 안에 들어갑니다. ${why} 토너먼트에서는 2.2BB 안팎의 작은 오픈이 표준입니다.`
    : `${head} 이 자리의 오픈 범위는 상위 ${pct}% 안팎이고 ${h} 핸드는 범위 밖입니다. ${why} 폴드합니다.`;
  p.n = inR
    ? ['범위 안의 핸드를 버리면 블라인드와 앤티를 가져올 기회를 놓칩니다.', '림프는 주도권을 잃고 뒤 플레이어에게 싸게 들어오거나 레이즈할 기회를 줍니다.', '', last === 'a' ? `${s}BB 올인은 더 강한 핸드에만 콜을 받아, 위험에 비해 얻는 것이 블라인드뿐입니다.` : '4BB는 같은 효과를 더 큰 위험으로 얻습니다. 2.2BB면 충분합니다.']
    : ['', '림프로 들어가도 뒤에서 레이즈를 받으면 칩만 잃고 폴드하게 됩니다.', '범위 밖의 핸드로 오픈하면 뒤의 더 강한 범위에 3벳이나 콜을 받아 불리하게 플레이합니다.', last === 'a' ? `${s}BB 올인은 더 강한 핸드에만 콜을 받습니다.` : '크게 오픈할수록 손실만 커집니다.'];
  check(p); out.push(p);
});

// ---------- B. BB 디펜스 (12) ----------
const ga = pos => (pos === 'BTN' || pos === 'U1' ? '이' : '가');
const OPCT = { UTG: 15, U1: 17, MP: 20, HJ: 25, CO: 30, BTN: 45 };
const bbd = [
  ['BTN', 2.2, 'Th8h', 40, 'c', 'T8s는 스트레이트와 플러시로 큰 팟을 이길 수 있는 플레이하기 좋은 핸드입니다.'],
  ['BTN', 2, 'Qd7c', 35, 'c', 'BTN은 넓게 스틸하므로 Q-하이도 자주 앞서고, 미니 레이즈라 가격이 아주 좋습니다.'],
  ['CO', 2.2, '6c6d', 45, 'c', '포켓페어는 세트가 되면 큰 팟을 이기고, 쇼다운 가치도 있습니다.'],
  ['CO', 2.3, 'Ks9s', 40, 'c', '수티드 K는 탑페어와 플러시 가능성이 있어 넓은 CO 범위를 상대로 충분히 플레이할 만합니다.'],
  ['HJ', 2.2, 'Js9s', 50, 'c', 'J9s는 스트레이트·플러시 가능성이 많아 포지션이 없어도 디펜스할 만합니다.'],
  ['UTG', 2.3, '7h6h', 45, 'c', '76s는 상대의 강한 핸드를 상대로도 스트레이트·플러시로 크게 이길 수 있는 핸드입니다.'],
  ['BTN', 2.2, 'Jh6h', 40, 'c', '수티드 J는 BTN의 넓은 범위를 상대로 플러시와 J 페어로 이길 길이 있습니다.'],
  ['UTG', 2.3, 'Kh5c', 40, 'f', 'UTG의 범위에는 AK·KQ·KJ처럼 K5o를 지배하는 핸드가 많습니다. K를 맞혀도 키커로 지는 경우가 잦고 포지션도 없습니다. 승률 숫자만큼 이기지 못하는(에퀴티 실현이 낮은) 핸드라'],
  ['UTG', 2.2, 'Qs6d', 50, 'f', 'Q6o는 UTG의 강한 범위에 거의 항상 지배당하고 연결성도 없습니다. 포지션 없이 이 핸드로 이익을 내기 어려워'],
  ['HJ', 2.5, 'Jc4d', 40, 'f', 'J4o는 페어를 맞혀도 키커가 약하고 스트레이트 가능성도 거의 없습니다. 오픈 크기도 커서'],
  ['CO', 2.2, '8c3d', 35, 'f', '8-3 오프수트는 범위의 가장 아래쪽 핸드입니다. 페어를 맞혀도 약하고 연결성도 없어'],
  ['BTN', 2.2, '6d2c', 45, 'f', 'BTN이 넓게 오픈해도 6-2 오프수트는 디펜스 범위 밖입니다. 맞힐 만한 보드가 거의 없어']
];
bbd.forEach(([op, size, c, s, ans, why], i) => {
  const bb = BLS[(i + 3) % BLS.length], h = cls(c), O = PD.posName(op);
  const three = Math.round(size * 4.5);
  const p = { id: id(), lv: 1, tp: '포지션별 시작 핸드', ti: `${O} 오픈에 BB ${h}`, bl: BL(bb), s, h: 'BB', c, b: '', a: L.openToHero(op, size, 'BB'), o: ['f', 'c', 'r' + three, 'a'], ans: ans === 'c' ? 1 : 0 };
  const st = check(p);
  const add = bbs(st.toCall / st.bb), potA = bbs((st.total + st.toCall) / st.bb), nd = pc(need(st));
  p.w = ans === 'c'
    ? `${O}${ga(op)} ${size}BB로 오픈했습니다. BB는 이미 1BB와 앤티를 넣었고 마지막에 행동하므로, ${add}BB만 더 내면 ${potA}BB 팟을 다툽니다. 필요한 승률은 약 ${nd}%입니다. ${O}의 오픈 범위(상위 약 ${OPCT[op]}%)를 상대로 ${why} 콜로 디펜스합니다.`
    : `${O}${ga(op)} ${size}BB로 오픈했습니다. 콜에 필요한 승률은 약 ${nd}%로 가격은 나쁘지 않습니다. 하지만 ${why} 폴드합니다.`;
  p.n = ans === 'c'
    ? ['가격이 좋은데 폴드하면 상대가 너무 쉽게 블라인드를 가져갑니다.', '', `${h} 핸드는 3벳으로 밸류를 얻기 어렵고, 4벳을 받으면 폴드해야 합니다.`, `${bbs(st.hero.stack / st.bb + 1)}BB 올인은 상대의 강한 핸드에만 콜을 받습니다.`]
    : ['', '숫자상 가격은 맞아 보여도 포지션 없이 지배당한 핸드로 플레이하면 실제로 가져가는 몫이 크게 줄어듭니다.', '약한 핸드로 3벳 블러프를 하기에는 상대의 오픈 범위가 강합니다.', '올인은 상대의 강한 핸드에만 콜을 받습니다.'];
  out.push(p);
});

// ---------- C1. 턴 드로우 팟오즈 (10) ----------
const DRAW = { FD: '플러시 드로우', OE: '오픈엔디드 스트레이트 드로우', GS: '거트샷 스트레이트 드로우', C15: '플러시 드로우와 오픈엔디드가 겹친 콤보 드로우', C12: '플러시 드로우와 거트샷이 겹친 콤보 드로우' };
/** 남은 카드 중 스트레이트 이상을 만드는 아웃 수 */
function outs(hero, board) {
  const h = EQ.cards(hero), b = EQ.cards(board), dead = new Set([...h, ...b]); let k = 0;
  for (let c = 0; c < 52; c++) { if (dead.has(c)) continue; if (Math.floor(EQ.evalHand([...h, ...b, c]) / 1e10) >= 4) k++; }
  return k;
}
/** 두 장을 모두 볼 때 스트레이트 이상 완성 확률 */
function eq2(hero, board) {
  const h = EQ.cards(hero), b = EQ.cards(board), dead = new Set([...h, ...b]); let win = 0, tot = 0;
  const rest = []; for (let c = 0; c < 52; c++) if (!dead.has(c)) rest.push(c);
  for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) { tot++; if (Math.floor(EQ.evalHand([...h, ...b, rest[i], rest[j]]) / 1e10) >= 4) win++; }
  return win / tot;
}
const ASSUME = '상대는 이미 페어 이상을 가졌고, 내 드로우가 완성되면 이긴다고 가정합니다.';
const turnDraws = [
  ['9h8h', 'Kh4h2c7s', 'FD', 9, 0.25, 40], ['Td9d', 'Ad6d3c2s', 'FD', 9, 0.66, 28], ['JdTc', '9s8h3c2d', 'OE', 8, 0.2, 40],
  ['7c6d', '5h4sKc2d', 'OE', 8, 1, 28], ['8s7s', 'Ts9s2h3d', 'C15', 15, 0.5, 40], ['KdJc', 'Qh9s3d2c', 'GS', 4, 0.5, 35],
  ['QcJc', 'Kc6c2d8h', 'FD', 9, 0.2, 40], ['6s5h', '7d4cKs2h', 'OE', 8, 0.66, 28], ['Ah4d', '3c2hJd9s', 'GS', 4, 0.33, 35],
  ['JhTh', 'Qh8h3c2s', 'C12', 12, 0.25, 40]
];
turnDraws.forEach(([c, b, kind, o, frac, s], i) => {
  const got = outs(c, b); if (got !== o) throw new Error(`outs ${c} ${b}: ${got} != ${o}`);
  const bb = BLS[(i + 1) % BLS.length];
  const bet = Math.round(frac * 9.9 * 10) / 10;
  const p = { id: id(), lv: 1, tp: '기본 팟오즈', ti: `턴 ${DRAW[kind].split(' ')[0] === '플러시' && kind === 'FD' ? '플러시 드로우' : kind === 'OE' ? '오픈엔디드' : kind === 'GS' ? '거트샷' : '콤보 드로우'}, 팟의 ${pc(frac)}% 베팅`, bl: BL(bb), s, h: 'BB', c, b, a: 'f f f f r2.2 f f c | x b2 c | x b' + bet, o: ['f', 'c'], ctx: ASSUME };
  const st = check(p), nd = need(st), eq = o / 46;
  const call = eq > nd + 0.012; if (!call && eq > nd - 0.03) throw new Error('too close ' + p.id);
  p.ans = call ? 1 : 0;
  const stackLeft = bbs((st.hero.stack - st.toCall) / st.bb);
  p.w = `턴에서 상대가 팟 ${bbs(st.pot / st.bb)}BB에 ${bbs(st.toCall / st.bb)}BB를 베팅했습니다. 콜하면 ${bbs(st.toCall / st.bb)}BB로 ${bbs((st.total + st.toCall) / st.bb)}BB를 다투므로 필요한 승률은 약 ${pc(nd)}%입니다. ${DRAW[kind]}의 아웃은 ${o}장이고, 리버 한 장으로 완성될 확률은 약 ${pc(eq)}%(${o}/46)입니다. ` +
    (call ? '필요한 승률보다 높으니 콜합니다.' : `필요한 승률에 크게 못 미칩니다. 콜 뒤 남은 스택도 ${stackLeft}BB라 완성됐을 때 더 받을 칩(임플라이드 오즈)으로 메우기 어렵습니다. 폴드합니다.`);
  p.n = call ? ['필요한 승률보다 실제 승률이 높아 폴드는 손해입니다.', ''] : ['', `${pc(nd)}%가 필요한데 ${pc(eq)}%뿐입니다. 이런 콜을 반복하면 장기적으로 칩을 잃습니다.`];
  out.push(p);
});

// ---------- C2. 플랍 올인 앞의 드로우 (6) ----------
const flopJam = [
  ['QdJd', 'Kd7d2c', 'FD', 6.2], ['Th9h', 'Ah6h2s', 'FD', 30], ['9c8d', '7h6s2c', 'OE', 5.5],
  ['JsTd', '9h8c3s', 'OE', 18.7], ['QcJd', 'Kh9s4c', 'GS', 7.6], ['9s8s', 'Ts7s2d', 'C15', 37.1]
];
flopJam.forEach(([c, b, kind, bbStack], i) => {
  const bb = BLS[(i + 5) % BLS.length];
  const p = { id: id(), lv: 1, tp: '기본 팟오즈', ti: `플랍 올인 앞의 ${kind === 'FD' ? '플러시 드로우' : kind === 'OE' ? '오픈엔디드' : kind === 'GS' ? '거트샷' : '콤보 드로우'}`, bl: BL(bb), s: { d: 40, BB: bbStack }, h: 'CO', c, b, a: 'f f f f r2.2 f f c | a', o: ['f', 'c'], ctx: ASSUME };
  const st = check(p), nd = need(st), eq = eq2(c, b);
  const call = eq > nd + 0.03; if (!call && eq > nd - 0.03) throw new Error('too close ' + p.id + ' ' + eq + ' ' + nd);
  p.ans = call ? 1 : 0;
  p.w = `BB가 플랍에서 ${bbs(st.toCall / st.bb)}BB를 올인했습니다. 콜하면 ${bbs(st.toCall / st.bb)}BB로 ${bbs((st.total + st.toCall) / st.bb)}BB를 다투므로 약 ${pc(nd)}%가 필요합니다. 올인이라 턴과 리버를 모두 보므로, ${DRAW[kind]}가 완성될 확률은 약 ${pc(eq)}%입니다(4의 법칙: 아웃 × 4). ` + (call ? '필요한 승률보다 높아 콜합니다.' : '필요한 승률보다 낮아 폴드합니다.');
  p.n = call ? ['필요한 승률보다 실제 승률이 높아 폴드는 손해입니다.', ''] : ['', `두 장을 모두 봐도 ${pc(eq)}%로, 필요한 ${pc(nd)}%에 못 미칩니다.`];
  out.push(p);
});

// ---------- C3. SB 올인에 BB 콜 판단 (5) ----------
const sbJam = [[8, 60, 'Td7c'], [10, 45, 'Kc9d'], [12, 35, 'Ah7d'], [6, 70, 'Qc4d'], [15, 25, 'Qc9d']];
sbJam.forEach(([S, X, c], i) => {
  const p = { id: id(), lv: 1, tp: '기본 팟오즈', ti: `SB ${S}BB 올인에 BB ${cls(c)}`, bl: BL(2000), s: { d: 30, SB: S }, h: 'BB', c, b: '', a: 'f f f f f f a', o: ['f', 'c'], ctx: `SB는 이 상황에서 상위 ${X}% 핸드로 올인합니다.` };
  const st = check(p), nd = need(st), eq = L.eqv(c, 'top:' + X, '');
  const call = eq > nd + 0.03; if (!call && eq > nd - 0.03) throw new Error('too close ' + p.id + ' ' + eq + ' ' + nd);
  p.ans = call ? 1 : 0;
  p.w = `SB가 ${S}BB를 올인했습니다. 팟에는 ${bbs(st.total / st.bb)}BB가 있고 ${bbs(st.toCall / st.bb)}BB를 더 내야 하므로 필요한 승률은 약 ${pc(nd)}%입니다. SB의 올인 범위(상위 ${X}%)를 상대로 ${cls(c)}의 승률은 약 ${pc(eq)}%입니다. ` + (call ? '필요한 승률보다 높아 콜합니다.' : '필요한 승률보다 낮아 폴드합니다.');
  p.n = call ? ['필요한 승률보다 실제 승률이 높습니다. 숏스택의 넓은 올인에 너무 타이트하게 폴드하면 블라인드를 계속 빼앗깁니다.', ''] : ['', `상대 범위가 좁아 ${cls(c)}의 승률(${pc(eq)}%)이 필요한 승률(${pc(nd)}%)보다 낮습니다.`];
  out.push(p);
});

// ---------- D. 체크와 밸류 베팅 (21) ----------
const CAT = ['하이카드', '원페어', '투페어', '트립스', '스트레이트', '플러시', '풀하우스', '포카드', '스트레이트 플러시'];
const cat = (c, b) => Math.floor(EQ.evalHand(EQ.cards(c + b)) / 1e10);
// D1 리버 넛 → 베팅 (6)
[['AhKh', 'Qh7h2c9s3h'], ['JcTd', 'Qs9h8c2d5s'], ['KcKs', 'Kd7h2s9c4d'], ['9s8s', '7h6c5dKs2c'], ['AcQc', 'KcJc4d7c2h'], ['Ts9s', 'Jh8d7c2s3h']].forEach(([c, b], i) => {
  if (!L.isNuts(c, b)) throw new Error('not nuts ' + c + b);
  const made = CAT[cat(c, b)];
  const p = { id: id(), lv: 1, tp: '체크와 밸류 베팅', ti: `리버 넛 ${made}`, bl: BL(BLS[(i + 2) % BLS.length]), s: 40, h: 'BTN', c, b, a: 'f f f f f r2.2 f c | x b2 c | x x | x', o: ['x', 'b3.3', 'b7.5', 'a'], ans: 2 };
  check(p);
  p.w = `리버에서 ${made}로 이 보드의 넛을 만들었고 상대는 체크했습니다. 넛은 베팅해서 칩을 받아야 합니다. 상대는 플랍 베팅에 콜했으니 페어나 빗나간 드로우, 약한 메이드 핸드가 남아 있습니다. 팟의 3/4 정도면 페어와 투페어에게 콜을 받으면서 가장 많은 칩을 얻습니다.`;
  p.n = ['넛으로 체크하면 받을 수 있는 칩을 포기합니다.', '작은 베팅은 콜은 쉽게 받지만 넛으로 얻을 칩이 적습니다.', '', '팟의 3배가 넘는 올인은 더 강한 핸드만 콜하는데, 지금 상대 범위에는 그런 핸드가 거의 없습니다.'];
  out.push(p);
});
// D2 쇼다운 가치 → 체크 (5)
[['9c8c', 'Kd9s5h2c3d'], ['Td7d', 'AsTs4c8h2c'], ['6h5h', 'Js6c3d9s2h'], ['Kh3h', 'AhQd3s8c7d'], ['Jh9d', 'Qs9c5d2h4s']].forEach(([c, b], i) => {
  if (cat(c, b) !== 1) throw new Error('not one pair ' + c + b);
  const pr = EQ.cards(c).map(x => x >> 2).find(r => EQ.cards(b).some(y => (y >> 2) === r));
  const top = Math.max(...EQ.cards(b).map(y => y >> 2));
  if (pr >= top) throw new Error('top pair ' + c + b);
  const RN = r => '23456789TJQKA'[r].replace('T', '10');
  const p = { id: id(), lv: 1, tp: '체크와 밸류 베팅', ti: `리버 ${RN(pr)} 페어, 상대 체크`, bl: BL(BLS[(i + 4) % BLS.length]), s: 40, h: 'BTN', c, b, a: 'f f f f f r2.2 f c | x b2 c | x x | x', o: ['x', 'b3.3', 'b7.5'], ans: 0 };
  check(p);
  p.w = `${RN(pr)} 페어는 쇼다운에서 이길 수 있지만 강한 핸드는 아닙니다. 지금 베팅하면 ${RN(top)}를 가진 더 좋은 핸드만 콜하고, 더 약한 핸드는 폴드합니다. 이런 핸드는 체크로 쇼다운에 가는 것이 가장 이득입니다. 밸류 베팅은 더 약한 핸드가 콜해 줄 때만 성립합니다.`;
  p.n = ['', '작은 베팅도 더 좋은 핸드에만 콜을 받고, 체크레이즈를 맞으면 폴드해야 합니다.', '큰 베팅은 더 좋은 핸드만 콜하게 만들어 손실만 커집니다.'];
  out.push(p);
});
// D3 드라이 보드 탑페어 → 베팅 (4)
[['HJ', 'AsQd', 'Qc7h3s'], ['CO', 'KhJd', 'Jc6s2h'], ['BTN', 'AdTc', 'Th5c2s'], ['CO', 'KsQc', 'Kd8h4c']].forEach(([pos, c, b], i) => {
  const P = PD.posName(pos);
  const p = { id: id(), lv: 1, tp: '체크와 밸류 베팅', ti: `드라이 보드 탑페어, ${P}`, bl: BL(BLS[(i + 6) % BLS.length]), s: 40, h: pos, c, b, a: L.foldsBefore(pos).concat(['r2.2']).concat(Array(7 - PD.POS[8].indexOf(pos) - 1).fill('f')).concat(['c']).join(' ') + ' | x', o: ['x', 'b2', 'b4.4', 'a'], ans: [1, 2] };
  const st = check(p);
  p.w = `${b.match(/../g).map(x => x[0].replace('T', '10')).join('-')} 레인보우 보드에서 탑페어를 맞혔고 키커도 좋습니다. 드로우가 거의 없는 보드라 상대의 더 약한 페어와 포켓페어에게서 밸류를 받을 수 있습니다. 1/3 팟 정도의 작은 베팅이 효율적이고, 3/4 팟도 가능합니다.`;
  p.n = ['체크하면 약한 페어에게서 받을 밸류와 주도권을 놓칩니다.', '', '', `${bbs(st.hero.stack / st.bb)}BB 올인은 더 강한 핸드에만 콜을 받습니다.`];
  out.push(p);
});
// D4 젖은 보드의 강한 핸드 → 크게 베팅 (3)
[['9s9d', '9h8h6c'], ['JdTc', 'JhTh4s'], ['8c8d', '8h7h2s']].forEach(([c, b], i) => {
  const made = cat(c, b) === 3 ? '탑 세트' : '탑 투페어';
  const p = { id: id(), lv: 1, tp: '체크와 밸류 베팅', ti: `젖은 보드의 ${made}`, bl: BL(BLS[(i + 1) % BLS.length]), s: 40, h: 'BTN', c, b, a: 'f f f f f r2.2 f c | x', o: ['x', 'b1.5', 'b4.4', 'a'], ans: 2 };
  check(p);
  p.w = `${made}는 지금 매우 강하지만 이 보드에는 하트 플러시 드로우와 스트레이트 드로우가 많습니다. 3/4 팟 정도로 베팅해 드로우가 다음 카드를 보려면 비싼 값을 치르게 하고, 더 약한 페어와 드로우에게서 밸류를 받습니다.`;
  p.n = ['체크하면 드로우에게 공짜 카드를 줍니다. 젖은 보드에서 슬로우플레이는 위험합니다.', '1/4 팟 베팅은 드로우에게 약 17%만 이기면 되는 좋은 가격을 줍니다.', '', '팟의 6배가 넘는 올인은 약한 핸드와 드로우를 모두 폴드시켜 밸류가 줄어듭니다.'];
  out.push(p);
});
// D5 리버 넛, 작은 베팅을 받음 → 레이즈 (3)
[['7d6d', '5c4hKs8s2d'], ['AsJs', 'Ks9s4d2s7h'], ['Th9h', 'Jc8d7sKh2d']].forEach(([c, b], i) => {
  if (!L.isNuts(c, b)) throw new Error('not nuts ' + c + b);
  const made = CAT[cat(c, b)];
  const p = { id: id(), lv: 1, tp: '체크와 밸류 베팅', ti: `리버 넛 ${made}, 작은 베팅을 받음`, bl: BL(BLS[(i + 3) % BLS.length]), s: 40, h: 'BB', c, b, a: 'f f f f f r2.2 f c | x b2 c | x x | x b3.3', o: ['f', 'c', 'r11', 'a'], ans: [2, 3] };
  check(p);
  p.w = `리버에서 ${made}로 넛을 만들었는데 상대가 팟 9.9BB에 3.3BB를 작게 베팅했습니다. 상대의 작은 베팅에는 얇은 밸류와 블러프가 섞여 있습니다. 콜만 하면 받을 칩이 적으니 레이즈로 팟을 키웁니다.`;
  p.n = ['넛을 버리는 큰 실수입니다.', '콜도 이기지만 상대의 페어나 투페어에게서 더 받을 칩을 놓칩니다.', '', ''];
  out.push(p);
});

if (out.length !== 70) throw new Error('count ' + out.length);
L.write(__dirname + '/../problems/g1.js', out);
