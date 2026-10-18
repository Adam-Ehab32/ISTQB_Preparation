'use client';
import {useEffect,useState} from 'react';import {motion} from 'framer-motion';import QuizRunner from '@/components/QuizRunner';import {db} from '@/lib/db';import type {Vault,Q} from '@/lib/types';
export default function VaultPage(){
 const [v,setV]=useState<Vault|null>(null),[run,setRun]=useState<Q[]|null>(null),[n,setN]=useState(0),[err,setErr]=useState('');
 const load=()=>db.vault().then(setV).catch(e=>setErr(e.message));
 useEffect(()=>{load()},[]);
 if(err)return <p role="alert" className="text-bad">{err}</p>;if(!v)return <p className="text-mu" role="status">Opening vault…</p>;
 if(run)return <QuizRunner key={n} questions={run} mode="practice" onAgain={()=>{setRun(null);setV(null);load()}}/>;
 return <main><h1 className="font-serif text-4xl">Mistake Vault</h1>
  <p className="mt-2 max-w-2xl text-mu">Every question you miss lands here. Answer it correctly twice in a row to clear it; a miss resets the count. Retest only what you got wrong.</p>
  <div className="my-5 grid grid-cols-2 gap-3 sm:max-w-md"><div className="rounded-3xl border border-ln bg-sf p-5"><div className="text-sm text-mu">In the vault</div><div className="font-serif text-4xl tabular-nums" data-testid="vault-count">{v.questions.length}</div></div>
   <div className="rounded-3xl border border-ln bg-sf p-5"><div className="text-sm text-mu">Cleared</div><div className="font-serif text-4xl tabular-nums" data-testid="vault-cleared">{v.cleared}</div></div></div>
  {!v.questions.length?<p className="rounded-3xl border border-ln bg-sf p-6 text-mu" role="status">Your vault is empty. Missed questions will appear here automatically.</p>:<>
   <button onClick={()=>{setRun([...v.questions].sort(()=>Math.random()-.5));setN(n+1)}} className="mb-4 rounded-full bg-ac px-6 py-3 font-semibold text-bg">Retest {v.questions.length} {v.questions.length===1?'mistake':'mistakes'}</button>
   <ul className="space-y-2" data-testid="vault-list">{v.questions.map((q,i)=><motion.li key={q.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.03}} className="flex items-center gap-4 rounded-2xl border border-ln bg-sf p-4">
    <span className="rounded-md bg-ac/15 px-2 py-1 text-xs font-semibold text-ac">{q.k} · Ch{q.ch}</span><span className="min-w-0 flex-1">{q.stem}</span>
    <span className="flex gap-1" aria-label={`${v.streaks[q.id]||0} of 2 correct in a row`}>{[0,1].map(d=><span key={d} className={`h-2.5 w-2.5 rounded-full ${(v.streaks[q.id]||0)>d?'bg-ok':'bg-ln'}`}/>)}</span></motion.li>)}</ul></>}</main>}
