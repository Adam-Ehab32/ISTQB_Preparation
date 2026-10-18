'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import QuizRunner from '@/components/QuizRunner';import {db} from '@/lib/db';import {COFFEE_BONUS} from '@/lib/xp';import type {Coffee} from '@/lib/types';
export default function CoffeePage(){
 const [c,setC]=useState<Coffee|null>(null),[err,setErr]=useState('');
 useEffect(()=>{db.coffee().then(setC).catch(e=>setErr(e.message))},[]);
 if(err)return <p role="alert" className="text-bad">{err}</p>;if(!c)return <p className="text-mu" role="status">Brewing…</p>;
 if(!c.questions.length)return <p className="text-mu">No questions available yet.</p>;
 if(c.done)return <main className="rounded-3xl border border-ln bg-sf p-8"><h1 className="font-serif text-4xl">Today's Smart Coffee is done</h1><p className="mt-2 text-mu">Your next warm-up is picked tomorrow from what you miss and what is due. Want more now?</p><Link prefetch={false} href="/quiz" className="mt-5 inline-block rounded-full bg-ac px-5 py-2 text-bg">Practice quiz</Link></main>;
 return <div><div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><span className="font-serif text-2xl">Smart Coffee</span><span className="text-mu">3 questions, about 3 minutes. Finish all 3 for +{COFFEE_BONUS} XP.</span>
  {c.reasons.map((r,i)=><span key={i} className="rounded-full px-3 py-1 ring-1 ring-ln">{r}</span>)}</div><QuizRunner questions={c.questions} mode="practice" coffee/></div>}
