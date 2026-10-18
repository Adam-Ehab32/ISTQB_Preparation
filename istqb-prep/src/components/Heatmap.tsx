'use client';
import {motion} from 'framer-motion';
const key=(t:number)=>new Date(t-new Date(t).getTimezoneOffset()*6e4).toISOString().slice(0,10);
const lvl=(m:number)=>m<=0?0:m<5?1:m<10?2:m<15?3:4;
export default function Heatmap({data,weeks=20}:{data:Record<string,number>;weeks?:number}){
 const now=new Date(),end=Date.now()+(6-now.getDay())*864e5,days=Array.from({length:weeks*7},(_,i)=>end-(weeks*7-1-i)*864e5);
 return <div data-testid="heatmap" role="img" aria-label="Study activity over the last 20 weeks" className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
  {days.map((t,i)=>{const k=key(t),m=data[k]||0,l=lvl(m),fut=t>Date.now();
   return <motion.div key={k} data-level={fut?-1:l} title={`${k}: ${m} min`} initial={{opacity:0,scale:.6}} animate={{opacity:1,scale:1}} transition={{delay:Math.min(i*.002,.4)}}
    className="h-3 w-3 rounded-[3px]" style={{background:fut?'transparent':l===0?'rgb(var(--ln))':`color-mix(in srgb, rgb(var(--ac)) ${l*25}%, rgb(var(--ln)))`}}/>})}</div>}
