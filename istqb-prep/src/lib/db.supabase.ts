import {sb} from './supabase';import {KL} from './data';
import type {DB,Profile,Q,LB,NewQ,Bug,Coffee,Vault,ChReady,Exposure,GenQ} from './types';
const c=()=>sb!;
const QSEL='id,k_level,stem,options,correct_index,hint,explanation,analogy,difficulty,exam_set,topics(chapter_id)';
const toQ=(x:any):Q=>({id:x.id,k:x.k_level,ch:(Array.isArray(x.topics)?x.topics[0]:x.topics)?.chapter_id??1,stem:x.stem,options:x.options,correct:x.correct_index,hint:x.hint,explanation:x.explanation,analogy:x.analogy??undefined,d:x.difficulty,set:x.exam_set??undefined});
const me=async()=>{const {data}=await c().auth.getUser();if(!data.user)throw new Error('Not signed in');return data.user};
const pf=(r:any,email:string):Profile=>({id:r.id,email:r.email??email,display_name:r.display_name,avatar_url:r.avatar_url,istqb_readiness_score:r.istqb_readiness_score,total_xp:r.total_xp,streak_days:r.streak_days});
const byIds=async(ids:string[])=>ids.length?ck<any[]>(await c().from('questions').select(QSEL).in('id',ids)).map(toQ):[];
const ck=<T,>(r:{data:T|null;error:any}):T=>{if(r.error)throw new Error(r.error.message);return r.data as T};
const profile=async()=>{const u=await me();return pf(ck(await c().from('users').select('*').eq('id',u.id).single()),u.email??'')};
export const sbDb:DB={
 profile,
 async updateProfile(p){const u=await me();ck(await c().from('users').update(p).eq('id',u.id));return profile()},
 async content(){
  const t=ck<any[]>(await c().from('topics').select('id,title,summary,analogy,chapter_id,position').order('chapter_id').order('position'));
  const q=ck<any[]>(await c().from('questions').select(QSEL).eq('status','published').is('gen_key',null));
  return {topics:t.map(x=>({id:x.id,ch:x.chapter_id,title:x.title,summary:x.summary,analogy:x.analogy??undefined})),questions:q.map(toQ)}},
 async submit(q,sel,ms,hint,session){
  const r=ck<any[]>(await c().rpc('submit_attempt',{p_question:q.id,p_session:session,p_selected:sel,p_ms:Math.round(ms),p_hint:hint}))[0];
  return {ok:r.is_correct,correct:r.correct_index,xp:{base:r.xp_base,speed:r.xp_speed,streak:r.xp_streak,daily:r.xp_daily,total:r.xp_base+r.xp_speed+r.xp_streak+r.xp_daily},profile:await profile(),vault:r.in_vault||r.vault_cleared?{in:r.in_vault,streak:r.vault_streak,cleared:r.vault_cleared}:undefined}},
 async activity(){const r=ck<any[]>(await c().from('daily_activity').select('day,ms'));return Object.fromEntries(r.map(x=>[x.day,Math.round(x.ms/6e3)/10]))},
 async coverage(){
  const a=ck<any[]>(await c().from('quiz_attempts').select('question_id').eq('is_correct',true));
  const n=(await c().from('questions').select('id',{count:'exact',head:true}).eq('status','published')).count||0;
  return n?Math.round(new Set(a.map(x=>x.question_id)).size/n*100):0},
 async mocks(){return ck<any[]>(await c().from('mock_exams').select('correct,total,created_at').order('created_at',{ascending:false})).map(x=>({correct:x.correct,total:x.total,ts:x.created_at}))},
 async saveMock(correct,total){ck(await c().from('mock_exams').insert({correct,total}))},
 async leaderboard(kind){const u=await me(),v={overall:'lb_overall',weekly:'lb_weekly',champions:'lb_champions'}[kind];
  const r=ck<any[]>(await c().from(v).select('*').limit(200));
  const rows:LB[]=r.map(x=>({id:x.id,name:x.display_name,avatar:x.avatar_url,xp:x.xp??0,acc:x.acc??0,fast:x.fast??0,me:x.id===u.id}));
  return rows.sort((a,b)=>kind==='champions'?(b.acc*.6+b.fast*.4)-(a.acc*.6+a.fast*.4):b.xp-a.xp).slice(0,50)},
 async addQuestions(qs:NewQ[]){const u=await me();
  const t=ck<any[]>(await c().from('topics').select('id,chapter_id,position').order('position')),first=(ch:number)=>t.find(x=>x.chapter_id===ch)?.id;
  const rows=qs.filter(q=>first(q.ch)).map(q=>({topic_id:first(q.ch),owner_id:u.id,k_level:q.k,stem:q.stem,options:q.options,correct_index:q.correct,hint:q.hint,explanation:q.explanation,expected_time_sec:KL[q.k].sec}));
  if(rows.length)ck(await c().from('questions').insert(rows));return rows.length},
 async coffee(){
  const r=ck<any[]>(await c().rpc('get_coffee')),qs=await byIds(r.map(x=>x.question_id));
  return {questions:r.map(x=>qs.find(q=>q.id===x.question_id)).filter(Boolean) as Q[],reasons:r.map(x=>x.reason),done:!!r[0]?.done} as Coffee},
 async completeCoffee(){return ck<number>(await c().rpc('complete_coffee'))||0},
 async vault(){
  const v=ck<any[]>(await c().from('mistake_vault').select('question_id,streak_correct,cleared_at')),act=v.filter(x=>!x.cleared_at),qs=await byIds(act.map(x=>x.question_id));
  return {questions:act.map(x=>qs.find(q=>q.id===x.question_id)).filter(Boolean) as Q[],streaks:Object.fromEntries(act.map(x=>[x.question_id,x.streak_correct])),cleared:v.length-act.length} as Vault},
 async bugs(){return ck<any[]>(await c().from('reasoning_cards').select('*').order('id')).map(x=>({id:x.id,ch:x.chapter_id,k:x.k_level,claim:x.claim,options:x.flaw_options,flaw:x.flaw_index,trap:x.trap,correction:x.correction}) as Bug)},
 async logBug(id,sel){ck(await c().rpc('submit_reasoning',{p_card:id,p_selected:sel}))},
 async chapters(){return ck<any[]>(await c().from('chapter_readiness').select('*').order('chapter_id')).map(x=>({ch:x.chapter_id,readiness:x.readiness,coverage:x.coverage,attempts:x.attempts,acc:{K1:x.acc_k1,K2:x.acc_k2,K3:x.acc_k3}}) as ChReady)},
 async summaries(){
  const s=ck<any[]>(await c().from('summary_sections').select('id,chapter_id,position,title,points,memo').order('chapter_id').order('position'));
  const t=ck<any[]>(await c().from('summary_terms').select('section_id,term,definition,position').order('position'));
  return s.map(x=>({id:x.id,ch:x.chapter_id,title:x.title,points:x.points,memo:x.memo,terms:t.filter(y=>y.section_id===x.id).map(y=>({t:y.term,d:y.definition}))}))},
 async exposure(){const r=ck<any[]>(await c().from('question_exposure').select('question_id,times,last_seen'));
  return Object.fromEntries(r.map(x=>[x.question_id,{n:x.times,last:Date.parse(x.last_seen)||0}])) as Exposure},
 async materialize(qs:GenQ[]){const u=await me();
  const t=ck<any[]>(await c().from('topics').select('id,chapter_id,position').order('position')),first=(ch:number)=>t.find(x=>x.chapter_id===ch)?.id;
  const rows=qs.filter(q=>first(q.ch)).map(q=>({topic_id:first(q.ch),owner_id:u.id,k_level:q.k,stem:q.stem,options:q.options,correct_index:q.correct,hint:q.hint,explanation:q.explanation,analogy:q.analogy??null,difficulty:q.d??3,expected_time_sec:KL[q.k].sec,gen_key:q.key}));
  if(rows.length)ck(await c().from('questions').upsert(rows,{onConflict:'owner_id,gen_key',ignoreDuplicates:true}));
  return ck<any[]>(await c().from('questions').select(QSEL).eq('owner_id',u.id).in('gen_key',qs.map(q=>q.key))).map(toQ)}};
