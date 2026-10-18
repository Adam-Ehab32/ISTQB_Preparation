'use client';
import {motion} from 'framer-motion';import {CH} from '@/lib/data';import type {ChReady} from '@/lib/types';
const band=(c:ChReady)=>!c.attempts?'none':c.readiness<40?'low':c.readiness<70?'mid':'high';
const COL={none:'bg-ln',low:'bg-bad',mid:'bg-wn',high:'bg-ok'};
const fmt=(v:number|null)=>v===null?'-':v+'%';
export default function ChapterCard({c,i}:{c:ChReady;i:number}){
 const b=band(c);
 return <motion.div data-testid={`ch-card-${c.ch}`} data-band={b} data-readiness={c.readiness} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.05}} className="rounded-3xl border border-ln bg-sf p-5">
  <div className="flex items-baseline justify-between"><span className="text-sm text-mu">Chapter {c.ch}</span><span className="font-serif text-3xl tabular-nums">{c.attempts?c.readiness+'%':'0%'}</span></div>
  <div className="font-medium">{CH[c.ch-1]}</div>
  <div className="my-3 h-2 overflow-hidden rounded-full bg-ln" role="progressbar" aria-valuenow={c.readiness} aria-valuemin={0} aria-valuemax={100} aria-label={`Chapter ${c.ch} readiness`}><motion.div className={`h-full ${COL[b]}`} initial={{width:0}} animate={{width:`${c.readiness}%`}} transition={{duration:.7,delay:i*.05}}/></div>
  <div className="flex justify-between text-xs text-mu tabular-nums"><span>K1 {fmt(c.acc.K1)}</span><span>K2 {fmt(c.acc.K2)}</span><span>K3 {fmt(c.acc.K3)}</span></div>
  <div className="mt-1 text-xs text-mu">{c.attempts?`Coverage ${c.coverage}% · ${c.attempts} answers`:'Not started'}</div></motion.div>}
