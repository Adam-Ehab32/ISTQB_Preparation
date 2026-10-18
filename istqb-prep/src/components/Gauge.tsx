'use client';
import {motion} from 'framer-motion';
const pt=(f:number,r:number)=>[100+r*Math.cos(Math.PI-f*Math.PI),100-r*Math.sin(Math.PI-f*Math.PI)];
export default function Gauge({score}:{score:number}){
 const [x1,y1]=pt(.65,78),[x2,y2]=pt(.65,102),d="M10 100 A90 90 0 0 1 190 100";
 return <div className="relative"><svg viewBox="0 0 200 112" className="w-full" role="img" aria-label={`Readiness ${score} percent, pass mark 65 percent`}>
  <path d={d} fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-ln"/>
  <motion.path d={d} fill="none" strokeWidth="14" strokeLinecap="round" className={score>=65?'stroke-ok':'stroke-ac'} initial={{pathLength:0}} animate={{pathLength:Math.max(score,1)/100}} transition={{duration:1,ease:'easeOut'}}/>
  <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.5" className="stroke-tx"/></svg>
  <div className="absolute inset-x-0 bottom-0 text-center"><div className="font-serif text-4xl leading-none" data-testid="readiness">{score}%</div></div></div>}
