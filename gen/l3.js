/* 고급 70문제 생성: A31–A100 */
const L = require('./lib.js');
const { PD, EQ, bbs, pc, BL, cls, need } = L;
const check = L.chk;
const SS = require('./sscalc.js');
const IC = require('./icmcalc.js');
const out = [];
let n = 31;
const id = () => 'A' + String(n++).padStart(2, '0');
const P8 = PD.POS[8];
const PN = PD.posName;
const ga = pos => (pos === 'BTN' || pos === 'U1' ? '이' : '가');
const eun = pos => (pos === 'BTN' || pos === 'U1' ? '은' : '는');
const cat = (c, b) => Math.floor(EQ.evalHand(EQ.cards(c + b)) / 1e10);
const f2 = x => x.toFixed(2);

// ================= A. 상대 범위 추정 (18) =================
// A1 같은 핸드, 다른 올인 범위 (6쌍 = 12)
const pairs = [
  ['KdTc', ['UTG', 12, 15], ['BTN', 12, 40]], ['Qd9d', ['CO', 15, 20], ['SB', 15, 50]], ['Kd8c', ['BTN', 15, 30], ['SB', 15, 60]],
  ['Ad9c', ['UTG', 12, 10], ['BTN', 12, 40]], ['Ad5d', ['UTG', 10, 10], ['SB', 10, 55]], ['Kd9c', ['HJ', 14, 16], ['SB', 14, 55]]
];
const POSDESC = { UTG: '가장 앞자리라 뒤에 7명이 남아', U1: '앞자리라 뒤에 6명이 남아', MP: '뒤에 5명이 남아', HJ: '뒤에 4명이 남아', CO: '뒤에 3명이 남아', BTN: '블라인드 두 명만 남아', SB: 'BB 한 명만 남아' };
pairs.forEach(([c, ...spots]) => spots.forEach(([pos, S, X]) => {
  const r = SS.callSpot(pos, S, X, c, 2000, 20);
  const nd = r.risk / r.Pfin;
  if (Math.abs(r.e - nd) < 0.03) throw new Error('close ' + c + pos);
  const call = r.e > nd, h = cls(c), P = PN(pos);
  const p = { id: id(), lv: 3, tp: '상대 범위 추정', ti: `${P} ${S}BB 올인에 BB ${h}`, bl: BL(2000), s: { d: 30, [pos]: S, BB: 20 }, h: 'BB', c, b: '', a: r.a, o: ['f', 'c'], ans: call ? 1 : 0, ctx: `${P}${eun(pos)} 일반적인 푸시/폴드 범위를 쓰는 플레이어입니다.` };
  check(p);
  p.w = `상대 범위부터 추정합니다. ${P}${eun(pos)} ${POSDESC[pos]}, ${S}BB에서 보통 상위 ${X}% 안팎으로 올인합니다. 그 범위를 상대로 ${h} 핸드의 승률은 약 ${pc(r.e)}%이고, 콜에 필요한 승률은 약 ${pc(nd)}%입니다. ` +
    (call ? '범위가 넓어 필요한 승률보다 높으니 콜합니다.' : '범위가 좁고 강해 필요한 승률보다 낮으니 폴드합니다.') + ` 같은 ${h}라도 누가 올인했는지에 따라 정답이 달라집니다.`;
  p.n = call ? ['상대 범위를 실제보다 강하게 본 폴드입니다.', ''] : ['', `앞자리의 좁은 올인 범위를 상대로는 ${h} 핸드가 자주 지배당합니다.`];
  out.push(p);
}));
// A2 상대 성향으로 읽는 포스트플랍 (6)
const reads = [
  // [hero, board, line, ctx, ans, title, why]
  ['Kd9d', 'Kc9h5s7d8c', 'f f f f f r2.2 f c | x b2 c | x b6 c | x b11 a', 'BB는 매우 타이트한 플레이어로, 리버 체크레이즈는 지금까지 넛급 핸드로만 했습니다.', 0, '타이트한 상대의 리버 체크레이즈, 투페어', '리버 8로 6 한 장만 있어도 스트레이트(5-6-7-8-9)가 되고, 셋도 여럿 가능해졌습니다. 블러프를 하지 않는 상대의 리버 체크레이즈 범위는 스트레이트·셋이 중심이라, K-9 투페어는 그 범위에 거의 이기지 못합니다.'],
  ['QhJh', 'Qd Jc 4s 9h Ts'.replace(/ /g, ''), 'f f f f f r2.2 f c | x b2 c | x b6 c | x b11 a', 'BB는 몇 시간 동안 블러프를 보여 주지 않은 타이트-패시브 플레이어입니다.', 0, '스트레이트 보드에서 타이트한 상대의 리버 레이즈', '리버 10으로 K나 8 한 장만 있어도 스트레이트가 되는 보드가 됐습니다. 이 상대가 리버에 체크레이즈 올인을 했다면 스트레이트 이상으로 봐야 하고, Q-J 투페어는 그 범위를 이기지 못합니다.'],
  ['AhJc', 'Jd8s4c2h6s', 'f f f f r2.2 c f f | b2.5 c | b6 c | x a', 'BTN은 리버에 빗나간 드로우로 자주 올인하는 매우 공격적인 플레이어입니다. 기록상 이런 리버 올인의 절반 가까이가 블러프였습니다.', 1, '공격적인 상대의 리버 올인, 탑페어 탑키커', '이 상대는 리버 올인의 절반 가까이를 블러프로 합니다. 탑페어 탑키커는 그 블러프를 모두 이기고, 밸류 범위 일부(약한 J)도 이깁니다.'],
  ['KcQs', 'Qh7d3c9s2d', 'f f f f r2.2 c f f | b2.5 c | x x | x a', 'BTN은 리버에 블러프 빈도가 매우 높은 공격적인 플레이어로 알려져 있습니다(이런 올인의 절반 이상이 블러프).', 1, '공격적인 상대의 턴 체크 후 리버 올인', '턴에 체크한 뒤 리버에 올인한 라인에서 이 상대는 블러프가 절반이 넘습니다. 탑페어 K 키커는 그 블러프를 모두 이기고 약한 Q도 이기므로, 이길 확률이 필요한 승률보다 높습니다.'],
  ['QsTd', 'Qc8h5d3s', 'f f f f f r2.2 f c | x b2 c | b8', 'BB는 거의 체크·콜만 하는 패시브한 플레이어입니다. 먼저 큰 베팅을 한 핸드는 이번 대회에서 모두 투페어 이상이었습니다.', 0, '패시브한 상대의 턴 리드, 약한 키커 탑페어', '평소 먼저 베팅하지 않는 상대가 턴에 팟의 약 80%를 리드했습니다. 이 상대의 리드 범위는 투페어와 셋이 중심이라, 10 키커 탑페어는 거의 이기지 못합니다.'],
  ['JhTh', 'Js9c4d6h', 'f f f f f r2.2 f c | x b2 c | b8', 'BB는 체크·콜 위주의 패시브한 플레이어로, 강한 핸드가 아니면 먼저 베팅하지 않습니다.', 0, '패시브한 상대의 턴 동크 베팅, 탑페어', '패시브한 상대가 턴 6에 먼저 크게 베팅했습니다. 이 상대에게 이런 리드는 투페어(9-6, J-9), 셋, 스트레이트(8-7)를 뜻합니다. J 탑페어 10 키커는 리드 범위에 거의 지므로 폴드합니다.']
];
reads.forEach(([c, b, a, ctx, ans, ti, why], i) => {
  const isBTN = a.startsWith('f f f f f r2.2');
  const hero = isBTN ? (a.includes('| x b11 a') ? 'BTN' : 'BTN') : 'CO';
  const p = { id: id(), lv: 3, tp: '상대 범위 추정', ti, bl: BL([500, 600, 800, 1000, 500, 600][i]), s: 40, h: hero, c, b, a, o: a.endsWith('b8') ? ['f', 'c', 'r22', 'a'] : ['f', 'c'], ans, ctx };
  const st = check(p), nd = need(st);
  p.w = `${why} ${bbs(Math.min(st.toCall, st.hero.stack) / st.bb)}BB 콜에 필요한 승률은 약 ${pc(nd)}%입니다. ` + (ans ? '이길 확률이 그보다 높으니 콜합니다.' : '상대 범위가 너무 강해 폴드합니다.');
  p.n = ans ? ['상대의 블러프 빈도를 생각하지 않은 폴드입니다. 이 상대에게 쉽게 폴드하면 계속 블러프를 당합니다.', '']
    : (p.o.length === 2 ? ['', '가격만 보면 콜할 만해 보여도, 상대 범위에 이기는 핸드가 거의 없습니다.'] : ['', '상대 범위에 거의 지는 핸드로 리버까지 끌려가게 됩니다.', '레이즈는 강한 범위의 상대에게 통하지 않습니다.', '올인하면 상대의 강한 핸드가 모두 콜합니다.']);
  out.push(p);
});

