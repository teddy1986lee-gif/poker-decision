/* 문제 생성 공통 도구 */
const fs = require('fs');
const PD = require('../src/engine.js');
const EQ = require('../eq.js');
const { icm } = require('../icm.js');

const R = '23456789TJQKA';
const SUITS = 'shdc';
const bbs = x => { const v = Math.round(x * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); };
const pc = x => Math.round(x * 100);                  // 0.253 -> 25
const pc1 = x => (Math.round(x * 1000) / 10).toFixed(1); // 0.253 -> 25.3
const BL = bb => [bb / 2, bb, bb];
const pick = (arr, i) => arr[i % arr.length];

/** 'AhJd' -> 'AJo', '7c7d' -> '77' */
function cls(c) {
  const a = c[0], b = c[2], s = c[1] === c[3];
  if (a === b) return a + b;
  const [h, l] = R.indexOf(a) > R.indexOf(b) ? [a, b] : [b, a];
  return h + l + (s ? 's' : 'o');
}
const showCls = c => cls(c).replace(/T/g, '10');

/** 오픈 전까지 폴드 토큰 */
function foldsBefore(pos, n = 8) { const i = PD.POS[n].indexOf(pos); return Array(i).fill('f'); }
/** pos가 오픈(size)한 뒤 hero 차례까지 폴드 */
function openToHero(opener, size, hero, n = 8, mid = {}) {
  const P = PD.POS[n], t = [];
  for (const k of P) {
    if (k === hero) break;
    if (k === opener) t.push('r' + size); else if (P.indexOf(k) < P.indexOf(opener)) t.push('f'); else t.push(mid[k] || 'f');
  }
  return t.join(' ');
}

function check(p) {
  const { st, errs } = PD.validate(p);
  if (errs.length) throw new Error(p.id + ': ' + errs.join('; ') + ' | ' + JSON.stringify(p).slice(0, 200));
  return st;
}
/** 해설 작성 전 상태 계산용 검증 */
function chk(p) { const had = p.w, hadA = p.ans !== undefined; if (!had) p.w = '임시 해설입니다. '.repeat(4); if (!hadA) p.ans = 0; const st = check(p); if (!had) delete p.w; if (!hadA) delete p.ans; return st; }
const need = st => st.toCall / (st.total + st.toCall);

/** 정확 승률(리버) 또는 몬테카를로 */
const eqv = (hero, range, board, it = 40000) => EQ.equity(hero, range, board || '', it).eq / 100;

/** 보드에서 히어로가 넛인지(동률 허용) */
function isNuts(hero, board) {
  const h = EQ.cards(hero), b = EQ.cards(board), dead = new Set([...h, ...b]);
  const mine = EQ.evalHand([...h, ...b]);
  let beat = 0;
  for (let i = 0; i < 52; i++) for (let j = i + 1; j < 52; j++) {
    if (dead.has(i) || dead.has(j)) continue;
    if (EQ.evalHand([i, j, ...b]) > mine) beat++;
  }
  return beat === 0;
}
/** 히어로를 이기는 상대 조합 수 */
function beatCount(hero, board) {
  const h = EQ.cards(hero), b = EQ.cards(board), dead = new Set([...h, ...b]);
  const mine = EQ.evalHand([...h, ...b]); let beat = 0, tot = 0;
  for (let i = 0; i < 52; i++) for (let j = i + 1; j < 52; j++) { if (dead.has(i) || dead.has(j)) continue; tot++; if (EQ.evalHand([i, j, ...b]) > mine) beat++; }
  return { beat, tot };
}

function write(file, list) {
  const ids = new Set();
  list.forEach(p => { if (ids.has(p.id)) throw new Error('dup ' + p.id); ids.add(p.id); check(p); });
  fs.writeFileSync(file, '/* 자동 생성: gen/' + file.split('/').pop().replace('.js', '') + ' */\n' + list.map(p => 'P(' + JSON.stringify(p) + ');').join('\n') + '\n');
  console.log('wrote', file, list.length);
}

module.exports = { PD, EQ, icm, R, SUITS, bbs, pc, pc1, BL, pick, cls, showCls, foldsBefore, openToHero, check, chk, need, eqv, isNuts, beatCount, write };
