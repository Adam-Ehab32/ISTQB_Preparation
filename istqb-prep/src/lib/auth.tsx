'use client';
import {createContext,useContext,useEffect,useState} from 'react';import {sb,hasSb} from './supabase';import {demo} from './demo';
export type User={id:string;email:string};
type R=Promise<{err?:string;info?:string}>;
type A={user:User|null;ready:boolean;isDemo:boolean;signIn(e:string,p:string):R;signUp(e:string,p:string,n:string):R;reset(e:string):R;setPassword(p:string):R;google():R;signOut():Promise<void>};
const Ctx=createContext<A>(null!);export const useAuth=()=>useContext(Ctx);
const o=()=>location.origin;
export function AuthProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false);
 const syncDemo=()=>setUser(demo.current());
 useEffect(()=>{
  if(!hasSb){syncDemo();setReady(true);return}
  sb!.auth.getSession().then(({data})=>{setUser(data.session?{id:data.session.user.id,email:data.session.user.email??''}:null);setReady(true)});
  const {data}=sb!.auth.onAuthStateChange((_e,s)=>setUser(s?{id:s.user.id,email:s.user.email??''}:null));
  return()=>data.subscription.unsubscribe()},[]);
 const d=(r:{err?:string;info?:string})=>{syncDemo();return r};
 const v:A=hasSb?{user,ready,isDemo:false,
  async signIn(email,password){const {error}=await sb!.auth.signInWithPassword({email,password});return error?{err:error.message}:{}},
  async signUp(email,password,name){const {data,error}=await sb!.auth.signUp({email,password,options:{data:{name},emailRedirectTo:o()+'/auth/callback'}});return error?{err:error.message}:data.session?{}:{info:'Check your inbox to confirm your email, then sign in.'}},
  async reset(email){const {error}=await sb!.auth.resetPasswordForEmail(email,{redirectTo:o()+'/reset-password'});return error?{err:error.message}:{info:'If that email exists, a reset link is on its way.'}},
  async setPassword(password){const {error}=await sb!.auth.updateUser({password});return error?{err:error.message}:{}},
  async google(){const {error}=await sb!.auth.signInWithOAuth({provider:'google',options:{redirectTo:o()+'/auth/callback'}});return error?{err:error.message}:{}},
  async signOut(){await sb!.auth.signOut()}}
 :{user,ready,isDemo:true,
  async signIn(e,p){return d(demo.signIn(e,p))},async signUp(e,p,n){return d(demo.signUp(e,p,n))},async reset(e){return d(demo.reset(e))},
  async setPassword(p){return d(demo.setPassword(p))},async google(){return d(demo.google())},async signOut(){demo.signOut();syncDemo()}};
 return <Ctx.Provider value={v}>{children}</Ctx.Provider>}
