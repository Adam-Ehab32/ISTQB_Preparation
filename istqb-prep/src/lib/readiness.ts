import type {K} from './data';import type {ChReady} from './types';
const W:Record<K,number>={K1:1,K2:2,K3:3};
const rnd=(x:number)=>Math.floor(x+.5);
/** Per-chapter readiness: 60% K-weighted accuracy (K1 x1, K2 x2, K3 x3, only levels attempted) + 40% syllabus coverage
 *  (distinct questions answered correctly / questions in the chapter). Mirrors the chapter_readiness SQL view. */
export function chapterReadiness(att:{ch:number;k:K;ok:boolean;q:string}[],nq:Record<number,number>):ChReady[]{
 return [1,2,3,4,5,6].map(ch=>{const a=att.filter(x=>x.ch===ch),acc:ChReady['acc']={K1:null,K2:null,K3:null};
  (['K1','K2','K3'] as K[]).forEach(k=>{const l=a.filter(x=>x.k===k);if(l.length)acc[k]=rnd(100*l.filter(x=>x.ok).length/l.length)});
  const ks=(['K1','K2','K3'] as K[]).filter(k=>acc[k]!==null),w=ks.reduce((s,k)=>s+W[k],0),wacc=w?ks.reduce((s,k)=>s+W[k]*acc[k]!,0)/w:0;
  const cov=nq[ch]?rnd(100*Math.min(1,new Set(a.filter(x=>x.ok&&!x.q.startsWith('g:')).map(x=>x.q)).size/nq[ch])):0;
  return {ch,acc,coverage:cov,attempts:a.length,readiness:a.length?rnd(.6*wacc+.4*cov):0}})}