// ================= B. 블러프 캐치 (17) =================
const bc = [
  // [hero, board, turnBet(0=체크), riverFrac, bluff%]
  ['9c8c', 'Kd9s5h2c3d', 6, 0.33, 30], ['Td7d', 'AsTs4c8h2c', 6, 0.5, 15], ['Jh9d', 'Qs9c5d2h4s', 6, 0.66, 40], ['Kh3h', 'AhQd3s8c7d', 0, 0.75, 20],
  ['6h5h', 'Js6c3d9s2h', 0, 1, 45], ['Qd9c', 'Kc9h6s3d2c', 0, 1, 25], ['As4s', 'Kh8c4d2s7h', 0, 1.5, 50], ['8h7h', 'Qs8d5c3h2d', 0, 1.5, 30],
  ['KcTc', 'AhKd6s3c9h', 0, 2, 48], ['JcTc', 'KsTd7h3s2d', 0, 2, 30], ['7s6s', 'Ad7c4h9d2c', 6, 0.33, 12], ['QhJh', 'AcQd8s5c3d', 6, 0.5, 35],
  ['Ts9s', 'KdTh4c8s3h', 6, 0.66, 18], ['Ad3d', 'Jc8h3s6d2c', 0, 0.75, 40], ['9d9c', 'KsQh4d7c2s', 0, 1.25, 45], ['KdJd', 'AhJs7c4d2h', 0, 1.25, 25], ['8c8d', 'AhKs6d3c9s', 6, 0.4, 32]
];
bc.forEach(([c, b, tb, rf, B], i) => {
  if (cat(c, b) !== 1) throw new Error('not one pair ' + c + b);
  const pot = tb ? 5.9 + 4 + 2 * tb : 9.9;
  const rb = Math.round(rf * pot * 10) / 10;
  const a = `f f f f f r2.2 f c | x b2 c | ${tb ? 'x b' + tb + ' c' : 'x x'} | x b${rb}`;
  const p = { id: id(), lv: 3, tp: '블러프 캐치', ti: `블러프 ${B}%인 상대의 리버 팟 ${pc(rf)}% 베팅`, bl: BL([500, 600, 800, 1000, 1200, 1500, 2000][i % 7]), s: 40, h: 'BB', c, b, a, o: ['f', 'c', 'a'], ctx: `기록상 이 상대가 이 라인으로 이 크기를 베팅했을 때 약 ${B}%가 블러프였습니다. 내 핸드는 블러프에는 이기고 밸류 베팅에는 집니다.` };
  const st = check(p), nd = need(st);
  if (Math.abs(B / 100 - nd) < 0.05) throw new Error('close ' + p.id);
  const call = B / 100 > nd;
  p.ans = call ? 1 : 0;
  p.w = `팟 ${bbs(st.pot / st.bb)}BB에 ${bbs(st.toCall / st.bb)}BB 베팅이라, 콜하면 ${bbs(st.toCall / st.bb)}BB로 ${bbs((st.total + st.toCall) / st.bb)}BB를 다투고 필요한 승률은 약 ${pc(nd)}%입니다. 내 핸드는 블러프에만 이기므로 승률은 곧 상대의 블러프 비율(약 ${B}%)입니다. ` +
    (call ? `블러프 비율이 필요한 승률보다 높아 콜합니다.` : `블러프 비율이 필요한 승률보다 낮아 폴드합니다.`) + ` 베팅이 클수록 필요한 승률이 올라간다는 점을 기억하세요.`;
  p.n = call ? ['블러프 비율이 필요한 승률보다 높아, 폴드는 장기적으로 손해입니다.', '', '올인하면 블러프는 폴드하고 밸류만 콜해 오히려 손해입니다.'] : ['', `블러프가 ${B}%뿐이라 콜할 때마다 평균적으로 손해입니다.`, '올인은 상대의 밸류 핸드에만 콜을 받습니다.'];
  out.push(p);
});

