'use client';
import {useEffect,useMemo,useState} from 'react';import Link from 'next/link';import {useTheme} from 'next-themes';import {AnimatePresence,motion} from 'framer-motion';
import {ReactFlow,Background,Controls,type Node,type Edge} from '@xyflow/react';import '@xyflow/react/dist/style.css';
import Drawer from '@/components/Drawer';import Analogy from '@/components/Analogy';import {CH} from '@/lib/data';import {db} from '@/lib/db';import type {Topic} from '@/lib/types';
const box={border:'1px solid rgb(var(--ln))',borderRadius:16,padding:'10px 14px',fontWeight:600,fontSize:14,background:'rgb(var(--bg))',color:'rgb(var(--tx))',width:'auto',maxWidth:170,textAlign:'center' as const};
export default function Maps(){
 const [c,setC]=useState(1),[s,setS]=useState<string|null>(null),[all,setAll]=useState<Topic[]>([]),[nq,setNq]=useState<Record<number,number>>({}),{resolvedTheme}=useTheme();
 useEffect(()=>{db.content().then(r=>{setAll(r.topics);const m:Record<number,number>={};r.questions.forEach(q=>m[q.ch]=(m[q.ch]||0)+1);setNq(m)})},[]);
 const ts=all.filter(t=>t.ch===c),sel=ts.find(t=>t.id===s)||null;
 const {nodes,edges}=useMemo(()=>{const n:Node[]=[{id:'root',position:{x:-60,y:-20},data:{label:CH[c-1]},draggable:false,style:{...box,background:'rgb(var(--tx))',color:'rgb(var(--bg))',fontFamily:'var(--f-serif)',fontSize:17}}];const e:Edge[]=[];
  ts.forEach((t,j)=>{const a=j/ts.length*2*Math.PI-Math.PI/2;n.push({id:t.id,position:{x:Math.cos(a)*260-40,y:Math.sin(a)*190},data:{label:t.title},style:{...box,borderColor:t.id===s?'rgb(var(--ac))':'rgb(var(--ln))',boxShadow:t.id===s?'0 0 0 2px rgb(var(--ac) / .4)':'none'}});e.push({id:'e'+t.id,source:'root',target:t.id,animated:t.id===s,style:{stroke:t.id===s?'rgb(var(--ac))':'rgb(var(--mu))'}})});return {nodes:n,edges:e}},[ts.map(t=>t.id).join(),s,c]); // eslint-disable-line
 return <main>
  <div className="mb-4 flex flex-wrap gap-2">{CH.map((n,j)=><button key={n} onClick={()=>{setC(j+1);setS(null)}} aria-pressed={c===j+1} className={`rounded-full px-4 py-1.5 text-sm ring-1 ${c===j+1?'bg-ac text-bg ring-ac':'ring-ln hover:bg-sf'}`}>{j+1}. {n}</button>)}</div>
  <div data-testid="flow" className="h-[520px] overflow-hidden rounded-3xl border border-ln bg-sf">
   <ReactFlow key={c+':'+ts.length} nodes={nodes} edges={edges} fitView fitViewOptions={{padding:.25}} colorMode={resolvedTheme==='light'?'light':'dark'} nodesConnectable={false} onNodeClick={(_,n)=>n.id!=='root'&&setS(n.id)} minZoom={.4}>
    <Background gap={22}/><Controls showInteractive={false}/></ReactFlow></div>
  <div className="mt-4 grid gap-3 sm:grid-cols-3">{ts.map(t=><motion.article layout key={t.id} onClick={()=>setS(t.id)} className={`cursor-pointer rounded-2xl border p-5 ${s===t.id?'border-ac bg-sf':'border-ln bg-sf/60'}`}>
   <h3 className="font-serif text-xl">{t.title}</h3><p className="mt-2 line-clamp-2 text-sm text-mu">{t.summary}</p></motion.article>)}</div>
  <Drawer open={!!sel} onClose={()=>setS(null)} title={sel?.title||''}>{sel&&<><span className="rounded-md bg-ac/15 px-2 py-1 text-xs font-semibold text-ac">Chapter {sel.ch}: {CH[sel.ch-1]}</span>
   <p className="mt-4 text-lg leading-relaxed">{sel.summary}</p><p className="mt-4 text-sm text-mu">{nq[sel.ch]||0} question(s) in the bank for this chapter.</p>{sel.analogy&&<Analogy text={sel.analogy}/>}<Link prefetch={false} href="/quiz" className="mt-4 inline-block rounded-full bg-ac px-5 py-2 text-sm text-bg">Practice questions</Link></>}</Drawer></main>}
