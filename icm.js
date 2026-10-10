// Malmuth-Harville ICM with memo over subsets
function icm(stacks, pays){
  const n=stacks.length, P=pays.slice(0,n); const memo=new Map(); const total=stacks.reduce((a,b)=>a+b,0);
  // eq[i] = expected prize of i
  const eq=new Array(n).fill(0);
  function rec(mask, place, prob){ // mask: remaining players
    if(place>=P.length||prob<1e-12) return;
    let sum=0; for(let i=0;i<n;i++) if(mask>>i&1) sum+=stacks[i];
    if(sum<=0) return;
    for(let i=0;i<n;i++) if(mask>>i&1){ if(stacks[i]<=0) continue; const p=prob*stacks[i]/sum; eq[i]+=p*P[place]; rec(mask&~(1<<i), place+1, p); }
  }
  // memoized version for speed: compute via DP over masks
  const full=(1<<n)-1;
  const prob=new Float64Array(1<<n); prob[full]=1;
  const sums=new Float64Array(1<<n); for(let m=1;m<=full;m++){const lb=m&-m;const i=31-Math.clz32(lb);sums[m]=sums[m^lb]+stacks[i];}
  // iterate masks in decreasing popcount
  const order=[];for(let m=1;m<=full;m++)order.push(m);order.sort((a,b)=>popc(b)-popc(a));
  for(const m of order){const pm=prob[m]; if(pm===0)continue; const place=n-popc(m); if(place>=P.length) continue; const s=sums[m]; if(s<=0)continue;
    for(let i=0;i<n;i++) if(m>>i&1){const p=pm*stacks[i]/s; eq[i]+=p*P[place]; prob[m^(1<<i)]+=p;}}
  return eq;
}
function popc(x){x=x-((x>>1)&0x55555555);x=(x&0x33333333)+((x>>2)&0x33333333);return(((x+(x>>4))&0xF0F0F0F)*0x1010101)>>24;}
module.exports={icm};