// ================= C. 숏스택 (17) =================
// C1 오픈 올인 또는 폴드 (10)
const jams = [['MP', 7, 15, 'QdTd'], ['HJ', 12, 14, '5c5d'], ['BTN', 10, 22, 'Qd8c'], ['SB', 9, 30, '9d6c'], ['BTN', 6, 25, '7d3d'], ['HJ', 8, 15, 'Ad5c'], ['MP', 11, 13, '6c6d'], ['UTG', 12, 12, 'KdJc'], ['UTG', 10, 12, 'Kd8c'], ['MP', 14, 14, 'Kd9c']];
jams.forEach(([pos, S, X, c], i) => {
  const r = SS.jamEV(pos, S, X, c, 2000);
  if (Math.abs(r.ev) < 0.35) throw new Error('close jam ' + pos + c + r.ev);
  const jam = r.ev > 0, h = cls(c), P = PN(pos), m = r.st.pl.filter(x => x.i > r.st.hero.i).length;
  const p = { id: id(), lv: 3, tp: '숏스택', ti: `${S}BB ${P}, ${h}`, bl: BL(2000), s: { d: 30, [pos]: S }, h: pos, c, b: '', a: Array(P8.indexOf(pos)).fill('f').join(' '), o: pos === 'SB' ? ['f', 'c', 'r2', 'a'] : ['f', 'c', 'r2', 'a'], ans: jam ? 3 : 0, ctx: `뒤에 남은 플레이어들은 이 스택의 올인에 각자 상위 ${X}% 핸드로 콜합니다.` };
  check(p);
  p.w = `${S}BB에서는 올인 아니면 폴드로 판단합니다. 뒤 ${m}명이 모두 폴드할 확률은 약 ${pc(r.pFold)}%이고, 그때 블라인드와 앤티 ${bbs(r.st.total / 2000)}BB를 가져옵니다. 콜을 받으면 상위 ${X}% 범위를 상대로 ${h} 핸드의 승률은 약 ${pc(r.e)}%입니다. 이를 합한 올인의 기대값은 폴드보다 약 ${r.ev > 0 ? '+' : ''}${f2(r.ev)}BB입니다. ` + (jam ? '올인합니다.' : `${m}명이나 남은 자리에서 콜을 받을 확률이 높아 폴드합니다.`);
  p.n = jam
    ? ['기대값이 플러스인 올인을 버리면 블라인드에 스택이 계속 줄어듭니다.', pos === 'SB' ? '완성(림프)하면 BB가 올인할 기회를 주고, 포지션도 없습니다.' : '림프하면 뒤에서 올인을 받아 곤란해지고, 블라인드를 가져올 기회도 줄어듭니다.', '미니 레이즈 후 올인을 받으면 스택의 상당 부분을 넣은 상태라 폴드하기 어렵습니다.', '']
    : ['', '림프는 뒤에서 레이즈를 받으면 칩만 잃습니다.', '미니 레이즈 후 올인을 받으면 폴드해야 해서 칩만 잃습니다.', `올인의 기대값이 약 ${f2(r.ev)}BB로 손해입니다.`];
  out.push(p);
});
// C2 올인을 받은 BB (7)
const calls = [['BTN', 10, 40, 'Ad8c'], ['CO', 12, 25, 'KdJc'], ['UTG', 8, 18, 'QdJd'], ['SB', 14, 35, '6c6d'], ['HJ', 9, 22, 'Ad5c'], ['SB', 20, 25, 'AdTc'], ['UTG', 12, 12, 'Ad8c']];
calls.forEach(([pos, S, X, c], i) => {
  const r = SS.callSpot(pos, S, X, c, 2000, 25);
  const nd = r.risk / r.Pfin;
  if (Math.abs(r.e - nd) < 0.03) throw new Error('close call ' + pos + c);
  const call = r.e > nd, h = cls(c), P = PN(pos);
  const p = { id: id(), lv: 3, tp: '숏스택', ti: `${P} ${S}BB 올인에 BB ${h}`, bl: BL(2000), s: { d: 30, [pos]: S, BB: 25 }, h: 'BB', c, b: '', a: r.a, o: ['f', 'c'], ans: call ? 1 : 0, ctx: `${P}${eun(pos)} 이 스택에서 상위 ${X}% 핸드로 올인합니다.` };
  check(p);
  p.w = `${P}${ga(pos)} ${S}BB를 올인했습니다. ${bbs(r.risk / 2000)}BB를 더 내고 ${bbs(r.Pfin / 2000)}BB를 다투므로 필요한 승률은 약 ${pc(nd)}%입니다. 상위 ${X}% 범위를 상대로 ${h} 핸드의 승률은 약 ${pc(r.e)}%라 ` + (call ? '콜합니다.' : '폴드합니다.');
  p.n = call ? ['필요한 승률보다 실제 승률이 높습니다.', ''] : ['', `승률(${pc(r.e)}%)이 필요한 승률(${pc(nd)}%)보다 낮습니다.`];
  out.push(p);
});

