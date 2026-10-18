'use client';
import {useEffect,useState} from 'react';import {AnimatePresence,motion} from 'framer-motion';import {db} from '@/lib/db';import {CH} from '@/lib/data';import type {Bug} from '@/lib/types';
export default function Spot(){
 const [cards,setCards]=useState<Bug[]|null>(null),[i,setI]=useState(0),[sel,setSel]=useState<number|null>(null),[hits,setHits]=useState(0);
 useEffect(()=>{db.bugs().then(b=>setCards([...b].sort(()=>Math.random()-.5)))},[]);
 if(!cards)return <p className="text-mu" role="status">Loading…</p>;if(!cards.length)return <p className="text-mu">No cards yet.</p>;
 if(i>=cards.length)return <main className="rounded-3xl border border-ln bg-sf p-8"><h1 className="font-serif text-4xl" data-testid="spot-score">{hits} of {cards.length} flaws spotted</h1><p className="mt-2 text-mu">Real exam distractors often use absolute words, swapped definitions, or half-true statements. Watch for those patterns.</p><button onClick={()=>{setI(0);setSel(null);setHits(0)}} className="mt-5 rounded-full bg-ac px-5 py-2 text-bg">Go again</button></main>;
 const c=cards[i],ok=sel===c.flaw;
 const pick=(n:number)=>{if(sel!==null)return;setSel(n);if(n===c.flaw)setHits(h=>h+1);db.logBug(c.id,n).catch(()=>{})};
 return <main><div className="mb-3 flex items-center gap-2"><h1 className="font-serif text-3xl">Spot the bug in the reasoning</h1><span className="text-sm text-mu">Card {i+1} of {cards.length}</span></div>
  <AnimatePresence mode="wait"><motion.section key={c.id} initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} transition={{duration:.25}} className="rounded-3xl border border-ln bg-sf p-6 md:p-8">
   <div className="flex gap-2 text-xs"><span className="rounded-md bg-ac/15 px-2 py-1 font-semibold text-ac">{c.k} · Ch{c.ch}: {CH[c.ch-1]}</span></div>
   <p className="mt-4 text-sm text-mu">A candidate answer says:</p>
   <blockquote data-testid="claim" className="mt-1 border-l-4 border-ac pl-4 font-serif text-2xl leading-snug">{c.claim}</blockquote>
   <p className="mb-2 mt-6 text-sm text-mu">What is wrong with this reasoning?</p>
   <div className="space-y-2">{c.options.map((o,n)=>{const st=sel===null?'border-ln hover:border-ac':n===c.flaw?'border-ok bg-ok/10':n===sel?'border-bad bg-bad/10':'border-ln opacity-60';
    return <motion.button key={n} whileTap={{scale:.985}} disabled={sel!==null} onClick={()=>pick(n)} className={`block w-full rounded-2xl border p-4 text-left ${st}`}><span className="mr-3 text-mu">{'ABCD'[n]}</span>{o}</motion.button>})}</div>
   <AnimatePresence>{sel!==null&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="overflow-hidden"><div data-testid="spot-result" className={`mt-4 rounded-2xl border p-4 ${ok?'border-ok':'border-bad'}`}>
    <div className="font-semibold">{ok?'You found the flaw.':'Not that one.'} <span className="ml-1 rounded-full bg-tx px-2.5 py-0.5 text-xs text-bg" data-testid="trap">{c.trap}</span></div>
    <p className="mt-2 text-mu">{c.correction}</p></div>
    <button onClick={()=>{setI(i+1);setSel(null)}} className="mt-4 rounded-full bg-ac px-5 py-2 text-sm text-bg">{i+1<cards.length?'Next card':'See results'}</button></motion.div>}</AnimatePresence></motion.section></AnimatePresence></main>}
