'use client';
import {useEffect} from 'react';import {useRouter} from 'next/navigation';import {useAuth} from '@/lib/auth';
export default function Callback(){
 const {user,ready}=useAuth(),router=useRouter();
 useEffect(()=>{if(!ready)return;const t=setTimeout(()=>router.replace(user?'/':'/login'),user?0:2500);return()=>clearTimeout(t)},[ready,user,router]);
 return <p className="py-24 text-center text-mu" role="status">Signing you in…</p>}
