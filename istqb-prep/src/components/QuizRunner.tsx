'use client';
import {useEffect,useRef,useState} from 'react';import Link from 'next/link';import {AnimatePresence,motion} from 'framer-motion';
import Drawer from '@/components/Drawer';import Analogy from '@/components/Analogy';import {KL} from '@/lib/data';import {db} from '@/lib/db';import {useProfile} from '@/lib/profile';import type {Q,Result} from '@/lib/types';
const R=22,C=2*Math.PI*R,L='ABCD';
const uuid=()=>globalThis.crypto?.randomUUID?.()??'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&3|8).toString(16)});
const mmss=(s:number)=>`${Math.floor(Math.max(s,0)/60)}:${String(Math.max(s,0)%60).padStart(2,'0')}`;
type Log={q:Q;ok:boolean;ms:number;sel:number};
export default function QuizRunner({questions,mode,totalSec,onAgain,coffee}:{questions:Q[];mode:'practice'|'mock';totalSec?:number;onAgain?:()=>void;coffee?:boolean}){
 const [i,setI]=useState(0),[sel,setSel]=useState<number|null>(null),[left,setLeft]=useState(KL[questions[0].k].sec),[g,setG]=useState(totalSec??0),[hint,setHint]=useState(false),[hu,setHu]=useState(false),[log,setLog]=useState<Log[]>([]),[res,setRes]=useState<Result|null>(null),[gained,setGained]=useState(0),[err,setErr]=useState(''),[bonus,setBonus]=useState(0);
 const t0=useRef(Date.now()),sid=useRef(uuid()),saved=useRef(false),cdone=useRef(false),{setP}=useProfile(),mock=mode==='mock';
 const done=i>=questions.length||(mock&&g<=0),q=questions[Math.min(i,questions.length-1)],sec=KL[q.k].sec;
 useEffect(()=>{setSel(null);setRes(null);setHu(false);setLeft(sec);t0.current=Date.now()},[i,sec]);
 useEffect(()=>{if(done)return;const id=setInterval(()=>{if(mock)setG(x=>x-1);else if(sel===null)setLeft(l=>l-1)},1000);return()=>clearInterval(id)},[done,sel,mock]);
 useEffect(()=>{if(!mock&&left<=0&&sel===null&&!done){setSel(-1);setLog(l=>[...l,{q,ok:false,ms:sec*1000,sel:-1}])}},[left]); // eslint-disable-line
 useEffect(()=>{if(done&&mock&&!saved.current){saved.current=true;db.saveMock(log.filter(x=>x.ok).length,questions.length).catch(()=>{})}},[done]); // eslint-disable-line
 useEffect(()=>{if(done&&coffee&&!cdone.current){cdone.current=true;db.completeCoffee().then(b=>{if(b){setBonus(b);db.profile().then(setP)}}).catch(()=>{})}},[done]); // eslint-disable-line
 const ans=async(n:number)=>{if(sel!==null)return;setSel(n);const ms=Date.now()-t0.current;
  try{const r=await db.submit(q,n,ms,hu,sid.current);setRes(r);setP(r.profile);setGained(x=>x+r.xp.total);setLog(l=>[...l,{q,ok:r.ok,ms,sel:n}])}
  catch(e:any){setErr(e.message);setLog(l=>[...l,{q,ok:n===q.correct,ms,sel:n}])}};
 if(done){const ok=log.filter(x=>x.ok).length,n=questions.length,slow=log.filter(x=>x.q.k==='K1'&&x.ms>KL.K1.sec*800).length,pass=ok/n>=.65;
  return <main className="rounded-3xl border border-ln bg-sf p-8"><h1 className="font-serif text-4xl" data-testid="score">{ok} of {n} correct</h1>
   <p className="mt-2 text-mu">{mock?(pass?'Pass: you cleared the 65% threshold.':'Below the 65% pass threshold (26 of 40).'):`Average ${Math.round(log.reduce((s,x)=>s+x.ms,0)/Math.max(log.length,1)/1000)}s per question. ${slow?`${slow} simple K1 question(s) used most of the time limit.`:'K1 answers were fast.'}`} You earned <b data-testid="xp-total">{gained} XP</b>.{bonus>0&&<> Smart Coffee bonus <b data-testid="coffee-bonus">+{bonus} XP</b>.</>}</p>
   {mock&&log.filter(x=>!x.ok).length>0&&<div className="mt-6 space-y-3"><h2 className="font-serif text-2xl">Review your mistakes</h2>{log.filter(x=>!x.ok).map(x=><div key={x.q.id} className="rounded-2xl border border-ln bg-bg p-4"><div className="font-medium">{x.q.stem}</div><div className="mt-1 text-sm text-ok">Answer: {L[x.q.correct]}. {x.q.options[x.q.correct]}</div><p className="mt-1 text-sm text-mu">{x.q.explanation}</p>{x.q.analogy&&<Analogy text={x.q.analogy}/>}</div>)}</div>}
   <div className="mt-6 flex gap-2">{onAgain&&<button onClick={onAgain} className="rounded-full bg-ac px-5 py-2 text-bg">Try again</button>}<Link prefetch={false} href="/leaderboard" className="rounded-full px-5 py-2 ring-1 ring-ln">See leaderboard</Link></div></main>}
 const vn=res?.vault?(res.vault.cleared?'Cleared from your Mistake Vault':res.vault.in?(res.ok?`${2-res.vault.streak} more correct in a row clears it`:'Added to your Mistake Vault'):''):'';
 const urgent=mock?g<=300:left<=10&&sel===null,verdict=mock||sel===null?null:sel===-1?'Time is up':sel===q.correct?'Correct':'Not quite';
 return <main className="rounded-3xl border border-ln bg-sf p-6 md:p-8">
  <div className="flex items-center justify-between gap-4">
   <div className="flex items-center gap-2"><span className="rounded-md bg-ac/15 px-2.5 py-1 text-sm font-semibold text-ac">{q.k} {KL[q.k].label}</span>{q.set&&<span className="rounded-md px-2 py-1 text-xs ring-1 ring-ln">Set {q.set}</span>}<span className="text-sm text-mu">Question {i+1} of {questions.length}</span></div>
   {mock?<div role="timer" aria-label="Exam time left" className={`font-mono text-2xl tabular-nums ${urgent?'text-bad':''}`}>{mmss(g)}</div>:
   <div role="timer" aria-label={`${Math.max(left,0)} seconds left`} className="relative h-14 w-14"><svg viewBox="0 0 52 52" className="-rotate-90"><circle cx="26" cy="26" r={R} fill="none" strokeWidth="4" className="stroke-ln"/>
    <motion.circle cx="26" cy="26" r={R} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} animate={{strokeDashoffset:C*(1-Math.max(left,0)/sec)}} transition={{duration:1,ease:'linear'}} className={urgent?'stroke-bad':'stroke-ac'}/></svg>
    <span className={`absolute inset-0 grid place-items-center text-sm tabular-nums ${urgent?'text-bad':''}`}>{Math.max(left,0)}</span></div>}</div>
  <AnimatePresence mode="wait"><motion.div key={i} initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} transition={{duration:.25}}>
   <h1 className="my-6 font-serif text-2xl leading-snug md:text-3xl">{q.stem}</h1>
   <div className="space-y-2">{q.options.map((o,n)=>{const st=sel===null?'border-ln hover:border-ac':mock?(n===sel?'border-ac bg-ac/10':'border-ln opacity-60'):n===q.correct?'border-ok bg-ok/10':n===sel?'border-bad bg-bad/10':'border-ln opacity-60';
    return <motion.button key={n} whileTap={{scale:.985}} disabled={sel!==null} onClick={()=>ans(n)} className={`block w-full rounded-2xl border p-4 text-left ${st}`}><span className="mr-3 text-mu">{L[n]}</span>{o}</motion.button>})}</div></motion.div></AnimatePresence>
  <div className="mt-5 flex flex-wrap items-center gap-3">{!mock&&<button onClick={()=>{setHu(true);setHint(true)}} className="rounded-full px-4 py-2 text-sm ring-1 ring-ln hover:bg-bg">Get concept hint</button>}
   {sel!==null&&<motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={()=>setI(i+1)} className="rounded-full bg-ac px-5 py-2 text-sm text-bg">{i+1<questions.length?'Next question':mock?'Finish exam':'See results'}</motion.button>}
   {err&&<span role="alert" className="text-sm text-bad">{err}</span>}</div>
  <AnimatePresence>{res&&!mock&&<motion.div key="xp" data-testid="xp-gain" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 flex flex-wrap gap-2 text-sm">
   {res.xp.total>0?<><span className="rounded-full bg-ac px-3 py-1 font-semibold text-bg">+{res.xp.total} XP</span>{res.xp.speed>0&&<span className="rounded-full px-3 py-1 ring-1 ring-ln">Speed bonus +10</span>}{res.xp.streak>0&&<span className="rounded-full px-3 py-1 ring-1 ring-ln">5-in-a-row +25</span>}{res.xp.daily>0&&<span className="rounded-full px-3 py-1 ring-1 ring-ln">Daily 15-min goal +50</span>}</>:<span className="text-mu">No XP this time. Correct answers earn XP.</span>}{vn&&<span data-testid="vault-note" className="rounded-full px-3 py-1 ring-1 ring-ln">{vn}</span>}</motion.div>}</AnimatePresence>
  <AnimatePresence>{verdict&&<motion.div key="ex" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden"><div className={`mt-4 rounded-2xl border p-4 ${sel===q.correct?'border-ok':'border-bad'}`}><div className="font-semibold">{verdict}. The answer is {L[q.correct]}.</div><p className="mt-1 text-mu">{q.explanation}</p>{q.analogy&&<Analogy text={q.analogy}/>}</div></motion.div>}</AnimatePresence>
  <Drawer open={hint} onClose={()=>setHint(false)} title="Concept hint"><p>{q.hint}</p><p className="mt-4 text-sm text-mu">Chapter {q.ch}. Target time for {q.k}: {sec} seconds. Using a hint is tracked with your attempt.</p></Drawer></main>}
