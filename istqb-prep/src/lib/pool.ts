import {blueprint} from './xp';import type {K} from './data';import type {Q,Exposure} from './types';
export type Diff='easy'|'medium'|'hard'|'auto';
export type Cfg={count:number;levels:K[];diff:Diff;ch:number;set:string};
export const defaultCfg:Cfg={count:10,levels:['K1','K2','K3'],diff:'auto',ch:0,set:'all'};
const DM={easy:1,medium:2,hard:3};
export const filterPool=(pool:Q[],c:Cfg)=>pool.filter(q=>c.levels.includes(q.k)&&(!c.ch||q.ch===c.ch)&&(c.set==='all'||q.set===c.set)&&(c.diff==='auto'||(q.d??2)===DM[c.diff]));
const shuffle=<T,>(a:T[]):T[]=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
/** Largest-remainder split of `total` over weights. */
export function quota(total:number,w:number[]):number[]{const s=w.reduce((a,b)=>a+b,0),raw=w.map(x=>total*x/s),fl=raw.map(Math.floor);let rem=total-fl.reduce((a,b)=>a+b,0);
 raw.map((r,i)=>[r-fl[i],i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(rem>0){fl[i]++;rem--}});return fl}
const KW:Record<K,number>={K1:.25,K2:.5,K3:.25};
/** Unseen questions first, then least-seen / least-recently-seen; the previous quiz is pushed to the back. Auto-mixed follows the exam chapter weights and a K1/K2/K3 mix of about 25/50/25 (approximation; verify against the official exam structure). */
export function pickQuiz(pool:Q[],ex:Exposure,c:Cfg,last:string[]=[]){
 const f=filterPool(pool,c),ls=new Set(last),key=new Map(f.map(q=>[q.id,Math.random()]));
 const sorted=[...f].sort((a,b)=>{const ea=ex[a.id],eb=ex[b.id];return ((ea?.n||0)+(ls.has(a.id)?1000:0))-((eb?.n||0)+(ls.has(b.id)?1000:0))||(ea?.last||0)-(eb?.last||0)||key.get(a.id)!-key.get(b.id)!});
 const n=Math.min(c.count,f.length),kq=quota(n,c.levels.map(k=>KW[k])),auto=c.diff==='auto'&&!c.ch,cq=auto?quota(n,[1,2,3,4,5,6].map(ch=>blueprint[ch])):null;
 const kc:Record<string,number>={},cc:Record<number,number>={},out:Q[]=[],tier=(q:Q)=>(ex[q.id]?.n||0)+(ls.has(q.id)?1000:0);
 // Strict tiers: every unseen question outranks every seen one. Quotas (K mix, exam chapter weights) only steer choices inside a tier.
 for(const t of [...new Set(sorted.map(tier))]){if(out.length>=n)break;const items=sorted.filter(q=>tier(q)===t);
  for(const q of items){if(out.length>=n)break;const ki=c.levels.indexOf(q.k);if((kc[q.k]||0)>=kq[ki])continue;if(cq&&(cc[q.ch]||0)>=cq[q.ch-1])continue;kc[q.k]=(kc[q.k]||0)+1;cc[q.ch]=(cc[q.ch]||0)+1;out.push(q)}
  for(const q of items){if(out.length>=n)break;if(!out.includes(q))out.push(q)}}
 return {questions:shuffle(out),available:f.length,unseen:f.filter(q=>!ex[q.id]).length}}
const sk=(u:string)=>'iq.served.'+u;
export const getServed=(u:string):{n:Record<string,number>;last:string[]}=>{try{const v=JSON.parse(localStorage.getItem(sk(u))||'');return {n:v.n||{},last:v.last||[]}}catch{return {n:{},last:[]}}};
export const markServed=(u:string,ids:string[])=>{const s=getServed(u);ids.forEach(i=>s.n[i]=(s.n[i]||0)+1);s.last=ids;try{localStorage.setItem(sk(u),JSON.stringify(s))}catch{}};
/** Merge server-side exposure (attempts) with client-side "served" tracking so skipped or timed-out questions also count as seen. */
export function mergeExposure(server:Exposure,u:string):{ex:Exposure;last:string[]}{
 const s=getServed(u),ex:Exposure={...server};Object.entries(s.n).forEach(([id,n])=>{ex[id]={n:Math.max(ex[id]?.n||0,n),last:ex[id]?.last||0}});return {ex,last:s.last}}
