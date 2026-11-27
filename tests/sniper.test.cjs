// 저격 홀덤 족보·저격 판정 테스트: node --test tests/sniper.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'sniper.js'), 'utf8');
const ctx = { Math, console, MINA_BASE: 'mina/' };
vm.createContext(ctx);
vm.runInContext(src + '\nthis.Sniper = Sniper;', ctx);
const S = ctx.Sniper;
const nm = cards => S.declNm(S.declOf(S.best(cards)));

test('족보 판정', () => {
  assert.equal(nm([7, 7, 7, 7, 2, 3]), '7 포카드');
  assert.equal(nm([3, 3, 3, 9, 9, 1]), '3 풀하우스');
  assert.equal(nm([4, 5, 6, 7, 8, 8]), '8 스트레이트');
  assert.equal(nm([1, 2, 3, 4, 5, 9]), '5 스트레이트');
  assert.equal(nm([6, 7, 8, 9, 10, 2]), '10 스트레이트');
  assert.equal(nm([10, 1, 2, 3, 4, 7]), '10 하이'); // 10-1은 이어지지 않음
  assert.equal(nm([9, 9, 9, 1, 4, 6]), '9 트리플');
  assert.equal(nm([7, 7, 5, 5, 2, 2]), '7 투페어');
  assert.equal(nm([8, 8, 1, 3, 5, 10]), '8 원페어');
  assert.equal(nm([1, 3, 5, 7, 9, 10]), '10 하이');
  // 트리플 두 개면 높은 트리플 + 낮은 트리플 페어로 풀하우스
  assert.equal(nm([4, 4, 4, 6, 6, 6]), '6 풀하우스');
});

test('저격당한 족보는 최하위', () => {
  const board = [7, 7, 2, 9];
  const a = [7, 3], b = [9, 1]; // a: 7 트리플, b: 9 투페어
  const ha = S.best([...a, ...board]), hb = S.best([...b, ...board]);
  assert.equal(S.judge(ha, hb, a, b, []).r, 1);
  const sniped = S.judge(ha, hb, a, b, [{ cat: 3, top: 7 }]);
  assert.equal(sniped.r, -1); assert.ok(sniped.sa);
  // 숫자가 다르면 저격 실패
  assert.equal(S.judge(ha, hb, a, b, [{ cat: 3, top: 9 }]).r, 1);
  // 둘 다 저격당하면 무승부
  assert.equal(S.judge(ha, hb, a, b, [{ cat: 3, top: 7 }, { cat: 2, top: 9 }]).r, 0);
});

test('동점이면 개인 카드 최고 숫자 → 합 순서', () => {
  const board = [5, 6, 7, 8];
  const a = [9, 1], b = [9, 2]; // 둘 다 9 스트레이트
  const ha = S.best([...a, ...board]), hb = S.best([...b, ...board]);
  assert.equal(S.cmpHand(ha, hb), 0);
  assert.equal(S.judge(ha, hb, a, b, []).r, -1); // 합 10 < 11
});

test('상대 족보 분포 합계는 1', () => {
  const d = S.rangeDist([3, 3], [7, 7, 2, 9]);
  const sum = d.reduce((t, x) => t + x.p, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});
