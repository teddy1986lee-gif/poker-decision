const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
const PD=require('../src/engine.js'), Review=require('../src/problem-review.js'), {icm}=require('../icm.js');
const problems=[];
for(const f of fs.readdirSync('problems').filter(x=>x.endsWith('.js')).sort()) vm.runInNewContext(fs.readFileSync('problems/'+f,'utf8'),{P:p=>problems.push(Review.apply(p,PD))});
const get=id=>problems.find(p=>p.id===id);
test('all 304 questions validate, holds have no answer, repeated review is stable',()=>{
  assert.equal(problems.length,304);
  for(const p of problems){assert.deepEqual(PD.validate(p).errs,[],p.id);assert.deepEqual(Review.apply(p,PD),p,p.id);if(p.reviewHold)assert.equal(p.ans,null,p.id);}
  assert.equal(get('A26').ans,1);
  assert.equal(PD.validate({...get('B01'),ans:null}).errs.includes('정답 인덱스 오류'),true);
});
test('ICM pays the eliminated player and conserves the complete prize pool',()=>{
  assert.deepEqual(icm([100,0],[70,30]),[70,30]);
  assert.deepEqual(icm([100,100],[70,30]),[50,50]);
  for(const s of [[1.2,1.5,26,69],[1.2,1.5,95,0],[30,12,8,40,40,0]]){
    const pays=s.length===4?[40,26,19,15]:[27,17.5,12.5,9.5,7.5,6];
    assert.ok(Math.abs(icm(s,pays).reduce((a,b)=>a+b)-pays.reduce((a,b)=>a+b))<1e-9);
  }
});
test('QQ final table risk threshold includes secured fourth prize',()=>{
  const pay=[40,26,19,15],F=icm([1.2,1.5,62,33],pay)[3],W=icm([1.2,1.5,26,69],pay)[3],L=icm([1.2,1.5,95,0],pay)[3];
  assert.equal(L,15); assert.ok(Math.abs((F-L)/(W-L)-0.73478)<0.00001);
  assert.ok(.80*W+.20*L>F);
});
test('all-in live call excludes ante and uncalled excess from odds',()=>{
  const st=PD.build(get('A76'));assert.equal(st.toCall/st.bb,9);assert.equal((st.total+st.toCall)/st.bb,21.5);assert.match(get('A76').w,/41.9%/);assert.doesNotMatch(get('A76').w,/16000BB/);
  assert.match(get('A98').w,/36.4%/);assert.match(get('A99').w,/40.0%/);assert.match(get('A100').w,/38.5%/);
});
test('bubble relocation preserves 13 participants and total chips',()=>{
  const p=get('A83'),st=PD.build(p);
  assert.equal(st.n,9);assert.equal(p.s.U2,12);assert.match(p.ctx,/다른 테이블 4명: 35·28·15·40BB/);
  assert.equal(st.pl.reduce((n,p)=>n+p.start/st.bb,0)+35+28+15+40,310.5);
  assert.equal(st.pl.some(p=>p.start/st.bb===100),false);
});
test('incorrect draw descriptions are removed',()=>{
  assert.match(get('M35').w,/플러시 드로우는 없습니다/);
  assert.match(get('A48').w,/거트샷/);
  assert.match(get('A04').w,/백도어/);
  assert.match(get('A10').w,/턴 8에서 이미 완성/);
});
test('held and fix questions cannot be served, retried or scored even with stale admin overrides',()=>{
  const state={custom:{},edits:{A26:{ans:0},A93:{ans:1}},review:{A93:'ok',B01:'fix'},settings:{onlyReviewed:false}};
  const context={PD,ProblemReview:Review,PROBLEMS:problems,Store:{S:state},console};
  vm.createContext(context);vm.runInContext(fs.readFileSync('src/app1.js','utf8')+'\nthis.app=App;U.toast=()=>{};',context);
  assert.equal(context.app.byId('A26').ans,1);
  assert.equal(context.app.playable().some(p=>p.reviewHold||p.id==='B01'),false);
  context.app.startRetry(['A93']);assert.equal(context.app.ui.set,null);
});
