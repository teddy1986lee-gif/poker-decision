/* 중급 60문제 생성: M41–M100 */
const L = require('./lib.js');
const { PD, EQ, bbs, pc, BL, cls, need } = L;
const check = L.chk;
const out = [];
let n = 41;
const id = () => 'M' + String(n++).padStart(2, '0');
const BLS = [400, 500, 600, 800, 1000, 1200, 1500, 2000];
const P8 = PD.POS[8];
const ga = pos => (pos === 'BTN' || pos === 'U1' ? '이' : '가');
const eun = pos => (pos === 'BTN' || pos === 'U1' ? '은' : '는');
const key = c => (c[0] < c[1] ? c[0] + '-' + c[1] : c[1] + '-' + c[0]);
const cat = (c, b) => Math.floor(EQ.evalHand(EQ.cards(c + b)) / 1e10);
const RN = r => '23456789TJQKA'[r].replace('T', '10');

/** op 오픈 → vill 3벳 → 나머지 폴드 → op 차례 */
function threeBetLine(op, vill, open, size3) {
  const io = P8.indexOf(op), iv = P8.indexOf(vill);
  return [...Array(io).fill('f'), 'r' + open, ...Array(iv - io - 1).fill('f'), 'r' + size3, ...Array(P8.length - iv - 1).fill('f')].join(' ');
}
/** op 오픈, BB만 콜 */
function openBB(op, open = 2.2) { const io = P8.indexOf(op); return [...Array(io).fill('f'), 'r' + open, ...Array(P8.length - io - 2).fill('f'), 'c'].join(' '); }

