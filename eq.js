// Monte Carlo equity: node eq.js "Kc8d" "range" "board" [iters]
// range: comma list like "22+,A2s+,K9o+,QJs" or "random" or "top:55" (percent by simple ranking)
const R='23456789TJQKA';
function rank5(c){ // c: array of [r(0-12), s]
}
function evalHand(cards){ // cards: array of ints 0..51 (r*4+s), returns comparable number
  const cnt=new Array(13).fill(0), suitC=[0,0,0,0], bySuit=[[],[],[],[]];
  for(const c of cards){const r=c>>2,s=c&3;cnt[r]++;suitC[s]++;bySuit[s].push(r);}
  const straightHigh=(mask)=>{for(let h=12;h>=3;h--){let ok=true;for(let k=0;k<5;k++){const r=h-k;const rr=r<0?12:r; if(!(mask>>(r===-1?12:r)&1)){ok=false;break;}} if(ok) return h;} // wheel
    if((mask&(1<<12))&&(mask&1)&&(mask&2)&&(mask&4)&&(mask&8)) return 3; return -1;};
  for(let s=0;s<4;s++) if(suitC[s]>=5){let m=0;for(const r of bySuit[s])m|=1<<r;const sh=straightHigh(m);if(sh>=0)return 8e10+sh;
    const rs=bySuit[s].sort((a,b)=>b-a).slice(0,5);return 5e10+rs.reduce((a,r)=>a*13+r,0);}
  let mask=0;for(let r=0;r<13;r++)if(cnt[r])mask|=1<<r;
  const groups=[];for(let r=12;r>=0;r--)if(cnt[r])groups.push([cnt[r],r]);
  groups.sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  const kick=(ex,n)=>{const ks=[];for(let r=12;r>=0&&ks.length<n;r--)if(cnt[r]&&!ex.includes(r))ks.push(r);return ks;};
  const enc=(cat,arr)=>cat*1e10+arr.reduce((a,r)=>a*13+r,0);
  if(groups[0][0]===4)return enc(7,[groups[0][1],...kick([groups[0][1]],1)]);
  if(groups[0][0]===3&&groups[1]&&groups[1][0]>=2)return enc(6,[groups[0][1],groups[1][1]]);
  const sh=straightHigh(mask);if(sh>=0)return enc(4,[sh]);
  if(groups[0][0]===3)return enc(3,[groups[0][1],...kick([groups[0][1]],2)]);
  if(groups[0][0]===2&&groups[1]&&groups[1][0]===2)return enc(2,[groups[0][1],groups[1][1],...kick([groups[0][1],groups[1][1]],1)]);
  if(groups[0][0]===2)return enc(1,[groups[0][1],...kick([groups[0][1]],3)]);
  return enc(0,kick([],5));
}
const card=s=>R.indexOf(s[0].toUpperCase())*4+'shdc'.indexOf(s[1]);
const cards=s=>(s.match(/../g)||[]).map(card);
// range parsing
function combos(tok){if(tok[0]==='#'){const c=cards(tok.slice(1));return[c];}const out=[];const r1=R.indexOf(tok[0]),r2=R.indexOf(tok[1]);const t=tok[2];
  if(r1===r2){for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)out.push([r1*4+a,r1*4+b]);}
  else for(let a=0;a<4;a++)for(let b=0;b<4;b++){if(t==='s'&&a!==b)continue;if(t==='o'&&a===b)continue;out.push([r1*4+a,r2*4+b]);}
  return out;}
function expand(tok){tok=tok.trim();if(/^[AKQJT2-9][shdc][AKQJT2-9][shdc]$/.test(tok))return['#'+tok];const plus=tok.endsWith('+');if(plus)tok=tok.slice(0,-1);
  if(tok.includes('-')){const [a,b]=tok.split('-');const res=[];if(a[0]===a[1]){for(let r=R.indexOf(b[0]);r<=R.indexOf(a[0]);r++)res.push(R[r]+R[r]);}else{for(let r=R.indexOf(b[1]);r<=R.indexOf(a[1]);r++)res.push(a[0]+R[r]+(a[2]||''));}return res;}
  if(!plus)return[tok];const res=[];
  if(tok[0]===tok[1]){for(let r=R.indexOf(tok[0]);r<13;r++)res.push(R[r]+R[r]);}
  else{for(let r=R.indexOf(tok[1]);r<R.indexOf(tok[0]);r++)res.push(tok[0]+R[r]+(tok[2]||''));}
  return res;}
// simple preflop strength ordering for top:X%
function allHands(){const hs=[];for(let i=12;i>=0;i--)for(let j=i;j>=0;j--){if(i===j)hs.push(R[i]+R[j]);else{hs.push(R[i]+R[j]+'s');hs.push(R[i]+R[j]+'o');}}return hs;}
let strengthCache=null;
function strength(){if(strengthCache)return strengthCache;const rng=mulberry(7);const m={};
  for(const h of allHands()){const cs=combos(h);let w=0,n=0;for(let it=0;it<1500;it++){const hc=cs[it%cs.length];const used=new Set(hc);const deck=[];for(let c=0;c<52;c++)if(!used.has(c))deck.push(c);shuffle(deck,rng);const v=[deck[0],deck[1]];const b=deck.slice(2,7);const a=evalHand([...hc,...b]),bb=evalHand([...v,...b]);w+=a>bb?1:a===bb?.5:0;n++;}m[h]=w/n;}
  strengthCache=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(e=>e[0]);return strengthCache;}
function parseRange(str){if(str==='random')return allHands().flatMap(combos);
  if(str.startsWith('top:')){const pct=+str.slice(4)/100;const order=strength();const res=[];let tot=0;for(const h of order){const c=combos(h);res.push(...c);tot+=c.length;if(tot>=1326*pct)break;}return res;}
  return str.split(',').flatMap(expand).flatMap(combos);}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function equity(hero,range,board,iters=40000){const h=cards(hero),b=cards(board);const dead=new Set([...h,...b]);
  const rc=parseRange(range).filter(c=>!dead.has(c[0])&&!dead.has(c[1]));const rng=mulberry(42);let w=0;
  for(let it=0;it<iters;it++){const v=rc[Math.floor(rng()*rc.length)];const used=new Set([...dead,...v]);const deck=[];for(let c=0;c<52;c++)if(!used.has(c))deck.push(c);
    for(let k=0;k<5-b.length;k++){const j=k+Math.floor(rng()*(deck.length-k));[deck[k],deck[j]]=[deck[j],deck[k]];}
    const full=[...b,...deck.slice(0,5-b.length)];const a=evalHand([...h,...full]),c=evalHand([...v,...full]);w+=a>c?1:a===c?.5:0;}
  return {eq:+(w/iters*100).toFixed(1),combos:rc.length};}
module.exports={equity,evalHand,cards,parseRange,combos};
if(require.main===module){const [h,r,b,n]=process.argv.slice(2);console.log(h,'vs',r,'on',b||'-',equity(h,r,b||'',+n||40000));}
