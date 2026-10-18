import {QS,TOPICS,KL,BUGS} from './data';import {SUMMARIES} from './summaries';import {demo,save} from './demo';import {calcXp,COFFEE_BONUS} from './xp';import {chapterReadiness} from './readiness';
import type {DB,Profile,Q,LB} from './types';
const tz=()=>new Date().getTimezoneOffset()*6e4;
const day=(t=Date.now())=>new Date(t-tz()).toISOString().slice(0,10);
const dnum=()=>Math.floor((Date.now()-tz())/864e5);
const BOTS:[string,number,number,number,number][]=[['Priya N.',1840,92,81,420],['Marco T.',1520,88,74,360],['Lena K.',1310,95,66,510],['Tomasz W.',980,81,59,150],['Aisha R.',760,90,88,290],['Diego S.',540,77,52,120],['Hannah B.',410,84,70,200]];
const prof=():Profile=>{const {u,e,d}=demo.cur();return {id:u.id,email:e,display_name:u.name,avatar_url:u.avatar,istqb_readiness_score:d.score,total_xp:d.xp,streak_days:d.streak}};
const bank=():Q[]=>[...QS,...demo.cur().d.custom];
const all=():Q[]=>[...bank(),...Object.values(demo.cur().d.gen)];
const pct=(a:number,b:number)=>b?Math.round(a/b*100):0;
const nq=()=>{const m:Record<number,number>={};bank().forEach(q=>m[q.ch]=(m[q.ch]||0)+1);return m};
export const demoDb:DB={
 async profile(){return prof()},
 async updateProfile(p){const {s,u,d}=demo.cur();if(p.display_name!==undefined)u.name=p.display_name;if(p.avatar_url!==undefined)u.avatar=p.avatar_url;if(p.istqb_readiness_score!==undefined)d.score=p.istqb_readiness_score;save(s);return prof()},
 async content(){return {topics:TOPICS,questions:bank()}},
 async submit(q,sel,ms){const {s,d}=demo.cur(),ok=sel===q.correct,t=day();
  d.run=ok?d.run+1:0;d.act[t]=(d.act[t]||0)+ms;
  const xp=calcXp({k:q.k,ok,ms,run:d.run,dayMs:d.act[t],goalPaid:!!d.paid[t]});
  if(xp.daily){d.paid[t]=true;d.streak=d.last===day(Date.now()-864e5)?d.streak+1:1;d.last=t}
  d.xp+=xp.total;if(xp.total)d.ev.push({ts:Date.now(),xp:xp.total});
  d.att.push({ts:Date.now(),ok,fast:ok&&ms<KL[q.k].sec*500,q:q.id,ch:q.ch,k:q.k});if(ok&&!d.solved.includes(q.id))d.solved.push(q.id);
  const sr=d.sr[q.ch]??={due:0,ivl:0,rep:0};if(ok){sr.rep++;sr.ivl=sr.rep===1?1:sr.rep===2?3:Math.round(sr.ivl*2.5)}else{sr.rep=0;sr.ivl=0}sr.due=dnum()+sr.ivl;
  // Mistake Vault: every wrong answer enters; two consecutive correct answers leave.
  let v=d.vault[q.id];const was=!!v&&!v.cleared;
  if(!ok)v=d.vault[q.id]={wrong:(v?.wrong||0)+1,streak:0,cleared:false};else if(v&&!v.cleared){v.streak++;if(v.streak>=2)v.cleared=true}
  save(s);return {ok,correct:q.correct,xp,profile:prof(),vault:v?{in:!v.cleared,streak:v.streak,cleared:was&&v.cleared}:undefined}},
 async activity(){const {d}=demo.cur();return Object.fromEntries(Object.entries(d.act).map(([k,v])=>[k,Math.round(v/6e3)/10]))},
 async coverage(){const {d}=demo.cur();return pct(d.solved.filter(i=>!i.startsWith('g:')).length,bank().length)},
 async mocks(){return demo.cur().d.mocks},
 async saveMock(correct,total){const {s,d}=demo.cur();d.mocks.push({correct,total,ts:new Date().toISOString()});save(s)},
 async leaderboard(kind){const {u,d}=demo.cur(),wk=d.ev.filter(e=>e.ts>Date.now()-6048e5).reduce((a,e)=>a+e.xp,0),n=d.att.length;
  const rows:LB[]=BOTS.map(([name,xp,acc,fast,w],i)=>({id:'bot'+i,name,avatar:null,xp:kind==='weekly'?w:xp,acc,fast}));
  if(kind==='champions'?n>=5:(kind==='weekly'?wk:d.xp)>0)rows.push({id:u.id,name:u.name,avatar:u.avatar,xp:kind==='weekly'?wk:d.xp,acc:pct(d.att.filter(a=>a.ok).length,n),fast:pct(d.att.filter(a=>a.fast).length,n),me:true});
  return rows.sort((a,b)=>kind==='champions'?(b.acc*.6+b.fast*.4)-(a.acc*.6+a.fast*.4):b.xp-a.xp)},
 async addQuestions(qs){const {s,d}=demo.cur();qs.forEach(q=>d.custom.push({...q,id:'u_'+Math.random().toString(36).slice(2,9)}));save(s);return qs.length},
 /** Smart Coffee: 3 questions a day, scored by vault (+50), chapter due for review (+30), weakness (0-20), never seen (+10). Stable for the day. */
 async coffee(){const {s,d}=demo.cur(),qs=bank(),t=day();
  if(!d.coffee||d.coffee.day!==t){
   const sc=qs.map((q,i)=>{const ca=d.att.filter(a=>a.ch===q.ch),seen=ca.length>0,acc=seen?ca.filter(a=>a.ok).length/ca.length:.5,sr=d.sr[q.ch],due=!sr||sr.due<=dnum(),inV=!!d.vault[q.id]&&!d.vault[q.id].cleared;
    return {q,i,score:(inV?50:0)+(due?30:0)+Math.round((1-acc)*20)+(d.att.some(a=>a.q===q.id)?0:10),reason:inV?'Mistake Vault':seen&&due?'Due for review':seen&&acc<.6?'Weak topic':'New material'}})
    .sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3);
   d.coffee={day:t,ids:sc.map(x=>x.q.id),reasons:sc.map(x=>x.reason),done:false};save(s)}
  const c=d.coffee!;return {questions:c.ids.map(id=>all().find(q=>q.id===id)!).filter(Boolean),reasons:c.reasons,done:c.done}},
 async completeCoffee(){const {s,d}=demo.cur(),c=d.coffee,t=day();
  if(!c||c.done||!c.ids.every(id=>d.att.some(a=>a.q===id&&day(a.ts)===t)))return 0;
  c.done=true;d.xp+=COFFEE_BONUS;d.ev.push({ts:Date.now(),xp:COFFEE_BONUS});save(s);return COFFEE_BONUS},
 async vault(){const {d}=demo.cur(),qs=all(),act=Object.entries(d.vault).filter(([,v])=>!v.cleared);
  return {questions:act.map(([id])=>qs.find(q=>q.id===id)).filter(Boolean) as Q[],streaks:Object.fromEntries(act.map(([id,v])=>[id,v.streak])),cleared:Object.values(d.vault).filter(v=>v.cleared).length}},
 async bugs(){return BUGS},
 async logBug(id,sel){const {s,d}=demo.cur(),b=BUGS.find(x=>x.id===id);if(b){d.bugs[id]=sel===b.flaw;save(s)}},
 async chapters(){return chapterReadiness(demo.cur().d.att,nq())},
 async summaries(){return SUMMARIES},
 async exposure(){const {d}=demo.cur(),m:Record<string,{n:number;last:number}>={};d.att.forEach(a=>{const e=m[a.q]??(m[a.q]={n:0,last:0});e.n++;e.last=Math.max(e.last,a.ts)});return m},
 async materialize(qs){const {s,d}=demo.cur();const out=qs.map(({key,...q})=>{const g:Q={...q,id:'g:'+key};d.gen[g.id]=g;return g});save(s);return out}};
