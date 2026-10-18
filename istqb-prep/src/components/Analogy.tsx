'use client';
import {useState} from 'react';import {AnimatePresence,motion} from 'framer-motion';
export default function Analogy({text}:{text:string}){
 const [o,setO]=useState(false);
 return <div className="mt-3 rounded-xl border border-ln bg-bg">
  <button type="button" aria-expanded={o} onClick={()=>setO(!o)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"><span>Real-World Analogy</span><motion.span animate={{rotate:o?180:0}} aria-hidden>▾</motion.span></button>
  <AnimatePresence initial={false}>{o&&<motion.div role="region" aria-label="Real-World Analogy" data-testid="analogy-text" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><p className="px-3 pb-3 text-sm text-mu">{text}</p></motion.div>}</AnimatePresence></div>}