// ================= D. 버블과 ICM (18) =================
const OTH = [3, 25, 18, 30, 2.5, 35, 28, 15, 40, 12];
const PAYTXT = '1위 27.7%, 2위 15%, 3위 11%, 4위 8.5%, 5위 7%, 6위 6%, 7위 5.2%, 8위 4.6%, 9위 4.2%, 10~12위 3.6%';
// D1 버블, 칩리더 BTN 올인에 BB (6)
[[20, 60, 'AhKd'], [20, 60, 'QcQd'], [18, 55, 'TcTd'], [15, 60, 'AhQd'], [25, 70, '9c9d'], [16, 60, 'KcKd']].forEach(([H, J, c]) => {
  const r = IC.bbVsJam({ H, J, SB: 22, others: OTH, pays: IC.BUBBLE_PAY, hand: c, range: 'top:40' });
  if (Math.abs(r.eq - r.need) < 0.028) throw new Error('close icm ' + c + H);
  const call = r.eq > r.need, h = cls(c);
  const p = { id: id(), lv: 3, tp: '버블과 ICM', ti: `버블, 칩리더 올인에 ${H}BB ${h}`, bl: BL(2000), s: { UTG: 3, U1: 25, MP: 18, HJ: 30, CO: 2.5, BTN: J, SB: 22, BB: H }, h: 'BB', c, b: '', a: 'f f f f f a f', o: ['f', 'c'], ans: call ? 1 : 0,
    ctx: `버블: 13명이 남았고 12위까지 상금을 받습니다. 이 테이블의 UTG(3BB)와 CO(2.5BB)는 곧 블라인드에 걸립니다. 칩리더 BTN(${J}BB)은 상위 40% 핸드로 올인합니다. 다른 테이블: 35·28·15·40·12BB. 상금 비율: ${PAYTXT}.` };
  check(p);
  p.w = `칩만 보면 필요한 승률은 약 ${pc(r.chipNeed)}%이고 ${h} 핸드의 승률은 약 ${pc(r.eq)}%라 쉬운 콜입니다. 하지만 버블에서는 탈락하면 상금이 0이라, ICM으로 계산하면 이 콜이 이득이려면 약 ${pc(r.need)}%의 승률이 필요합니다. 폴드의 상금 기대값은 약 ${f2(r.fold)}%, 콜은 약 ${f2(r.call)}%입니다. ` + (call ? `${h}는 이 높은 기준도 넘으니 콜합니다. 버블이라고 모든 핸드를 접는 것은 아닙니다.` : `${h}도 이 기준에 못 미쳐 폴드합니다.`);
  p.n = call ? ['ICM 기준을 넘는 핸드까지 접으면 칩을 늘릴 기회를 잃습니다.', ''] : ['', '칩 기준으로는 이득이지만 상금 기준으로는 손해인 콜입니다.'];
  out.push(p);
});
// D2 버블, BTN 올인 판단 (4)
[[14, 'QdJc', 70, 20], [20, 'Ad5d', 70, 20], [10, 'Ad9c', 70, 15], [12, 'Qd9d', 25, 8]].forEach(([H, c, BB, cp]) => {
  const others = BB === 70 ? OTH : [3, 25, 18, 30, 2.5, 35, 28, 15, 40, 70];
  const r = IC.btnJam({ H, SB: 20, BB, others, pays: IC.BUBBLE_PAY, hand: c, callPct: cp });
  const d = r.jam - r.fold;
  if (Math.abs(d) < 0.09) throw new Error('close btnjam ' + c + H + ' ' + d);
  const jam = d > 0, h = cls(c);
  const p = { id: id(), lv: 3, tp: '버블과 ICM', ti: `버블 ${H}BB BTN ${h}, BB ${BB}BB`, bl: BL(2000), s: { UTG: 3, U1: 25, MP: 18, HJ: 30, CO: 2.5, BTN: H, SB: 20, BB }, h: 'BTN', c, b: '', a: 'f f f f f', o: ['f', 'a'], ans: jam ? 1 : 0,
    ctx: `버블: 13명 남음, 12위까지 입상(상금 비율: ${PAYTXT}). BB(${BB}BB)는 ${BB === 70 ? '칩리더로' : '미들 스택이라 탈락을 피하려고'} 상위 ${cp}% 핸드로 콜합니다. SB는 폴드합니다. 다른 테이블: ${others.slice(5).join('·')}BB.` };
  check(p);
  p.w = `BB가 ${BB > H ? '나를 커버하고' : '나보다 칩이 많지만'} 상위 ${cp}%로 콜합니다. ICM으로 계산하면 폴드의 상금 기대값은 약 ${f2(r.fold)}%, 올인은 약 ${f2(r.jam)}%입니다. 콜을 받으면 ${h} 핸드의 승률은 약 ${pc(r.eq)}%입니다. ` +
    (jam ? `BB가 넓게 콜하지 못해 블라인드를 가져오는 이득이 커서 올인합니다.` : `칩 기준으로는 올인할 핸드지만, 콜을 받아 지면 숏스택보다 먼저 탈락할 위험 때문에 폴드가 낫습니다.`);
  p.n = jam ? ['BB가 좁게 콜하는 상황에서 블라인드를 그냥 내주는 선택입니다.', ''] : ['', '칩 기준 올인 범위를 버블에 그대로 쓰면 상금 기대값을 잃습니다.'];
  out.push(p);
});
// D3 파이널 테이블 (5)
const FT6 = [27, 17.5, 12.5, 9.5, 7.5, 6], FT5 = [27, 17.5, 12.5, 9.5, 7.5], FT4 = [40, 26, 19, 15];
const ft = [
  { me: 15, opp: 25, others: [30, 12, 8, 40], pays: FT6, c: 'AhTd', X: 35, n: 6, names: ['UTG', 'HJ', 'CO', 'BTN'] },
  { me: 30, opp: 6, others: [45, 20, 12, 9], pays: FT6, c: 'Qh8d', X: 60, n: 6, names: ['UTG', 'HJ', 'CO', 'BTN'] },
  { me: 20, opp: 35, others: [8, 12, 25], pays: FT5, c: 'Ah9d', X: 50, n: 5, names: ['HJ', 'CO', 'BTN'] },
  { me: 25, opp: 18, others: [10, 47], pays: FT4, c: 'KhJd', X: 45, n: 4, names: ['CO', 'BTN'] },
  { me: 12, opp: 40, others: [30, 25, 9, 14], pays: FT6, c: 'KhTd', X: 60, n: 6, names: ['UTG', 'HJ', 'CO', 'BTN'] }
];
ft.forEach(o => {
  const r = IC.genericCall({ me: o.me, opp: o.opp, others: o.others, pays: o.pays, hand: o.c, range: 'top:' + o.X, myDead: 2, oppDead: 2 });
  if (Math.abs(r.eq - r.need) < 0.028) throw new Error('close ft ' + o.c);
  const call = r.eq > r.need, h = cls(o.c);
  const s = { SB: o.opp, BB: o.me }; o.names.forEach((k, i) => { s[k] = o.others[i]; });
  const p = { id: id(), lv: 3, tp: '버블과 ICM', ti: `파이널 ${o.n}인, SB ${o.opp}BB 올인에 BB ${o.me}BB ${h}`, pl: o.n, bl: BL(2000), s, h: 'BB', c: o.c, b: '', a: [...Array(o.n - 2).fill('f'), 'a'].join(' '), o: ['f', 'c'], ans: call ? 1 : 0,
    ctx: `파이널 테이블 ${o.n}명. 남은 상금 비율: ${o.pays.map((x, i) => `${i + 1}위 ${x}%`).join(', ')}. SB는 상위 ${o.X}% 핸드로 올인합니다.` };
  check(p);
  const covers = o.opp > o.me;
  p.w = `칩만 보면 필요한 승률은 약 ${pc(r.chipNeed)}%, ${h} 핸드의 승률은 약 ${pc(r.eq)}%입니다. ` +
    (covers ? `SB가 나를 커버해서 지면 바로 탈락합니다. ` : `SB는 나보다 칩이 적어 져도 탈락하지 않습니다. `) +
    `ICM으로 계산하면 콜에 필요한 승률은 약 ${pc(r.need)}%입니다(폴드 ${f2(r.fold)}% · 콜 ${f2(r.call)}%). ` + (call ? '필요한 승률을 넘으니 콜합니다.' : '필요한 승률에 못 미쳐 폴드합니다.');
  p.n = call ? [covers ? 'ICM 기준도 넘는 핸드를 버리는 선택입니다.' : '나를 탈락시킬 수 없는 짧은 스택의 올인에는 넓게 콜해도 됩니다.', ''] : ['', '칩 기준의 콜을 그대로 적용한 실수입니다. 상금이 오르는 구간에서는 생존 가치가 큽니다.'];
  out.push(p);
});
// D4 버블의 빅스택, 숏스택 올인에 콜 (3)
const OTH2 = [20, 18, 25, 22, 15, 30, 35, 28, 17, 24, 12];
[['Kd4c', 5], ['Jd8d', 7], ['Qd3c', 6]].forEach(([c, S]) => {
  const r = IC.genericCall({ me: 55, opp: S, others: OTH2, pays: IC.BUBBLE_PAY, hand: c, range: 'top:60', myDead: 2, oppDead: 2 });
  if (r.eq - r.need < 0.03) throw new Error('close big ' + c);
  const h = cls(c);
  const p = { id: id(), lv: 3, tp: '버블과 ICM', ti: `버블 빅스택 BB, SB ${S}BB 올인에 ${h}`, bl: BL(2000), s: { d: 22, UTG: 20, U1: 18, MP: 25, HJ: 22, CO: 15, BTN: 30, SB: S, BB: 55 }, h: 'BB', c, b: '', a: 'f f f f f f a', o: ['f', 'c'], ans: 1,
    ctx: `버블: 13명 남음, 12위까지 입상. SB(${S}BB)는 버블에서 살아남으려 상위 60% 핸드로 올인합니다. 다른 테이블: 35·28·17·24·12BB.` };
  check(p);
  p.w = `${bbs(S - 1)}BB만 더 내면 되고, 칩 기준 필요 승률은 약 ${pc(r.chipNeed)}%입니다. 나는 SB를 크게 커버하는 빅스택이라 져도 순위에 큰 변화가 없고, 이기면 숏스택을 탈락시켜 버블을 터뜨립니다. ICM으로 계산해도 필요한 승률은 약 ${pc(r.need)}%로 낮고, ${h} 핸드의 승률은 약 ${pc(r.eq)}%입니다. 콜합니다.`;
  p.n = ['버블이라고 모든 콜을 줄이는 것은 아닙니다. 커버하는 빅스택에게 숏스택의 올인은 좋은 기회입니다.', ''];
  out.push(p);
});

if (out.length !== 70) throw new Error('count ' + out.length);
L.write(__dirname + '/../problems/g3.js', out);
