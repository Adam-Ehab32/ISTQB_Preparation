'use client';
import {useEffect,useState} from 'react';import QuizRunner from '@/components/QuizRunner';import {db} from '@/lib/db';import {CH} from '@/lib/data';import {blueprint} from '@/lib/xp';import type {Q} from '@/lib/types';
const pick=(bank:Q[])=>Object.entries(blueprint).flatMap(([ch,n])=>[...bank.filter(q=>q.ch===+ch)].sort(()=>Math.random()-.5).slice(0,n));
export default function Mock(){
 const [bank,setBank]=useState<Q[]|null>(null),[exam,setExam]=useState<Q[]|null>(null);
 useEffect(()=>{db.content().then(c=>setBank(c.questions))},[]);
 if(!bank)return <p className="text-mu" role="status">Loading…</p>;
 if(exam)return <QuizRunner questions={exam} mode="mock" totalSec={Math.round(3600*exam.length/40)} onAgain={()=>setExam(null)}/>;
 const sel=pick(bank);
 return <main className="rounded-3xl border border-ln bg-sf p-8"><h1 className="font-serif text-4xl">Mock exam</h1>
  <p className="mt-2 max-w-xl text-mu">40 questions in 60 minutes, spread across chapters like the CTFL v4.0 exam (verify against the current ISTQB exam structure). Answers are not revealed until the end. Pass mark: 65%.</p>
  <div className="mt-5 grid max-w-xl grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">{CH.map((c,i)=><div key={c} className="flex justify-between border-b border-ln py-1"><span className="text-mu">Ch{i+1} {c}</span><span className="tabular-nums">{blueprint[i+1]}</span></div>)}</div>
  {sel.length<40&&<p className="mt-4 rounded-2xl border border-ln bg-bg p-3 text-sm" role="status">Your bank can fill {sel.length} of 40 slots, so this exam has {sel.length} questions and {Math.round(3600*sel.length/40/60)} minutes (same pace). Upload past papers to unlock the full exam.</p>}
  <button disabled={!sel.length} onClick={()=>setExam(sel)} className="mt-6 rounded-full bg-ac px-6 py-3 font-semibold text-bg disabled:opacity-50">Start mock exam</button></main>}
