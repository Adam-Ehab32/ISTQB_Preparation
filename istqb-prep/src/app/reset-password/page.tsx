'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';import {useAuth} from '@/lib/auth';
export default function ResetPassword(){
 const {setPassword}=useAuth(),router=useRouter(),[pw,setPw]=useState(''),[err,setErr]=useState('');
 return <main className="mx-auto max-w-md py-10"><h1 className="font-serif text-4xl">Choose a new password</h1>
  <form className="mt-6 space-y-3 rounded-3xl border border-ln bg-sf p-6" onSubmit={async e=>{e.preventDefault();const r=await setPassword(pw);if(r.err)setErr(r.err);else router.replace('/')}}>
   <label className="block text-sm text-mu">New password<input className="w-full rounded-xl border border-ln bg-bg px-4 py-3 outline-none focus:border-ac" type="password" minLength={6} required value={pw} onChange={e=>setPw(e.target.value)} autoComplete="new-password"/></label>
   {err&&<p role="alert" className="text-sm text-bad">{err}</p>}<button className="w-full rounded-full bg-ac px-5 py-3 font-semibold text-bg">Update password</button></form></main>}
