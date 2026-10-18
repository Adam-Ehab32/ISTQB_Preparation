'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';import {useAuth} from './auth';import {db} from './db';import type {Profile} from './types';
const C=createContext<{p:Profile|null;setP:(p:Profile)=>void;refresh:()=>Promise<void>}>(null!);export const useProfile=()=>useContext(C);
export function ProfileProvider({children}:{children:React.ReactNode}){
 const {user}=useAuth(),[p,setP]=useState<Profile|null>(null);
 const refresh=useCallback(async()=>{if(!user){setP(null);return}try{setP(await db.profile())}catch{setP(null)}},[user?.id]); // eslint-disable-line
 useEffect(()=>{refresh()},[refresh]);
 return <C.Provider value={{p,setP,refresh}}>{children}</C.Provider>}
