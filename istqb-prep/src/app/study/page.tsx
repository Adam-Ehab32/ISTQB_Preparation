'use client';
import {useEffect,useMemo,useState} from 'react';import Link from 'next/link';import {AnimatePresence,motion} from 'framer-motion';import {db} from '@/lib/db';import {CH} from '@/lib/data';import type {Section,Term} from '@/lib/types';
const esc=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function Hl({text,terms}:{text:string;terms:Term[]}){
 if(!terms.length)return <>{text}</>;const re=new RegExp(`\\b(${terms.map(t=>esc(t.t)).join('|')})\\b`,'gi');
 return <>{text.split(re).map((p,i)=>i%2?<mark key={i} data-testid="term-mark" className="rounded bg-ac/20 px-0.5 font-medium text-tx">{p}</mark>:p)}</>}
function TermCard({t,memo}:{t:Term;memo:boolean}){
 const [rev,setRev]=useState(false);
 if(!memo)return <div className="rounded-2xl border border-ln bg-bg p-3"><dt className="font-semibold text-ac">{t.t}</dt><dd className="text-sm text-mu">{t.d}</dd></div>;
 return <button data-testid="term-card" data-revealed={rev} onClick={()=>setRev(!rev)} className="rounded-2xl border border-ln bg-bg p-3 text-left"><span className="block font-semibold text-ac">{t.t}</span>
  <span className={`block text-sm text-mu transition ${rev?'':'select-none blur-sm'}`}>{t.d}</span><span className="text-xs text-mu">{rev?'Tap to hide':'Tap to reveal'}</span></button>}
export default function Study(){
 const [all,setAll]=useState<Section[]|null>(null),[ch,setCh]=useState(1),[open,setOpen]=useState<string[]>([]),[memo,setMemo]=useState(false);
 useEffect(()=>{db.summaries().then(s=>{setAll(s);const f=s.find(x=>x.ch===1);if(f)setOpen([f.id])})},[]);
 const secs=useMemo(()=>(all||[]).filter(s=>s.ch===ch),[all,ch]);
 if(!all)return <p className="text-mu" role="status">Loading notes…</p>;
 const tog=(id:string)=>setOpen(o=>o.includes(id)?o.filter(x=>x!==id):[...o,id]);
 return <main>
  <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-serif text-4xl">Study &amp; Memorize</h1><p className="mt-1 text-sm text-mu">Condensed notes based on the CTFL v4.0 syllabus. The official syllabus is the authoritative source.</p></div>
   <button aria-pressed={memo} onClick={()=>setMemo(!memo)} className={`rounded-full px-5 py-2 text-sm ring-1 ${memo?'bg-ac text-bg ring-ac':'ring-ln hover:bg-sf'}`}>{memo?'Memorize mode on':'Memorize mode'}</button></div>
  <div className="my-4 flex flex-wrap gap-2">{CH.map((n,i)=><button key={n} aria-pressed={ch===i+1} onClick={()=>setCh(i+1)} className={`rounded-full px-4 py-1.5 text-sm ring-1 ${ch===i+1?'bg-tx text-bg ring-tx':'ring-ln hover:bg-sf'}`}>{i+1}. {n}</button>)}</div>
  <div className="mb-3 flex items-center gap-3 text-sm"><h2 data-testid="study-chapter-title" className="font-serif text-2xl">Chapter {ch}: {CH[ch-1]}</h2><button onClick={()=>setOpen(secs.map(s=>s.id))} className="text-mu underline underline-offset-4">Expand all</button><button onClick={()=>setOpen([])} className="text-mu underline underline-offset-4">Collapse all</button>
   <Link prefetch={false} href={`/quiz?ch=${ch}`} className="ml-auto rounded-full bg-ac px-4 py-1.5 text-bg">Quiz this chapter</Link></div>
  <div className="grid gap-3 md:grid-cols-2">{secs.map((s,i)=>{const o=open.includes(s.id);return <motion.section layout key={s.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.05}} className={`rounded-3xl border border-ln bg-sf p-5 ${s.points.length>4||s.terms.length>3?'md:col-span-2':''}`}>
   <button aria-expanded={o} onClick={()=>tog(s.id)} className="flex w-full items-center justify-between text-left"><span className="font-serif text-xl">{s.title}</span><motion.span animate={{rotate:o?180:0}} aria-hidden>▾</motion.span></button>
   <AnimatePresence initial={false}>{o&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><div className="pt-3">
    {memo?<><div className="mb-1 text-xs uppercase tracking-wide text-mu">Remember</div><ul data-testid="memo-list" className="space-y-2">{s.memo.map((m,j)=><li key={j} className="rounded-2xl border border-ac/40 bg-ac/10 p-3 font-medium">{m}</li>)}</ul></>
     :<ul data-testid="points-list" className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed">{s.points.map((p,j)=><li key={j}><Hl text={p} terms={s.terms}/></li>)}</ul>}
    {s.terms.length>0&&<><div className="mb-2 mt-4 text-xs uppercase tracking-wide text-mu">Key terms</div><dl className="grid gap-2 sm:grid-cols-2">{s.terms.map(t=><TermCard key={t.t} t={t} memo={memo}/>)}</dl></>}</div></motion.div>}</AnimatePresence></motion.section>})}</div></main>}
