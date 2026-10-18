'use client';
import {AnimatePresence,motion} from 'framer-motion';import {useEffect} from 'react';
export default function Drawer({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[onClose]);
 return <AnimatePresence>
  {open&&<motion.div key="b" className="fixed inset-0 z-20 bg-black/50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>}
  {open&&<motion.aside key="p" role="dialog" aria-label={title} className="fixed right-0 top-0 z-30 h-full w-[min(26rem,100%)] overflow-auto border-l border-ln bg-sf p-6" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:32,stiffness:320}}>
   <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">{title}</h2><button onClick={onClose} className="rounded-full px-3 py-1 text-sm ring-1 ring-ln hover:bg-bg">Close</button></div>{children}</motion.aside>}
 </AnimatePresence>}
