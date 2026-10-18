'use client';
import {useEffect,useState} from 'react';import {motion} from 'framer-motion';import {db} from '@/lib/db';import {useAuth} from '@/lib/auth';import {useProfile} from '@/lib/profile';import type {LB,LBKind} from '@/lib/types';
const TABS:[LBKind,string,string][]=[['overall','Top overall','Total XP'],['champions','Speed & accuracy','Accuracy 60% + speed 40%, min. 5 answers'],['weekly','Weekly top','XP earned in the last 7 days']];
export default function Leaderboard(){
 const [k,setK]=useState<LBKind>('overall'),[rows,setRows]=useState<LB[]|null>(null),{isDemo}=useAuth(),{p}=useProfile();
 useEffect(()=>{setRows(null);db.leaderboard(k).then(setRows).catch(()=>setRows([]))},[k,p?.total_xp]);
 return <main><h1 className="font-serif text-4xl">Leaderboard</h1>
  <div className="my-4 flex flex-wrap gap-2" role="tablist">{TABS.map(([id,l])=><button key={id} role="tab" aria-selected={k===id} onClick={()=>setK(id)} className={`rounded-full px-4 py-1.5 text-sm ring-1 ${k===id?'bg-tx text-bg ring-tx':'ring-ln hover:bg-sf'}`}>{l}</button>)}</div>
  <p className="mb-3 text-sm text-mu">{TABS.find(t=>t[0]===k)![2]}.{isDemo&&' Demo mode: the other players are sample data.'}</p>
  <ol className="space-y-2" data-testid="lb-list">{!rows?<li className="text-mu" role="status">Loading…</li>:!rows.length?<li className="text-mu">Nobody here yet. Answer a quiz to get on the board.</li>:rows.map((r,i)=>
   <motion.li layout key={r.id} data-me={r.me?'1':'0'} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.03}} className={`flex items-center gap-4 rounded-2xl border p-4 ${r.me?'border-ac bg-ac/10':'border-ln bg-sf'}`}>
    <span className="w-8 font-serif text-2xl tabular-nums text-mu">{i+1}</span>
    <span className="grid h-9 w-9 place-items-center rounded-full bg-ln text-sm font-semibold">{r.avatar?<img src={r.avatar} alt="" className="h-9 w-9 rounded-full"/>:r.name.slice(0,1).toUpperCase()}</span>
    <span className="min-w-0 flex-1 truncate">{r.name}{r.me&&<span className="ml-2 text-sm text-ac">you</span>}</span>
    <span className="text-right tabular-nums">{k==='champions'?<>{r.acc}% acc · {r.fast}% fast</>:<>{r.xp} XP</>}</span></motion.li>)}</ol></main>}
