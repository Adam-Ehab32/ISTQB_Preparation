import {KL,K} from './data';
import type {Xp} from './types';
export const BASE:Record<K,number>={K1:10,K2:20,K3:30};
export const GOAL_MS=15*60*1000;
/** run = consecutive correct answers including this one; dayMs = quiz time today including this answer. */
export function calcXp(a:{k:K;ok:boolean;ms:number;run:number;dayMs:number;goalPaid:boolean}):Xp{
 const base=a.ok?BASE[a.k]:0,speed=a.ok&&a.ms<KL[a.k].sec*500?10:0,streak=a.ok&&a.run>0&&a.run%5===0?25:0,daily=!a.goalPaid&&a.dayMs>=GOAL_MS?50:0;
 return {base,speed,streak,daily,total:base+speed+streak+daily}}
/** Overall = exam-weighted chapter readiness; with a mock result it is 40% syllabus + 60% best mock, otherwise capped at 60% of the syllabus score. */
export const readiness=(chs:{ch:number;readiness:number}[],mocks:{correct:number;total:number}[])=>{
 const base=chs.reduce((s,c)=>s+(blueprint[c.ch]||0)*c.readiness,0)/40,best=mocks.length?Math.max(...mocks.map(m=>m.correct/m.total*100)):null;
 return Math.round(best===null?base*.6:base*.4+best*.6)};
export const blueprint:Record<number,number>={1:8,2:6,3:4,4:11,5:9,6:2}; // CTFL v4.0 exam: 40 questions by chapter
export const COFFEE_BONUS=15;
