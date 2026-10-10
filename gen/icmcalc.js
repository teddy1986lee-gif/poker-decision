/* ICM 계산 도구 (단위 BB) */
const L = require('./lib.js');
const { icm } = L;
const BUBBLE_PAY = [27.7, 15, 11, 8.5, 7, 6, 5.2, 4.6, 4.2, 3.6, 3.6, 3.6];
/** BB(나)가 BTN 올인에 콜/폴드. table: {SB, others[]}; 반환: fold/call 상금 기대값, 필요 승률, 승률 */
function bbVsJam({ H, J, SB, others, pays, hand, range }) {
  const eq = L.eqv(hand, range, '', 30000);
  const fold = icm([H - 2, J + 2.5, SB - 0.5, ...others], pays)[0];
  const E = Math.min(H, J);
  const win = icm([H + E + 0.5, J - E, SB - 0.5, ...others], pays)[0];
  const lose = icm([H - E, J + E + 0.5, SB - 0.5, ...others], pays)[0];
  const call = eq * win + (1 - eq) * lose;
  const need = (fold - lose) / (win - lose);
  const chipNeed = (E - 2) / (2 * E + 0.5);
  return { eq, fold, call, need, chipNeed, win, lose };
}
/** BTN(나) 올인, SB 폴드, BB가 range로 콜 */
function btnJam({ H, SB, BB, others, pays, hand, callPct }) {
  const q = callPct / 100, eq = L.eqv(hand, 'top:' + callPct, '', 30000);
  const fold = icm([H, SB, BB, ...others], pays)[0];
  const steal = icm([H + 2.5, SB - 0.5, BB - 2, ...others], pays)[0];
  const E = Math.min(H, BB);
  const win = icm([H + E + 0.5, SB - 0.5, BB - E, ...others], pays)[0];
  const lose = icm([H - E, SB - 0.5, BB + E + 0.5, ...others], pays)[0];
  const jam = (1 - q) * steal + q * (eq * win + (1 - eq) * lose);
  return { eq, fold, jam, steal, win, lose };
}
/** 일반: 나와 상대 한 명의 올인 대결 후 스택 */
function genericCall({ me, opp, others, pays, hand, range, myDead = 0, oppDead = 0, pot0 = 0 }) {
  // me/opp: 현재 스택(블라인드·앤티 내기 전), myDead: 폴드 시 내가 잃는 칩, oppDead: 폴드 시 상대가 얻는 칩(블라인드 등)
  const eq = L.eqv(hand, range, '', 30000);
  const fold = icm([me - myDead, opp + oppDead, ...others], pays)[0];
  const E = Math.min(me, opp);
  const win = icm([me + E + pot0, opp - E, ...others], pays)[0];
  const lose = icm([me - E, opp + E + pot0, ...others], pays)[0];
  return { eq, fold, call: eq * win + (1 - eq) * lose, need: (fold - lose) / (win - lose), chipNeed: (E - myDead) / (2 * E + pot0) };
}
module.exports = { bbVsJam, btnJam, genericCall, BUBBLE_PAY };
