'use client';
import {useEffect,useMemo,useState} from 'react';import QuizRunner from '@/components/QuizRunner';import Modal from '@/components/Modal';import QuizConfig from '@/components/QuizConfig';
import {db} from '@/lib/db';import {useAuth} from '@/lib/auth';import {generate} from '@/lib/gen';import {defaultCfg,filterPool,pickQuiz,mergeExposure,markServed,type Cfg} from '@/lib/pool';
import type {Q,Exposure,GenQ} from '@/lib/types';
export default function Quiz(){
 const {user}=useAuth(),[bank,setBank]=useState<Q[]|null>(null),[srv,setSrv]=useState<Exposure>({}),[cfg,setCfg]=useState<Cfg>(defaultCfg),[open,setOpen]=useState(true),[run,setRun]=useState<{qs:Q[];n:number}|null>(null),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 const sample=useMemo(()=>generate(12).map(g=>({...g,id:'g:'+g.key}) as Q),[]);
 useEffect(()=>{Promise.all([db.content(),db.exposure()]).then(([c,e])=>{setBank(c.questions);setSrv(e)}).catch(e=>setErr(e.message));const ch=+(new URLSearchParams(location.search).get('ch')||0);if(ch>=1&&ch<=6)setCfg(c=>({...c,ch}))},[]);
 const info=useMemo(()=>{if(!bank||!user)return {matches:0,unseen:0,gen:false,total:0};const {ex}=mergeExposure(srv,user.id),m=filterPool(bank,cfg),gen=filterPool(sample,cfg).length>0;
  return {matches:m.length,unseen:m.filter(q=>!ex[q.id]).length,gen,total:Math.min(cfg.count,m.length+(gen?6:0))}},[bank,srv,cfg,user,sample]);
 const start=async()=>{if(!user||!bank)return;setBusy(true);setErr('');
  try{const server=await db.exposure(),{ex,last}=mergeExposure(server,user.id),gp=filterPool(generate(10).map(g=>({...g,id:'g:'+g.key}) as Q),cfg).slice(0,Math.min(6,Math.ceil(cfg.count/2)));
   const picked=pickQuiz([...bank,...gp],ex,cfg,last).questions,gs=picked.filter(q=>q.id.startsWith('g:'));
   const mat=gs.length?await db.materialize(gs.map(q=>({...q,key:q.id.slice(2)}) as GenQ)):[];
   const qs=picked.map(q=>q.id.startsWith('g:')?mat.find(m=>m.stem===q.stem)||q:q);
   if(!qs.length){setErr('No questions match these settings.');return}
   markServed(user.id,qs.map(q=>q.id));setSrv(server);setRun(r=>({qs,n:(r?.n||0)+1}));setOpen(false)}
  catch(e:any){setErr(e.message)}finally{setBusy(false)}};
 if(!bank&&!err)return <p className="text-mu" role="status">Loading questions…</p>;
 return <div>
  <div className="mb-3 flex items-center gap-3"><button onClick={()=>setOpen(true)} className="rounded-full px-4 py-2 text-sm ring-1 ring-ln hover:bg-sf">Quiz settings</button>{run&&<span className="text-sm text-mu">{cfg.count} requested · {cfg.levels.join('/')} · {cfg.diff==='auto'?'auto-mixed':cfg.diff}{cfg.ch?` · Chapter ${cfg.ch}`:''}</span>}</div>
  {err&&<p role="alert" className="mb-3 text-bad">{err}</p>}
  {run?<QuizRunner key={run.n} questions={run.qs} mode="practice" onAgain={start}/>:<main className="rounded-3xl border border-ln bg-sf p-8"><h1 className="font-serif text-4xl">Build your quiz</h1><p className="mt-2 text-mu">Choose how many questions, which K-levels and what difficulty. Unseen questions are picked first, so repeats only appear once you have worked through the pool.</p><button onClick={()=>setOpen(true)} className="mt-5 rounded-full bg-ac px-5 py-2 text-bg">Customize quiz</button></main>}
  <Modal open={open} onClose={()=>setOpen(false)} title="Customize your quiz"><QuizConfig cfg={cfg} set={setCfg} info={info} busy={busy} onStart={start}/></Modal></div>}
