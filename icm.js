// Malmuth-Harville ICM, exact subset DP. Payouts use the caller's units.
function icm(stacks, pays) {
  const n=stacks.length;
  if (!n || n>20 || stacks.some(x=>!Number.isFinite(x)||x<0) || pays.some(x=>!Number.isFinite(x)||x<0)) throw new Error('Invalid ICM inputs');
  const prizes=Array.from({length:n},(_,i)=>pays[i] || 0);
  if (prizes.some((x,i)=>i>0 && x>prizes[i-1])) throw new Error('Payouts must descend');
  const active=stacks.map((s,i)=>s>0?i:-1).filter(i=>i>=0), m=active.length;
  if (!m) throw new Error('At least one live stack required');
  const eq=Array(n).fill(0);
  // Zero stack is already eliminated, not an unpaid player still in the draw.
  // Multiple zero stacks are treated as tied eliminations and split tail prizes.
  const tail=prizes.slice(m).reduce((a,b)=>a+b,0)/(n-m || 1);
  stacks.forEach((s,i)=>{if(s===0)eq[i]=tail;});
  const full=(1<<m)-1, prob=new Float64Array(1<<m), sums=new Float64Array(1<<m), counts=new Uint8Array(1<<m);
  prob[full]=1;
  for(let mask=1;mask<=full;mask++) {
    const bit=mask&-mask, j=31-Math.clz32(bit);
    sums[mask]=sums[mask^bit]+stacks[active[j]];
    counts[mask]=counts[mask^bit]+1;
  }
  // Removing a bit always produces a numerically smaller mask.
  for(let mask=full;mask>0;mask--) {
    if(!prob[mask])continue;
    const place=m-counts[mask];
    for(let j=0;j<m;j++) if(mask&(1<<j)) {
      const p=prob[mask]*stacks[active[j]]/sums[mask];
      eq[active[j]]+=p*prizes[place];
      prob[mask^(1<<j)]+=p;
    }
  }
  return eq;
}
module.exports={icm};
