'use client';
import {useState} from 'react';import {db} from '@/lib/db';import {parseQs,pdfText} from '@/lib/parse';import type {NewQ} from '@/lib/types';import {CH} from '@/lib/data';
export default function Upload(){
 const [text,setText]=useState(''),[ch,setCh]=useState(1),[exam,setExam]=useState('A'),[qs,setQs]=useState<NewQ[]>([]),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const run=(t:string)=>{const r=parseQs(t,ch);setQs(r);setMsg(r.length?'':'No complete questions found. Each needs a question line, 2+ options (A) B) ...) and an "Answer: X" line.')};
 const file=async(f?:File)=>{if(!f)return;setBusy(true);setMsg('');try{const t=/\.pdf$/i.test(f.name)?await pdfText(f):await f.text();setText(t);run(t)}catch(e:any){setMsg('Could not read file: '+e.message)}setBusy(false)};
 const add=async()=>{setBusy(true);try{const n=await db.addQuestions(qs.map(q=>({...q,hint:q.hint,explanation:q.explanation})));setMsg(`Added ${n} question(s) from Exam ${exam}. They are available in Quiz and Mock exam now.`);setQs([]);setText('')}catch(e:any){setMsg(e.message)}setBusy(false)};
 const f="rounded-xl border border-ln bg-bg px-3 py-2";
 return <main className="rounded-3xl border border-ln bg-sf p-6 md:p-8"><h1 className="font-serif text-4xl">Question uploader</h1>
  <p className="mt-2 max-w-2xl text-mu">Upload a past paper (.pdf, .txt, .md or .json) or paste text. Format: <code>1. Question text</code>, options <code>A) …</code>, then <code>Answer: B</code>. Optional lines: <code>K: K2</code>, <code>CH: 4</code>, <code>HINT: …</code>, <code>WHY: …</code>.</p>
  <div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm text-mu">Exam set <select className={f} value={exam} onChange={e=>setExam(e.target.value)}>{'ABCD'.split('').map(x=><option key={x}>{x}</option>)}</select></label>
   <label className="text-sm text-mu">Default chapter <select className={f} value={ch} onChange={e=>setCh(+e.target.value)}>{CH.map((c,i)=><option key={c} value={i+1}>{i+1}. {c}</option>)}</select></label>
   <input type="file" aria-label="Upload exam file" accept=".pdf,.txt,.md,.json" onChange={e=>file(e.target.files?.[0])}/></div>
  <textarea aria-label="Paste questions" className="mt-4 min-h-48 w-full rounded-2xl border border-ln bg-bg p-4 font-mono text-sm" value={text} onChange={e=>setText(e.target.value)} placeholder={'1. Which review type is most formal?\nA) Walkthrough\nB) Inspection\nC) Informal review\nAnswer: B\nK: K1\nCH: 3'}/>
  <div className="mt-3 flex items-center gap-3"><button onClick={()=>run(text)} disabled={busy||!text.trim()} className="rounded-full px-5 py-2 ring-1 ring-ln hover:bg-bg disabled:opacity-50">Parse</button>
   {qs.length>0&&<button onClick={add} disabled={busy} className="rounded-full bg-ac px-5 py-2 text-bg">Add {qs.length} to question bank</button>}</div>
  {msg&&<p role="status" className="mt-3 text-sm text-mu">{msg}</p>}
  {qs.length>0&&<ul data-testid="preview" className="mt-4 space-y-2">{qs.slice(0,8).map((q,i)=><li key={i} className="rounded-2xl border border-ln bg-bg p-3 text-sm"><span className="mr-2 rounded bg-ac/15 px-1.5 text-xs font-semibold text-ac">{q.k} · Ch{q.ch}</span>{q.stem}<div className="text-mu">Answer {'ABCDEF'[q.correct]}: {q.options[q.correct]}</div></li>)}</ul>}</main>}
