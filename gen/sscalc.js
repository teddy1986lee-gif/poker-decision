/* 숏스택 계산: 오픈 올인 기대값(칩), 올인 콜 판단 */
const L = require('./lib.js'); const { PD } = L;
const P8 = PD.POS[8];
/** 폴드된 앞자리 → hero 올인 결정. callers: 뒤 플레이어 각각 top X%로 콜 */
function jamEV(pos, S, X, hero, bb = 1000, deep = 30) {
  const i = P8.indexOf(pos);
  const p = { id: 'X', lv: 3, bl: [bb / 2, bb, bb], s: { d: deep, [pos]: S }, h: pos, c: hero, b: '', a: Array(i).fill('f').join(' '), o: ['f', 'a'], ans: 0, w: 'x'.repeat(30) };
  const st = L.check(p);
  const h = st.hero, q = X / 100, e = L.eqv(hero, 'top:' + X, '', 30000);
  const after = st.pl.filter(x => x.i > h.i);
  let pNoCall = 1, ev = 0;
  for (const v of after) {
    const pc = pNoCall * q;
    const Seff = Math.min(h.start, v.start);
    const Pf = st.total + (Seff - h.inv) + (Seff - v.inv);
    ev += pc * (e * Pf - (Seff - h.inv));
    pNoCall *= (1 - q);
  }
  ev += pNoCall * st.total;
  return { ev: ev / bb, pFold: pNoCall, e, st };
}
/** BB가 올인을 받았을 때 */
function callSpot(jPos, S, X, hero, bb = 1000, heroS = 20) {
  const i = P8.indexOf(jPos);
  const a = [...Array(i).fill('f'), 'a', ...Array(7 - i - 1).fill('f')].join(' ');
  const p = { id: 'X', lv: 3, bl: [bb / 2, bb, bb], s: { d: 30, [jPos]: S, BB: heroS }, h: 'BB', c: hero, b: '', a, o: ['f', 'c'], ans: 0, w: 'x'.repeat(30) };
  const st = L.check(p);
  const e = L.eqv(hero, 'top:' + X, '', 30000);
  // 실제로 다투는 금액 기준 필요 승률
  const h = st.hero, v = st.pl.find(x => x.k === jPos);
  const Seff = Math.min(h.start, v.start);
  const risk = Seff - h.inv, Pf = st.total - v.inv + Seff + (Seff - h.inv) - 0; // 데드머니 + 양쪽 유효 스택
  const dead = st.total - h.inv - v.inv;
  const Pfin = dead + 2 * Seff;
  return { need: risk / (Pfin - h.inv + 0) , need2: risk / (Pfin), e, a, st, risk, Pfin };
}
module.exports = { jamEV, callSpot };
if (require.main === module) {
  const args = JSON.parse(process.argv[3]);
  if (process.argv[2] === 'jam') for (const c of args) { const r = jamEV(...c); console.log(c.join(' '), '| EV', r.ev.toFixed(2), 'pFold', r.pFold.toFixed(2), 'eq', r.e.toFixed(3)); }
  else for (const c of args) { const r = callSpot(...c); console.log(c.join(' '), '| need', (r.risk / r.Pfin * 100).toFixed(1), 'eq', (r.e * 100).toFixed(1)); }
}