// ---------- A. 3벳 대응: 4벳 올인 또는 폴드 (15) ----------
const RANGES = {
  LAG: ['77+,A9s+,ATo+,KTs+,KQo,QJs,JTs,A5s-A2s', 'TT+,AQs+,AKo', '77+, A9s+, ATo+, KTs+, KQo, QJs, JTs, A5s~A2s', 'TT+, AQs+, AKo', '3벳을 매우 넓게 하는 공격적인 플레이어'],
  STD: ['TT+,AQs+,AKo,A5s-A4s,KQs', 'JJ+,AK', 'TT+, AQs+, AKo, KQs와 일부 A5s·A4s', 'JJ+, AK', '평범한 3벳 범위를 가진 플레이어'],
  TGT: ['QQ+,AKs,AKo', 'QQ+,AKs,AKo', 'QQ+, AK', 'QQ+, AK', '3벳을 아주 강한 핸드로만 하는 타이트한 플레이어']
};
const tb = [
  ['CO', 'BTN', 5.5, 22, 'LAG', 'AhJd'], ['HJ', 'CO', 5.5, 25, 'LAG', '8s8h'], ['BTN', 'SB', 7, 20, 'LAG', 'Kh9h'],
  ['CO', 'SB', 7, 18, 'LAG', '6c6d'], ['BTN', 'BB', 7.5, 24, 'LAG', 'KdQc'], ['BTN', 'SB', 7, 20, 'STD', 'Ac5c'],
  ['HJ', 'BTN', 5.5, 24, 'LAG', 'Ac8c'], ['CO', 'BTN', 5.5, 20, 'LAG', 'QhJh'], ['BTN', 'BB', 7.5, 22, 'LAG', '7d7s'],
  ['UTG', 'CO', 5.5, 30, 'TGT', 'AhJh'], ['HJ', 'BB', 7.5, 26, 'TGT', 'KsQs'], ['CO', 'BTN', 5.5, 28, 'TGT', '9h9s'],
  ['BTN', 'SB', 7, 22, 'TGT', 'AdQc'], ['MP', 'HJ', 5.5, 30, 'TGT', 'TsTc'], ['HJ', 'CO', 5.5, 28, 'STD', 'AhTd']
];
tb.forEach(([op, vill, size3, S, kind, c], i) => {
  const [r3, rc, r3t, rct, who] = RANGES[kind];
  const bb = BLS[i % BLS.length], h = cls(c), O = PD.posName(op), V = PD.posName(vill);
  const p = { id: id(), lv: 2, tp: '3벳 대응', ti: `${S}BB ${O} ${h}, ${V}의 3벳`, bl: BL(bb), s: S, h: op, c, b: '', a: threeBetLine(op, vill, 2.2, size3), o: ['f', 'c', 'a'], ctx: `${V}${eun(vill)} ${who}입니다. 3벳 범위는 ${r3t}이고, ${kind === 'TGT' ? '올인을 받으면 모두 콜합니다.' : '올인을 받으면 ' + rct + '로만 콜합니다.'}` };
  const st = check(p);
  const dead = new Set(EQ.cards(c));
  const s3 = new Set(EQ.parseRange(r3).filter(x => !dead.has(x[0]) && !dead.has(x[1])).map(key));
  const sc = EQ.parseRange(rc).filter(x => !dead.has(x[0]) && !dead.has(x[1])).map(key).filter(k => s3.has(k));
  const F = 1 - sc.length / s3.size, eq = L.eqv(c, rc, '', 40000);
  const hp = st.hero, vp = st.pl.find(x => x.k === vill);
  const E = Math.min(hp.start, vp.start), Pf = st.total - hp.inv - vp.inv + 2 * E;
  const ev = (F * st.total + (1 - F) * (eq * Pf - (E - hp.inv))) / bb;
  if (Math.abs(ev) < 1) throw new Error('too close ' + p.id + ' ' + ev);
  const jam = ev > 0;
  p.ans = jam ? 2 : 0;
  const callLeft = bbs((hp.stack - st.toCall) / bb), potCall = bbs((st.total + st.toCall) / bb);
  const evTxt = `${ev > 0 ? '+' : ''}${bbs(ev)}BB`;
  p.w = `${V}${ga(vill)} ${size3}BB로 3벳했습니다. 스택이 ${S}BB로 짧아 콜하면 팟이 ${potCall}BB인데 남은 칩은 ${callLeft}BB뿐이라, 플랍에서 대부분 올인으로 이어집니다. 그래서 4벳 올인과 폴드를 비교합니다. ` +
    (F > 0 ? `올인하면 ${V}${eun(vill)} 3벳 범위의 약 ${pc(F)}%를 폴드하고, ` : `${V}${eun(vill)} 3벳 범위 전체로 올인에 콜하므로 폴드를 기대할 수 없고, `) +
    `콜하는 범위(${rct})를 상대로 ${h} 핸드의 승률은 약 ${pc(eq)}%입니다. 이를 합하면 올인의 기대값은 폴드보다 약 ${evTxt}입니다. ` +
    (jam ? '올인합니다.' : '폴드합니다.');
  p.n = jam
    ? [`폴드하면 지금 팟 ${bbs(st.total / bb)}BB를 그대로 넘겨줍니다. 올인의 기대값이 더 높습니다.`, '콜하면 상대를 폴드시킬 기회를 버리고, 플랍에서 지배당하거나 불리한 상태로 올인하게 됩니다.', '']
    : ['', '콜해도 상대의 강한 범위를 상대로 포지션 없이, 또는 지배당한 채 큰 팟을 플레이하게 됩니다.', `올인의 기대값은 약 ${evTxt}로 손해입니다. 상대가 거의 폴드하지 않습니다.`];
  out.push(p);
});

