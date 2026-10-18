'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {motion} from 'framer-motion';
import {CHUNKS} from '@/lib/data';import {db} from '@/lib/db';import {readiness,COFFEE_BONUS} from '@/lib/xp';import {useProfile} from '@/lib/profile';import Gauge from '@/components/Gauge';import Heatmap from '@/components/Heatmap';import ChapterCard from '@/components/ChapterCard';import type {ChReady,Coffee,Mock} from '@/lib/types';
const key=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
export default function Dashboard(){
 const {p,setP}=useProfile(),[done,setDone]=useState<string[]>([]),[act,setAct]=useState<Record<string,number>>({}),[chs,setChs]=useState<ChReady[]>([]),[mocks,setMocks]=useState<Mock[]>([]),[cof,setCof]=useState<Coffee|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{Promise.all([db.activity(),db.chapters(),db.mocks(),db.coffee()]).then(([a,c,m,cf])=>{setAct(a);setChs(c);setMocks(m);setCof(cf);setReady(true)}).catch(()=>setReady(true))},[p?.total_xp]);
 const score=readiness(chs,mocks);
 useEffect(()=>{if(ready&&p&&p.istqb_readiness_score!==score)db.updateProfile({istqb_readiness_score:score}).then(setP).catch(()=>{})},[ready,score]); // eslint-disable-line
 const mins=done.length*15,tot=CHUNKS.length*15,today=act[key()]||0,toggle=(id:string)=>setDone(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id]);
 const best=mocks.length?Math.round(Math.max(...mocks.map(m=>m.correct/m.total*100))):null;
 return <main className="grid gap-4 md:grid-cols-3">
  <section data-testid="coffee-widget" className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ln bg-sf p-5 md:col-span-3">
   <div><h2 className="font-serif text-2xl">Smart Coffee</h2><p className="text-sm text-mu">{cof?.done?`Done for today. +${COFFEE_BONUS} XP earned.`:`3 questions picked for you today, about 3 minutes. Finish all 3 for +${COFFEE_BONUS} XP.`}</p></div>
   <div className="flex flex-wrap items-center gap-2">{cof&&!cof.done&&cof.reasons.map((r,i)=><span key={i} data-testid="coffee-reason" className="rounded-full px-3 py-1 text-sm ring-1 ring-ln">{r}</span>)}
    {cof&&cof.questions.length>0&&<Link prefetch={false} href="/coffee" className={`rounded-full px-5 py-2 text-sm font-semibold ${cof.done?'ring-1 ring-ln':'bg-ac text-bg'}`}>{cof.done?'View':'Brew now'}</Link>}</div></section>
  <section className="rounded-3xl border border-ln bg-sf p-6 md:col-span-2 md:row-span-2">
   <p className="text-sm text-mu">Welcome back{p?`, ${p.display_name}`:''}</p>
   <h1 className="font-serif text-3xl">Three 15-minute chunks today</h1>
   <p className="mt-1 text-mu">{mins} of {tot} minutes done</p>
   <div className="my-4 h-2 overflow-hidden rounded-full bg-ln"><motion.div className="h-full bg-ac" animate={{width:`${mins/tot*100}%`}} transition={{type:'spring',stiffness:120,damping:20}}/></div>
   <ul className="space-y-3">{CHUNKS.map(c=>{const d=done.includes(c.id);return <motion.li layout key={c.id} className="flex items-center gap-4 rounded-2xl border border-ln bg-bg p-4">
    <button role="checkbox" aria-checked={d} aria-label={`Mark "${c.title}" ${d?'not done':'done'}`} onClick={()=>toggle(c.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 ring-ln">
     <motion.span initial={false} animate={{scale:d?1:0}} className="grid h-7 w-7 place-items-center rounded-full bg-ok text-sm text-bg">✓</motion.span></button>
    <div className="min-w-0 flex-1"><div className={d?'text-mu line-through':''}>{c.title}</div><div className="text-sm text-mu">{c.min} min. {c.note}</div></div>
    <Link prefetch={false} href={c.href} className="rounded-full px-4 py-1.5 text-sm ring-1 ring-ln hover:bg-sf">{c.cta}</Link></motion.li>})}</ul></section>
  <section className="rounded-3xl border border-ln bg-sf p-6"><h2 className="mb-2 text-sm text-mu">ISTQB readiness</h2><Gauge score={score}/>
   <p className="mt-3 text-sm text-mu">Exam-weighted chapter readiness{best!==null?` · best mock ${best}%`:' · no mock exam yet'}. Pass mark is 65%.{best===null&&<> <Link prefetch={false} href="/mock" className="text-ac underline underline-offset-4">Take a mock</Link> to unlock the full score.</>}</p></section>
  <section className="grid grid-cols-2 gap-4">
   <div className="rounded-3xl border border-ln bg-sf p-5"><div className="text-sm text-mu">Total XP</div><div className="font-serif text-4xl tabular-nums" data-testid="xp-total-tile">{p?.total_xp??0}</div></div>
   <div className="rounded-3xl border border-ln bg-sf p-5"><div className="text-sm text-mu">Streak</div><div className="font-serif text-4xl tabular-nums" data-testid="streak">{p?.streak_days??0}<span className="text-lg text-mu"> d</span></div></div>
   <div className="col-span-2 rounded-3xl border border-ln bg-sf p-5"><div className="flex justify-between text-sm"><span className="text-mu">Daily goal: 15 min of quizzes (+50 XP)</span><span data-testid="goal">{Math.min(today,15)}/15 min</span></div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ln"><motion.div className="h-full bg-ok" animate={{width:`${Math.min(100,today/15*100)}%`}}/></div></div></section>
  <section className="md:col-span-3"><h2 className="mb-3 text-sm text-mu">Readiness by chapter (K-weighted accuracy 60%, coverage 40%)</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="chapter-grid">{(chs.length?chs:[1,2,3,4,5,6].map(ch=>({ch,readiness:0,acc:{K1:null,K2:null,K3:null},coverage:0,attempts:0}))).map((c,i)=><ChapterCard key={c.ch} c={c} i={i}/>)}</div></section>
  <section className="rounded-3xl border border-ln bg-sf p-6 md:col-span-3"><h2 className="mb-3 text-sm text-mu">Study activity, last 20 weeks</h2><Heatmap data={act}/></section>
 </main>}
