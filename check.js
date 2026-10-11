// usage: node check.js [file...]  — validates problems and prints key numbers in BB
const fs=require('fs'),path=require('path'),vm=require('vm');
const PD=require('./src/engine.js');
const Review=require('./src/problem-review.js');
const PROBLEMS=[];const P=o=>PROBLEMS.push(Review.apply(o,PD));
const files=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync('problems').filter(f=>f.endsWith('.js')).sort().map(f=>'problems/'+f);
for(const f of files){vm.runInNewContext(fs.readFileSync(f,'utf8'),{P},{filename:f});}
let bad=0;const ids=new Set();const lv={1:0,2:0,3:0};
for(const p of PROBLEMS){
  if(ids.has(p.id)){console.log('DUP ID',p.id);bad++;} ids.add(p.id); if(!p.ex) lv[p.lv]++;
  const {st,errs}=PD.validate(p);
  const bb=x=>+(x/p.bl[1]).toFixed(2);
  if(errs.length){bad++;console.log('✗',p.id,errs.join(' / '));continue;}
  if(process.env.Q) continue;
  const opts=p.o.map(o=>{const i=PD.optionInfo(st,o);return o+'→'+(i.amt!=null?bb(i.amt):i.to!=null?bb(i.to):'')+(i.pct!=null?'('+i.pct+'%)':'')}).join(' ');
  console.log(`✓ ${p.id} ${st.street} pot=${bb(st.pot)} total=${bb(st.total)} call=${bb(st.toCall)} need=${st.toCall?(st.toCall/(st.total+st.toCall)*100).toFixed(1)+'%':'-'} eff=${bb(st.eff)} heroStack=${bb(st.hero.stack)} | ${opts} | ans=${p.ans}`);
}
console.log(`\n${PROBLEMS.length} problems, errors=${bad}, lv1=${lv[1]} lv2=${lv[2]} lv3=${lv[3]}`);

if (bad) process.exitCode = 1;
