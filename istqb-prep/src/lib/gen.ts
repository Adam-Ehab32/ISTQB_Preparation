import type {GenQ} from './types';
const r=(a:number,b:number)=>a+Math.floor(Math.random()*(b-a+1));
const shuffle=<T,>(a:T[]):T[]=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=r(0,i);[x[i],x[j]]=[x[j],x[i]]}return x};
const uniq=(c:string,cands:string[])=>[...new Set(cands.filter(x=>x!==c))].slice(0,3);
const fmt=(n:number)=>String(Math.round(n*10)/10);
function mk(key:string,ch:number,d:number,stem:string,correct:string,wrong:string[],hint:string,explanation:string,analogy?:string):GenQ{
 const options=shuffle([correct,...uniq(correct,wrong)]);
 return {key,k:'K3',ch,d,stem,options,correct:options.indexOf(correct),hint,explanation,analogy}}
/** Parameterised K3 questions: every call produces a fresh numeric variant whose answer is computed, so it is always correct. */
const GENS:(()=>GenQ)[]=[
 ()=>{const t=r(3,5),e:number[]=[r(50,150)];while(e.length<t-1)e.push(e[e.length-1]+r(80,300));
  const bands=e.map((v,i)=>`${i?e[i-1]:1} to ${v-1}: ${i*5}%`).concat(`${e[e.length-1]} and above: ${(t-1)*5}%`).join('; ');
  return mk(`ep:${t}:${e.join('-')}`,4,2,`A shop applies a discount by order total (valid totals only): ${bands}. Using equivalence partitioning, what is the minimum number of test cases needed to cover all valid partitions?`,String(t),[String(t+1),String(t-1),String(t*2),String(t+2)],"One representative value per valid partition is enough.",`There are ${t} valid partitions, and each needs at least one test case, so ${t}. Invalid partitions would need additional tests.`,"A canteen charges by age band. If the till is right for one child ticket it is assumed right for every child, so you test one ticket per band.")},
 ()=>{const lo=r(1,60),hi=lo+r(10,60);
  return mk(`bva2:${lo}-${hi}`,4,2,`An input accepts whole numbers from ${lo} to ${hi} inclusive. Using 2-value boundary value analysis, which values should be tested?`,`${lo-1}, ${lo}, ${hi}, ${hi+1}`,[`${lo}, ${lo+1}, ${hi-1}, ${hi}`,`${lo-1}, ${lo}, ${lo+1}, ${hi-1}, ${hi}, ${hi+1}`,`${lo-1}, ${hi+1}`],"2-value BVA: each boundary plus its closest neighbor in the adjacent partition.",`The boundaries are ${lo} and ${hi}. Their closest neighbors in the invalid partitions are ${lo-1} and ${hi+1}, giving ${lo-1}, ${lo}, ${hi}, ${hi+1}.`,"A speed camera triggers at the limit itself. Bugs hide at the edge, so you check the value just outside and the value on the line.")},
 ()=>{const lo=r(1,60),hi=lo+r(10,60);
  return mk(`bva3:${lo}-${hi}`,4,3,`An input accepts whole numbers from ${lo} to ${hi} inclusive. Using 3-value boundary value analysis, which values should be tested?`,`${lo-1}, ${lo}, ${lo+1}, ${hi-1}, ${hi}, ${hi+1}`,[`${lo-1}, ${lo}, ${hi}, ${hi+1}`,`${lo}, ${hi}`,`${lo-1}, ${lo}, ${hi}, ${hi+1}, ${hi+2}`],"3-value BVA tests each boundary with a neighbor on both sides.",`For boundary ${lo}: ${lo-1}, ${lo}, ${lo+1}. For boundary ${hi}: ${hi-1}, ${hi}, ${hi+1}.`)},
 ()=>{const n=r(2,5),c=2**n;
  return mk(`dt:${n}`,4,2,`A decision table has ${n} independent true/false conditions. How many columns (rules) does the full table have before collapsing?`,String(c),[String(n*2),String(n*n),String(2**(n+1)),String(2**(n-1)),String(n+c)],"Each extra condition doubles the number of combinations.",`${n} binary conditions give 2^${n} = ${c} combinations. Collapsing merges rules where a condition is irrelevant.`,`${n} yes/no questions before a trip give ${c} possible packing lists. The table writes them all down so none is forgotten.`)},
 ()=>{const m=r(4,20),a=r(1,m-1);let b=m+1;while((a+4*m+b)%6)b++;b+=6*r(0,3);const e=(a+4*m+b)/6;
  return mk(`3p:${a}-${m}-${b}`,5,3,`Estimates for a task: optimistic ${a} days, most likely ${m} days, pessimistic ${b} days. What is the three-point estimate using (a + 4m + b) / 6?`,fmt(e),[fmt((a+m+b)/3),String(m),fmt((a+b)/2),String(a+m+b)],"Weight the most likely value four times.",`(${a} + 4 x ${m} + ${b}) / 6 = ${a+4*m+b} / 6 = ${fmt(e)} days.`,"Estimating a commute with best, likely and worst cases gives a more honest answer than one hopeful number.")},
 ()=>{const S=[20,25,40,50][r(0,3)],ps=[.4,.6,.8,.5,.75].filter(p=>Number.isInteger(S*p)),p=ps[r(0,ps.length-1)],x=S*p,st=r(0,1)===0,what=st?'executable statements':'branches',cov=st?'statement':'branch';
  return mk(`cov:${cov}:${S}-${x}`,4,2,`A component has ${S} ${what}. The test suite exercises ${x} of them. What is the ${cov} coverage?`,`${Math.round(p*100)}%`,[`${Math.round((1-p)*100)}%`,`${x}%`,`${S-x}%`,`${Math.round(p*100)+10}%`],`Coverage = items exercised / total items x 100.`,`${x} / ${S} = ${Math.round(p*100)}% ${cov} coverage.`)}];
/** n distinct fresh variants (distinct keys). */
export function generate(n:number):GenQ[]{const out:GenQ[]=[],seen=new Set<string>();let guard=0;
 while(out.length<n&&guard++<n*6){const q=GENS[r(0,GENS.length-1)]();if(!seen.has(q.key)){seen.add(q.key);out.push(q)}}return out}
