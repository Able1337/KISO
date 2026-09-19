import {foundationLessons,readFoundationAnswers} from './foundation-lessons.ts';
import {shuffleOptions} from './exam-session.ts';
export type FoundationPractice={version:1;answers:Record<string,number>;orders:Record<string,string[]>};
export function readFoundationPractice(raw:string|null,random=Math.random):FoundationPractice{
 let data:unknown;try{data=JSON.parse(raw??'null');}catch{data=null;}
 const saved=data&&typeof data==='object'&&'version' in data&&data.version===1&&'orders' in data?data.orders:null;
 const orders=Object.fromEntries(foundationLessons.map(l=>{
  const ids=l.options.map((_,i)=>String(i));const order=saved&&typeof saved==='object'&&l.id in saved?(saved as Record<string,unknown>)[l.id]:null;
  return [l.id,Array.isArray(order)&&order.length===ids.length&&new Set(order).size===ids.length&&order.every(v=>typeof v==='string'&&ids.includes(v))?order:shuffleOptions(ids,undefined,random)];
 }));
 return {version:1,answers:readFoundationAnswers(raw),orders};
}
export function answerFoundation(state:FoundationPractice,id:string,option:number):FoundationPractice{
 const lesson=foundationLessons.find(l=>l.id===id);
 if(!lesson||!Number.isInteger(option)||option<0||option>=lesson.options.length||state.answers[id]!==undefined)return state;
 return {...state,answers:{...state.answers,[id]:option}};
}
export function retryFoundation(state:FoundationPractice,id:string,random=Math.random):FoundationPractice{
 const lesson=foundationLessons.find(l=>l.id===id);if(!lesson)return state;
 const answers={...state.answers};delete answers[id];return {...state,answers,orders:{...state.orders,[id]:shuffleOptions(lesson.options.map((_,i)=>String(i)),state.orders[id],random)}};
}
