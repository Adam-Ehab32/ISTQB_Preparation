// Local demo backend (no Supabase env vars). NOT secure: plain localStorage, for trying the app and E2E tests only.
import type {Mock,Q} from './types';import type {K} from './data';
export type UD={xp:number;streak:number;last:string;run:number;act:Record<string,number>;paid:Record<string,boolean>;ev:{ts:number;xp:number}[];att:{ts:number;ok:boolean;fast:boolean;q:string;ch:number;k:K}[];vault:Record<string,{wrong:number;streak:number;cleared:boolean}>;sr:Record<number,{due:number;ivl:number;rep:number}>;coffee:{day:string;ids:string[];reasons:string[];done:boolean}|null;bugs:Record<string,boolean>;gen:Record<string,Q>;mocks:Mock[];custom:Q[];solved:string[];score:number};
type U={id:string;pw:string;name:string;avatar:string|null};
type S={users:Record<string,U>;session:string|null;recovery:string|null;data:Record<string,UD>};
const KEY='iq.demo.v1';
export const load=():S=>{try{return {users:{},session:null,recovery:null,data:{},...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {users:{},session:null,recovery:null,data:{}}}};
export const save=(s:S)=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}};
export const blank=():UD=>({xp:0,streak:0,last:'',run:0,act:{},paid:{},ev:[],att:[],vault:{},sr:{},coffee:null,bugs:{},gen:{},mocks:[],custom:[],solved:[],score:0});
const ok=(s:S,e:string)=>{s.session=e;save(s)};
export const demo={
 current(){const s=load(),u=s.session&&s.users[s.session];return u?{id:u.id,email:s.session!}:null},
 cur(){const s=load(),e=s.session,u=e&&s.users[e];if(!e||!u)throw new Error('Not signed in');const d=s.data[u.id]??(s.data[u.id]=blank());return {s,e,u,d}},
 signUp(e:string,p:string,name:string){e=e.trim().toLowerCase();const s=load();
  if(!/^\S+@\S+\.\S+$/.test(e))return {err:'Enter a valid email address.'};if(p.length<6)return {err:'Password must be at least 6 characters.'};
  if(s.users[e])return {err:'An account with this email already exists.'};
  s.users[e]={id:'u_'+Math.random().toString(36).slice(2,10),pw:p,name:name.trim()||e.split('@')[0],avatar:null};ok(s,e);return {}},
 signIn(e:string,p:string){e=e.trim().toLowerCase();const s=load(),u=s.users[e];if(!u||u.pw!==p)return {err:'Invalid email or password.'};ok(s,e);return {}},
 google(){const s=load(),e='demo.google@example.com';s.users[e]??={id:'u_google_demo',pw:'',name:'Google Demo User',avatar:null};ok(s,e);return {}},
 reset(e:string){e=e.trim().toLowerCase();const s=load();if(s.users[e]){s.recovery=e;save(s)}return {info:'If that email exists, a reset link has been sent. (Demo mode: open the reset page to continue.)'}},
 setPassword(p:string){const s=load(),e=s.recovery||s.session;if(!e||!s.users[e])return {err:'Request a reset first.'};if(p.length<6)return {err:'Password must be at least 6 characters.'};s.users[e].pw=p;s.recovery=null;ok(s,e);return {}},
 signOut(){const s=load();s.session=null;save(s)}};
