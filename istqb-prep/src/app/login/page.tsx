'use client';
import {useState} from 'react';import {motion} from 'framer-motion';import {useAuth} from '@/lib/auth';
type M='in'|'up'|'forgot';
const T:Record<M,[string,string]>={in:['Welcome back.','Pick up where your last quiz ended.'],up:['Start your CTFL v4.0 run.','Create an account to keep XP, streaks and mock scores.'],forgot:['Reset your password.','We will email you a link.']};
export default function Login(){
 const {signIn,signUp,reset,google}=useAuth(),[m,setM]=useState<M>('in'),[email,setE]=useState(''),[pw,setPw]=useState(''),[name,setN]=useState(''),[err,setErr]=useState(''),[info,setInfo]=useState(''),[busy,setB]=useState(false);
 const go=async(e:React.FormEvent)=>{e.preventDefault();setErr('');setInfo('');setB(true);
  const r=m==='in'?await signIn(email,pw):m==='up'?await signUp(email,pw,name):await reset(email);
  setB(false);if(r.err)setErr(r.err);if(r.info)setInfo(r.info)};
 const f="w-full rounded-xl border border-ln bg-bg px-4 py-3 outline-none focus:border-ac";
 return <main className="grid items-center gap-10 py-8 md:grid-cols-2">
  <div><h1 className="font-serif text-5xl leading-[1.05] md:text-6xl">{T[m][0]}</h1><p className="mt-4 max-w-md text-lg text-mu">{T[m][1]}</p></div>
  <motion.form key={m} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} onSubmit={go} className="space-y-3 rounded-3xl border border-ln bg-sf p-6" aria-label={m==='in'?'Sign in':m==='up'?'Sign up':'Forgot password'}>
   <div className="mb-2 flex gap-1" role="tablist">{([['in','Sign in'],['up','Sign up']] as [M,string][]).map(([k,l])=><button type="button" role="tab" aria-selected={m===k} key={k} onClick={()=>{setM(k);setErr('');setInfo('')}} className={`rounded-full px-4 py-1.5 text-sm ring-1 ${m===k?'bg-tx text-bg ring-tx':'ring-ln'}`}>{l}</button>)}</div>
   {m==='up'&&<label className="block text-sm text-mu">Display name<input className={f} value={name} onChange={e=>setN(e.target.value)} autoComplete="nickname"/></label>}
   <label className="block text-sm text-mu">Email<input className={f} type="email" required value={email} onChange={e=>setE(e.target.value)} autoComplete="email"/></label>
   {m!=='forgot'&&<label className="block text-sm text-mu">Password<input className={f} type="password" required minLength={6} value={pw} onChange={e=>setPw(e.target.value)} autoComplete={m==='in'?'current-password':'new-password'}/></label>}
   {err&&<p role="alert" className="text-sm text-bad">{err}</p>}{info&&<p role="status" className="text-sm text-ok">{info}</p>}
   <button disabled={busy} className="w-full rounded-full bg-ac px-5 py-3 font-semibold text-bg disabled:opacity-60">{m==='in'?'Sign in':m==='up'?'Create account':'Send reset link'}</button>
   {m!=='forgot'&&<button type="button" onClick={async()=>{const r=await google();if(r.err)setErr(r.err)}} className="w-full rounded-full px-5 py-3 ring-1 ring-ln hover:bg-bg">Continue with Google</button>}
   <button type="button" onClick={()=>{setM(m==='forgot'?'in':'forgot');setErr('');setInfo('')}} className="text-sm text-mu underline underline-offset-4">{m==='forgot'?'Back to sign in':'Forgot password?'}</button>
  </motion.form></main>}
