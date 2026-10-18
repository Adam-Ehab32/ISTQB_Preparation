'use client';
import {useEffect} from 'react';import Link from 'next/link';import {usePathname,useRouter} from 'next/navigation';import {useTheme} from 'next-themes';import {motion} from 'framer-motion';
import {useAuth} from '@/lib/auth';import {useProfile} from '@/lib/profile';
const NAV=[['/','Today'],['/study','Study'],['/quiz','Quiz'],['/vault','Vault'],['/spot','Spot the bug'],['/mock','Mock exam'],['/maps','Mind-maps'],['/leaderboard','Leaderboard'],['/admin','Upload']];
const PUBLIC=['/login','/reset-password','/auth/callback'];
export default function Shell({children}:{children:React.ReactNode}){
 const p=usePathname(),router=useRouter(),{resolvedTheme,setTheme}=useTheme(),dark=resolvedTheme!=='light',{user,ready,signOut,isDemo}=useAuth(),{p:prof}=useProfile(),pub=PUBLIC.includes(p);
 useEffect(()=>{if(!ready)return;if(!user&&!pub)router.replace('/login');if(user&&p==='/login')router.replace('/')},[ready,user,p,pub,router]);
 const gated=!ready||(!user&&!pub);
 return <div className="mx-auto max-w-6xl px-5 pb-16">
  <header className="flex flex-wrap items-center justify-between gap-3 py-5">
   <Link prefetch={false} href="/" className="font-serif text-xl">ISTQB v4.0 Prep</Link>
   <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
    {user&&NAV.map(([h,l])=><Link key={h} href={h} prefetch={false} className="relative rounded-full px-3.5 py-1.5 text-sm text-mu hover:text-tx">
     {p===h&&<motion.span layoutId="nav" className="absolute inset-0 rounded-full bg-sf ring-1 ring-ln" transition={{type:'spring',bounce:.2,duration:.5}}/>}
     <span className={`relative ${p===h?'text-tx':''}`}>{l}</span></Link>)}
    {user&&prof&&<motion.span data-testid="xp-chip" key={prof.total_xp} initial={{scale:1.3}} animate={{scale:1}} className="ml-1 rounded-full bg-ac/15 px-3 py-1 text-sm font-semibold text-ac tabular-nums">{prof.total_xp} XP</motion.span>}
    <button aria-label="Switch between dark and light mode" onClick={()=>setTheme(dark?'light':'dark')} className="ml-1 grid h-9 w-9 place-items-center rounded-full ring-1 ring-ln hover:bg-sf">
     <motion.span key={String(dark)} initial={{rotate:-80,opacity:0}} animate={{rotate:0,opacity:1}} transition={{duration:.3}}><span className="hidden dark:inline">☾</span><span className="dark:hidden">☀</span></motion.span></button>
    {user&&<button onClick={()=>signOut()} className="ml-1 rounded-full px-3.5 py-1.5 text-sm ring-1 ring-ln hover:bg-sf">Sign out</button>}
   </nav></header>
  {user&&isDemo&&<p className="mb-4 rounded-2xl border border-ln bg-sf px-4 py-2 text-sm text-mu">Demo mode: data is stored in this browser only. Set the Supabase environment variables to use real accounts.</p>}
  {gated?<p className="py-24 text-center text-mu" role="status">Loading…</p>:children}</div>}