// ---------- B. 드로우의 콜 판단 (15) ----------
function outsOf(hero, board) {
  const h = EQ.cards(hero), b = EQ.cards(board), dead = new Set([...h, ...b]); let k = 0;
  for (let c = 0; c < 52; c++) { if (dead.has(c)) continue; if (Math.floor(EQ.evalHand([...h, ...b, c]) / 1e10) >= 4) k++; }
  return k;
}
const IMPL = '상대는 탑페어 이상으로 보이며, 드로우가 완성되면 리버에 추가 베팅에도 자주 콜하는 플레이어입니다.';
// B1 임플라이드 오즈로 콜 (5): CO 오픈, BTN 콜, 깊은 스택
[['AsTs', 'Ks8s3d2c'], ['JdTc', '9c8h2s3d'], ['Ah5h', 'Kh9h4c2d'], ['8d7d', '6s5cKh2h'], ['AdQd', 'Td6d2s3c']].forEach(([c, b], i) => {
  const o = outsOf(c, b), eq = o / 46;
  const p = { id: id(), lv: 2, tp: '드로우의 콜 판단', ti: `깊은 스택 턴 드로우(${o}아웃)`, bl: BL(BLS[(i + 2) % BLS.length]), s: 100, h: 'BTN', c, b, a: 'f f f f r2.2 c f f | b2.5 c | b8', o: ['f', 'c'], ctx: IMPL };
  const st = check(p), nd = need(st);
  if (eq >= nd) throw new Error('direct odds already ' + p.id);
  const X = (st.toCall / eq - (st.total + st.toCall)) / st.bb, left = (st.hero.stack - st.toCall) / st.bb;
  if (X > left * 0.35) throw new Error('implied too big ' + p.id + ' ' + X);
  p.ans = 1;
  p.w = `턴에 팟 ${bbs(st.pot / st.bb)}BB에 ${bbs(st.toCall / st.bb)}BB 베팅을 받았습니다. 지금 가격만 보면 약 ${pc(nd)}%가 필요한데, 아웃 ${o}장으로 리버에 완성될 확률은 약 ${pc(eq)}%입니다. 모자란 만큼은 완성됐을 때 더 받을 칩(임플라이드 오즈)으로 채울 수 있습니다. 손익분기를 맞추려면 리버에 약 ${bbs(X)}BB만 더 받으면 되는데, 콜 뒤에도 스택이 ${bbs(left)}BB나 남아 있고 상대는 강한 핸드라 콜해 줄 가능성이 큽니다. 콜합니다.`;
  p.n = ['당장의 팟오즈만 보고 폴드하면, 스택이 깊을 때 드로우가 가진 숨은 가치를 버리게 됩니다.', ''];
  out.push(p);
});
// B2 임플라이드 오즈 부족 (4): 얕은 스택, 팟 크기 베팅
[['KhQh', 'Th7h2c4s'], ['9s8c', '7d6hKs2c'], ['AdJd', 'Kd8d4c3s'], ['6c5c', '4d3hKs9c']].forEach(([c, b], i) => {
  const o = outsOf(c, b), eq = o / 46;
  const p = { id: id(), lv: 2, tp: '드로우의 콜 판단', ti: `얕은 스택 턴 드로우, 팟 베팅`, bl: BL(BLS[(i + 5) % BLS.length]), s: 25, h: 'BTN', c, b, a: 'f f f f r2.2 c f f | b2.5 c | b11.9', o: ['f', 'c', 'a'], ctx: '상대는 탑페어 이상으로 보입니다.' };
  const st = check(p), nd = need(st);
  const X = (st.toCall / eq - (st.total + st.toCall)) / st.bb, left = (st.hero.stack - st.toCall) / st.bb;
  if (X < left * 1.5) throw new Error('implied might be enough ' + p.id);
  p.ans = 0;
  p.w = `턴에 팟 크기(${bbs(st.toCall / st.bb)}BB) 베팅을 받아 약 ${pc(nd)}%가 필요하지만, 아웃 ${o}장의 완성 확률은 약 ${pc(eq)}%입니다. 임플라이드 오즈로 메우려면 완성됐을 때 리버에 약 ${bbs(X)}BB를 더 받아야 하는데, 콜 뒤 남은 스택은 ${bbs(left)}BB뿐입니다. 스택이 얕으면 임플라이드 오즈가 작습니다. 폴드합니다.`;
  p.n = ['', `가격도 맞지 않고, 더 받을 칩도 최대 ${bbs(left)}BB라 부족합니다.`, '올인 세미블러프는 탑페어 이상의 상대가 거의 폴드하지 않아 손해가 큽니다.'];
  out.push(p);
});
// B3 더러운 아웃: 상대 세트 가정 (3)
[['AhTh', 'Kh8h3c5d', '8s8d', 0.5], ['QcJc', 'Tc6c2d9s', '6h6s', 0.5], ['9h8h', '7h6c2hQd', '2c2s', 1]].forEach(([c, b, v, frac], i) => {
  const h = EQ.cards(c), bd = EQ.cards(b), vv = EQ.cards(v), dead = new Set([...h, ...bd, ...vv]);
  let win = 0, tot = 0, dirty = [], raw = 0;
  for (let x = 0; x < 52; x++) {
    if (dead.has(x)) continue; tot++;
    const me = EQ.evalHand([...h, ...bd, x]), op = EQ.evalHand([...vv, ...bd, x]);
    const madeDraw = Math.floor(me / 1e10) >= 4;
    if (madeDraw) raw++;
    if (me > op) win++; else if (madeDraw) dirty.push('23456789TJQKA'[x >> 2].replace('T', '10') + '♠♥♦♣'['shdc'.indexOf('shdc'[x & 3])]);
  }
  const eq = win / tot;
  const pot = 9.9, bet = Math.round(frac * pot * 10) / 10;
  const p = { id: id(), lv: 2, tp: '드로우의 콜 판단', ti: `세트를 상대로 한 드로우(더러운 아웃)`, bl: BL(BLS[(i + 1) % BLS.length]), s: 40, h: 'BB', c, b, a: 'f f f f r2.2 f f c | x b2 c | x b' + bet, o: ['f', 'c'], ctx: `상대의 핸드를 세트(${v[0].replace('T', '10')} 세 장)로 가정합니다.` };
  const st = check(p), nd = need(st);
  if (Math.abs(eq - nd) < 0.03) throw new Error('too close ' + p.id + ' ' + eq + ' ' + nd);
  p.ans = eq > nd ? 1 : 0;
  p.w = `상대가 세트라면 보드를 페어로 만드는 카드는 내 드로우를 완성해도 상대에게 풀하우스를 줍니다. 완성 카드 ${raw}장 중 ${dirty.length}장(${dirty.join(', ')})이 이런 더러운 아웃이라, 실제로 이기는 리버는 ${win}장, 승률은 약 ${pc(eq)}%입니다. 콜에 필요한 승률은 약 ${pc(nd)}%입니다. ` + (eq > nd ? '더러운 아웃을 빼도 가격이 맞으니 콜합니다.' : '더러운 아웃을 빼면 가격이 맞지 않아 폴드합니다.');
  p.n = eq > nd ? ['깨끗한 아웃만 세어도 필요한 승률보다 높습니다.', ''] : ['', `아웃을 ${raw}장으로 세면 가격이 맞아 보이지만, 실제로 이기는 카드는 ${win}장뿐입니다.`];
  out.push(p);
});
// B4 체크를 받은 턴의 세미블러프 (3)
[['CO', 'JhTh', 'Qh9h3c2s'], ['BTN', '8c7c', '9c6cKd2h'], ['HJ', 'Ad5d', 'Kd4d3sTc']].forEach(([pos, c, b], i) => {
  const o = outsOf(c, b);
  const p = { id: id(), lv: 2, tp: '드로우의 콜 판단', ti: `턴 ${o}아웃 드로우, 상대 체크`, bl: BL(BLS[(i + 3) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x b2 c | x', o: ['x', 'b6.5', 'a'], ans: 1 };
  const st = check(p);
  p.w = `상대가 턴에 체크했습니다. 내 핸드는 아직 페어가 없지만 아웃이 ${o}장(리버 완성 약 ${pc(o / 46)}%)인 강한 드로우입니다. 2/3 팟 정도로 베팅하면 상대의 약한 페어나 빗나간 핸드를 폴드시켜 지금 팟을 가져올 수 있고, 콜을 받아도 리버에 완성될 기회가 있습니다(세미블러프). 체크하면 공짜 카드는 보지만 폴드 에퀴티를 버립니다.`;
  p.n = ['체크도 나쁘지 않지만, 상대를 폴드시켜 팟을 가져올 기회를 버립니다.', '', `${bbs(st.hero.stack / st.bb)}BB 올인은 팟의 3배가 넘어, 상대가 폴드할 핸드는 작은 베팅으로도 폴드하고 강한 핸드에만 콜을 받습니다.`];
  out.push(p);
});

// ---------- C. 베팅 크기 (15) ----------
// C1 아이솔레이트 레이즈 크기 (4)
[[['U1'], 'BTN', 'AhQc', 4], [['UTG', 'HJ'], 'CO', 'KsQs', 5], [['MP'], 'SB', 'AdJd', 5], [['UTG', 'CO'], 'BB', 'AcKh', 6]].forEach(([limpers, hero, c, size], i) => {
  const t = [];
  for (const k of P8) { if (k === hero) break; t.push(limpers.includes(k) ? 'c' : 'f'); }
  if (hero === 'BB') { t.push(...[]); }
  const ip = hero !== 'SB' && hero !== 'BB';
  const opts = ip ? ['c', 'r2.2', 'r' + size, 'a'] : [hero === 'BB' ? 'x' : 'c', 'r2.5', 'r' + size, 'a'];
  const p = { id: id(), lv: 2, tp: '베팅 크기', ti: `림퍼 ${limpers.length}명 뒤 ${PD.posName(hero)} ${cls(c)}`, bl: BL(BLS[(i + 4) % BLS.length]), s: 50, h: hero, c, b: '', a: t.join(' '), o: opts, ans: 2 };
  const st = check(p);
  const base = ip ? 3 : 4;
  p.w = `앞에서 ${limpers.map(PD.posName).join('·')}${limpers.length > 1 ? '가' : ga(limpers[0])} 림프했습니다. ${cls(c)}는 림프 범위를 크게 앞서니 레이즈로 팟을 키우고 림퍼를 혼자 상대(아이솔레이트)합니다. 기본 크기는 ${ip ? '포지션이 있을 때 약 3BB' : '포지션이 없을 때 약 4BB'}에 림퍼 한 명당 1BB를 더해, ${base}+${limpers.length} = ${size}BB 정도입니다. 너무 작으면 림퍼와 블라인드가 싸게 따라옵니다.`;
  p.n = [ip ? '같이 림프하면 블라인드까지 싸게 들어와 강한 핸드의 우위가 줄어듭니다.' : (hero === 'BB' ? '체크하면 강한 핸드로 팟을 키울 기회를 놓칩니다.' : '완성(콜)만 하면 강한 핸드로 팟을 키울 기회를 놓칩니다.'), '작은 레이즈는 림퍼들에게 좋은 가격을 줘 여러 명이 따라오게 만듭니다.', '', `${bbs((st.hero.stack + st.hero.bet) / st.bb)}BB 올인은 림퍼의 약한 핸드를 모두 폴드시키고 강한 핸드에만 콜을 받습니다.`];
  out.push(p);
});
// C2 3벳 크기: 포지션 있을 때 3배, 없을 때 4~4.5배 (4)
[['CO', 'BTN', 'AsKs', 50], ['BTN', 'SB', 'QhQd', 50], ['HJ', 'CO', 'JcJd', 60], ['CO', 'BB', 'AhKd', 50]].forEach(([op, hero, c, S], i) => {
  const io = P8.indexOf(op), ih = P8.indexOf(hero);
  const a = [...Array(io).fill('f'), 'r2.2', ...Array(ih - io - 1).fill('f')].join(' ');
  const ip = hero !== 'SB' && hero !== 'BB';
  const p = { id: id(), lv: 2, tp: '베팅 크기', ti: `${PD.posName(op)} 오픈에 ${PD.posName(hero)} ${cls(c)} 3벳 크기`, bl: BL(BLS[(i + 6) % BLS.length]), s: S, h: hero, c, b: '', a, o: ['c', 'r4.4', 'r6.6', 'r10', 'a'], ans: ip ? 2 : 3 };
  check(p);
  p.w = ip
    ? `${PD.posName(op)}의 2.2BB 오픈에 포지션을 가진 ${PD.posName(hero)}에서 3벳합니다. 포지션이 있으면 오픈의 약 3배(6.6BB)가 표준입니다. 플랍 이후 유리하게 플레이할 수 있어 팟을 지나치게 키울 필요가 없고, 상대가 약한 핸드로 따라오기에는 충분히 비쌉니다.`
    : `${PD.posName(op)}의 2.2BB 오픈에 포지션이 없는 ${PD.posName(hero)}에서 3벳합니다. 포지션이 없으면 오픈의 4~4.5배(약 10BB)로 크게 합니다. 상대가 좋은 가격에 콜하고 포지션을 가진 채 플랍을 보지 못하게 하기 위해서입니다.`;
  p.n = ['콜은 강한 핸드의 밸류를 덜 받고, 뒤 플레이어의 스퀴즈도 허용합니다.', '미니 3벳은 상대에게 2.2BB만 더 내면 되는 아주 좋은 가격을 줍니다.', ip ? '' : '포지션이 없을 때 3배는 작습니다. 상대가 쉽게 콜하고 포지션을 가진 채 플랍을 봅니다.', ip ? '포지션이 있을 때 4.5배는 불필요하게 큽니다. 약한 핸드는 다 폴드하고 강한 핸드만 남습니다.' : '', `${S}BB 올인은 상대의 블러프와 약한 핸드를 모두 폴드시키고 강한 핸드에만 콜을 받습니다.`];
  out.push(p);
});
// C3 c-벳 크기: 드라이 보드 작게, 젖은 보드 크게 (4)
[['BTN', 'AhKd', 'Ad7c2s', 'dry'], ['CO', 'KcKd', 'Kh9h8s', 'wet'], ['HJ', 'AsAc', 'Qd6h2c', 'dry'], ['BTN', 'JhJs', 'Td9d4s', 'wet']].forEach(([pos, c, b, kind], i) => {
  const p = { id: id(), lv: 2, tp: '베팅 크기', ti: `${kind === 'dry' ? '드라이' : '젖은'} 보드 c-벳 크기`, bl: BL(BLS[(i + 1) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x', o: ['x', 'b2', 'b4.4', 'b8.8'], ans: kind === 'dry' ? 1 : 2 };
  check(p);
  p.w = kind === 'dry'
    ? `드로우가 거의 없는 드라이 보드이고 강한 핸드도 레이저 쪽에 많습니다. 이런 보드에서는 1/3 팟 정도의 작은 c-벳으로 충분합니다. 작게 베팅해도 상대의 약한 핸드는 계속 따라오고, 지켜야 할 드로우가 적어 크게 베팅할 이유가 없습니다.`
    : `연결되고 수트가 맞는 젖은 보드라 상대에게 플러시·스트레이트 드로우가 많습니다. 강한 핸드로는 3/4 팟 정도로 크게 베팅해, 드로우가 다음 카드를 보려면 비싼 값을 치르게 하고 밸류도 더 받습니다.`;
  p.n = kind === 'dry'
    ? ['체크도 가능하지만, 약한 핸드에게서 받을 밸류와 주도권을 놓칩니다.', '', '드라이 보드에서 큰 베팅은 더 약한 핸드를 폴드시켜 밸류가 줄어듭니다.', '1.5배 오버벳은 이 보드에서 과합니다. 콜하는 핸드가 대부분 더 강해집니다.']
    : ['체크하면 드로우에게 공짜 카드를 줍니다.', '1/3 팟은 드로우에게 너무 좋은 가격을 줍니다.', '', '오버벳은 드로우뿐 아니라 약한 페어까지 모두 폴드시켜 밸류가 줄어듭니다.'];
  out.push(p);
});
// C4 낮은 SPR: 올인으로 단순하게 (3)
[['CO', 'AhQs', 'Qd8c3h7s', 14], ['BTN', 'KsKh', 'Jd6c2s9h', 13], ['HJ', 'AdJc', 'Jh5s2d4c', 15]].forEach(([pos, c, b, S], i) => {
  const p = { id: id(), lv: 2, tp: '베팅 크기', ti: `${S}BB, 턴 SPR 1 근처`, bl: BL(BLS[(i + 7) % BLS.length]), s: S, h: pos, c, b, a: openBB(pos) + ' | x b2 c | x', o: ['x', 'b3.3', 'a'], ans: [1, 2] };
  const st = check(p);
  const spr = st.hero.stack / st.pot;
  p.w = `남은 스택(${bbs(st.hero.stack / st.bb)}BB)이 팟(${bbs(st.pot / st.bb)}BB)과 거의 같아 SPR이 약 ${spr.toFixed(1)}입니다. 이 정도면 이 핸드로 스택을 걸 준비가 된 상태라, 올인으로 단순하게 가거나 작게 베팅해도 됩니다. 체크만 피합니다. 체크하면 드로우에게 공짜 카드를 주고 밸류를 한 스트리트 잃습니다.`;
  p.n = ['체크는 위험한 리버를 공짜로 보여 주고 밸류를 잃습니다.', '', ''];
  out.push(p);
});

// ---------- D. 턴 액션 (15) ----------
// D1 레이저에게 유리한 턴 카드 + 에퀴티 → 다시 베팅 (3)
[['CO', 'QsJs', 'Ts4d2cKs'], ['CO', 'AhJh', '8h5c2dKh'], ['BTN', 'KdJd', '7d4s2cAd']].forEach(([pos, c, b], i) => {
  const p = { id: id(), lv: 2, tp: '턴 액션', ti: `턴 ${b.slice(6, 7).replace('T', '10')}, 더블 배럴`, bl: BL(BLS[i % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x b2 c | x', o: ['x', 'b6.5', 'a'], ans: 1 };
  const st = check(p);
  p.w = `턴 ${b.slice(6, 7).replace('T', '10')}는 오픈한 쪽 범위에 많은 높은 카드라, 플랍에 콜한 BB의 낮은 페어가 불편해집니다. 내 핸드는 이 카드로 플러시 드로우가 생겨 지고 있어도 이길 카드가 많습니다. 2/3 팟 정도로 다시 베팅해 상대의 약한 페어를 폴드시키고, 콜을 받으면 드로우로 이길 기회를 노립니다.`;
  p.n = ['좋은 배럴 카드와 드로우를 함께 버리는 선택입니다.', '', `${bbs(st.hero.stack / st.bb)}BB 올인은 큰 위험에 비해 얻는 것이 작은 베팅과 비슷합니다.`];
  out.push(p);
});
// D2 콜한 쪽에 유리한 턴 + 에어 → 포기 (3)
[['CO', 'KcQd', 'Jh6s5d4h'], ['HJ', 'AdKc', '9c7h6s8d'], ['BTN', 'QcJd', '8s7d5c6h']].forEach(([pos, c, b], i) => {
  if (cat(c, b) !== 0) throw new Error('should be air ' + c + b);
  const p = { id: id(), lv: 2, tp: '턴 액션', ti: `연결되는 턴, 에어로 포기`, bl: BL(BLS[(i + 2) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x b2 c | x', o: ['x', 'b6.5', 'a'], ans: 0 };
  const st = check(p);
  p.w = `턴 카드로 보드가 더 연결되어, BB가 넓게 디펜스한 낮은 카드 범위(투페어, 스트레이트, 드로우)에 유리해졌습니다. 내 핸드는 페어도 없고 이길 아웃도 적습니다. 다시 베팅해도 플랍에 콜한 핸드는 거의 폴드하지 않습니다. 체크로 포기하고 리버를 공짜로 봅니다.`;
  p.n = ['', '상대 범위가 이 턴에 강해져 블러프가 성공하기 어렵습니다.', `${bbs(st.hero.stack / st.bb)}BB 올인 블러프는 상대의 강한 핸드에 그대로 걸립니다.`];
  out.push(p);
});
// D3 타이트한 상대의 턴 체크레이즈 → 원페어 폴드 (3)
[['BTN', 'AcJs', 'Jd8h3c5s'], ['CO', 'KhTc', 'Ks7d4c9h'], ['BTN', 'QsJh', 'Qc6d2h8s']].forEach(([pos, c, b], i) => {
  const p = { id: id(), lv: 2, tp: '턴 액션', ti: `타이트한 상대의 턴 체크레이즈`, bl: BL(BLS[(i + 4) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x b2 c | x b5 r16', o: ['f', 'c', 'a'], ans: 0, ctx: 'BB는 턴 체크레이즈를 투페어 이상으로만 하는 타이트한 플레이어입니다.' };
  const st = check(p);
  p.w = `턴 체크레이즈는 보통 강한 범위이고, 이 상대는 투페어 이상으로만 합니다. 내 핸드는 탑페어 한 쌍이라 그 범위의 거의 모든 핸드에 집니다. ${bbs(st.toCall / st.bb)}BB 콜에 필요한 승률은 약 ${pc(need(st))}%지만 실제 승률은 그보다 훨씬 낮고, 리버에 또 베팅을 받게 됩니다. 폴드합니다.`;
  p.n = ['', '가격만 보면 콜할 만해 보여도 상대 범위가 너무 강합니다. 리버 베팅까지 고려하면 손실이 더 큽니다.', '올인하면 상대의 투페어·세트가 모두 콜합니다.'];
  out.push(p);
});
// D4 플러시가 완성된 턴의 동크 베팅 → TPTK 콜 (3)
[['BTN', 'AcKd', 'Kh9h4c2h'], ['CO', 'AdQc', 'Qs9s4d2s'], ['BTN', 'AhJd', 'Jc7c3d6c']].forEach(([pos, c, b], i) => {
  const p = { id: id(), lv: 2, tp: '턴 액션', ti: `플러시 완성 턴의 동크 베팅`, bl: BL(BLS[(i + 6) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x b2 c | b6.5', o: ['f', 'c', 'r18', 'a'], ans: 1 };
  check(p);
  p.w = `턴에 같은 무늬 세 번째 카드가 깔리자 BB가 먼저 6.5BB를 베팅했습니다. 플러시일 수도 있지만 더 약한 탑페어, 투페어, 페어+드로우, 블러프도 섞여 있습니다. 탑페어 탑키커는 폴드하기에는 너무 강하고, 레이즈하면 플러시에게만 콜을 받고 약한 핸드는 폴드합니다. 콜로 리버까지 갑니다.`;
  p.n = ['한 번의 베팅에 탑페어 탑키커를 버리면 상대가 이 보드에서 마음껏 블러프합니다.', '', '레이즈하면 더 약한 핸드는 폴드하고 플러시만 콜하거나 다시 레이즈합니다.', '올인은 이길 때보다 질 때 더 많이 잃는 선택입니다.'];
  out.push(p);
});
// D5 플랍 체크 후 턴 탑페어 → 딜레이드 c-벳 (3)
[['BTN', 'KhTh', '8c5d2sKd'], ['CO', 'AdJs', '7h4c3dAc'], ['HJ', 'QcTd', '9s5h2cQh']].forEach(([pos, c, b], i) => {
  const p = { id: id(), lv: 2, tp: '턴 액션', ti: `플랍 체크 후 턴 탑페어`, bl: BL(BLS[(i + 3) % BLS.length]), s: 40, h: pos, c, b, a: openBB(pos) + ' | x x | x', o: ['x', 'b2', 'b4', 'a'], ans: [1, 2] };
  const st = check(p);
  p.w = `플랍에서는 맞은 것이 없어 체크로 넘겼고, 턴 카드로 탑페어가 됐습니다. BB가 다시 체크했으니 낮은 페어나 약한 핸드가 많습니다. 지금은 밸류 베팅할 때입니다. 1/3~2/3 팟으로 약한 페어의 콜을 받습니다(딜레이드 c-벳).`;
  p.n = ['탑페어로 두 번 연속 체크하면 밸류를 크게 놓칩니다.', '', '', `${bbs(st.hero.stack / st.bb)}BB 올인은 약한 페어를 모두 폴드시킵니다.`];
  out.push(p);
});

if (out.length !== 60) throw new Error('count ' + out.length);
L.write(__dirname + '/../problems/g2.js', out);
