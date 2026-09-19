import {shuffleOptions,type ExamQuestion} from './exam-session.ts';
export type TopicPractice={version:1;order:string[];answer?:string;revealed:boolean};
export const topicPracticeKey=(pack:string,question:string)=>`kiso-topic-practice-v1:${pack}:${question}`;
export function readTopicPractice(raw:string|null,q:ExamQuestion):TopicPractice {
 const ids=q.options.map(o=>o.id);
 try {const v=JSON.parse(raw??'null');
  if(v?.version===1&&Array.isArray(v.order)&&v.order.length===ids.length&&new Set(v.order).size===ids.length&&v.order.every((id:unknown)=>typeof id==='string'&&ids.includes(id))&&typeof v.revealed==='boolean'&&(v.answer===undefined||ids.includes(v.answer)))return {version:1,order:v.order,answer:v.answer,revealed:v.revealed||v.answer!==undefined};
 }catch{/* Invalid local data never prevents studying. */}
 return {version:1,order:shuffleOptions(ids,undefined),revealed:false};
}
export function answerTopic(state:TopicPractice,id:string):TopicPractice {
 return state.answer!==undefined||state.revealed||!state.order.includes(id)?state:{...state,answer:id,revealed:true};
}
export function retryTopic(state:TopicPractice):TopicPractice {
 return {version:1,order:shuffleOptions(state.order,state.order),revealed:false};
}
