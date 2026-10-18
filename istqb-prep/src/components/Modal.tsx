'use client';
import {AnimatePresence,motion} from 'framer-motion';import {useEffect} from 'react';
export default function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
 useEffect(()=>{if(!open)return;const f=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[open,onClose]);
 return <AnimatePresence>{open&&<motion.div key="m" className="fixed inset-0 z-40 grid place-items-center overflow-auto bg-black/60 p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
  <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={e=>e.stopPropagation()} initial={{opacity:0,y:20,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10}} transition={{type:'spring',damping:26,stiffness:320}} className="w-full max-w-xl rounded-3xl border border-ln bg-sf p-6 md:p-8">
   <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-3xl">{title}</h2><button onClick={onClose} className="rounded-full px-3 py-1 text-sm ring-1 ring-ln hover:bg-bg">Close</button></div>{children}</motion.div></motion.div>}</AnimatePresence>}
