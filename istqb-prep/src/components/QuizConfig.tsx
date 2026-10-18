'use client';
import {CH} from '@/lib/data';import type {Cfg,Diff} from '@/lib/pool';import type {K} from '@/lib/data';
const chip=(on:boolean)=>`rounded-full px-4 py-1.5 text-sm ring-1 ${on?'bg-ac text-bg ring-ac':'ring-ln hover:bg-bg'}`;
const LV:[string,K[]][]=[['K1 only',['K1']],['K2 only',['K2']],['K3 only',['K3']],['K1 + K2',['K1','K2']],['K1 + K3',['K1','K3']],['K2 + K3',['K2','K3']],['All K1/K2/K3',['K1','K2','K3']]];
const DF:[Diff,string][]=[['auto','Auto-mixed'],['easy','Easy'],['medium','Medium'],['hard','Hard']];
const same=(a:K[],b:K[])=>a.length===b.length&&a.every(x=>b.includes(x));
export default function QuizConfig({cfg,set,info,busy,onStart}:{cfg:Cfg;set:(c:Cfg)=>void;info:{matches:number;unseen:number;gen:boolean;total:number};busy:boolean;onStart:()=>void}){
 const G=({t,children}:{t:string;children:React.ReactNode})=><div className="mb-4"><div className="mb-2 text-sm text-mu">{t}</div><div className="flex flex-wrap gap-2">{children}</div></div>;
 return <div>
  <G t="Chapter"><button aria-pressed={!cfg.ch} onClick={()=>set({...cfg,ch:0})} className={chip(!cfg.ch)}>All chapters</button>{CH.map((n,i)=><button key={n} aria-pressed={cfg.ch===i+1} onClick={()=>set({...cfg,ch:i+1})} className={chip(cfg.ch===i+1)}>Ch{i+1}</button>)}</G>
  <G t="Number of questions">{[5,10,15,20,40].map(n=><button key={n} aria-pressed={cfg.count===n} onClick={()=>set({...cfg,count:n})} className={chip(cfg.count===n)}>{n}</button>)}</G>
  <G t="K-level">{LV.map(([l,v])=><button key={l} aria-pressed={same(cfg.levels,v)} onClick={()=>set({...cfg,levels:v})} className={chip(same(cfg.levels,v))}>{l}</button>)}</G>
  <G t="Difficulty">{DF.map(([d,l])=><button key={d} aria-pressed={cfg.diff===d} onClick={()=>set({...cfg,diff:d})} className={chip(cfg.diff===d)}>{l}</button>)}</G>
  {cfg.diff==='auto'&&<p className="-mt-2 mb-4 text-xs text-mu">Auto-mixed follows the CTFL v4.0 exam chapter weighting (8/6/4/11/9/2 of 40) and roughly 25% K1, 50% K2, 25% K3. This is an approximation; check the official exam structure.</p>}
  <G t="Question set">{['all','A','B','C','D'].map(s=><button key={s} aria-pressed={cfg.set===s} onClick={()=>set({...cfg,set:s})} className={chip(cfg.set===s)}>{s==='all'?'All sets':`Set ${s}`}</button>)}</G>
  <p data-testid="match-info" className="mb-4 rounded-2xl border border-ln bg-bg p-3 text-sm" role="status">{info.matches} matching questions in the bank, {info.unseen} unseen{info.gen?'. Fresh generated K3 variants can fill the rest.':'.'} Your quiz will have {info.total} {info.total===1?'question':'questions'}.</p>
  <button onClick={onStart} disabled={busy||info.total===0} className="w-full rounded-full bg-ac px-6 py-3 font-semibold text-bg disabled:opacity-50">{busy?'Preparing…':'Start quiz'}</button></div>}
