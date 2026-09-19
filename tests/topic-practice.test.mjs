import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {readTopicPractice,answerTopic,retryTopic,topicPracticeKey} from '../lib/topic-practice.ts';
const packs=readdirSync('data/exams').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync('data/exams/'+f,'utf8')));
test('roadmap practice: every official option retains its answer identity and persists independently',()=>{
 const keys=new Set();let count=0;
 for(const p of packs)for(const q of p.questions){count++;const key=topicPracticeKey(p.id,q.id);assert.ok(!keys.has(key));keys.add(key);
  const original=q.options.map(o=>o.id),state=readTopicPractice(null,q);
  assert.deepEqual([...state.order].sort(),[...original].sort());assert.ok(state.order.every((id,i)=>id!==original[i]));
  for(const id of state.order){const answered=answerTopic(state,id);assert.equal(answered.answer,id);assert.equal(answered.revealed,true);assert.deepEqual(readTopicPractice(JSON.stringify(answered),q),answered);
   assert.equal(answered.answer===q.answerId,id===q.answerId);assert.equal(answerTopic(answered,state.order.find(o=>o!==id)),answered);
   const retry=retryTopic(answered);assert.equal(retry.answer,undefined);assert.equal(retry.revealed,false);assert.ok(retry.order.every((o,i)=>o!==answered.order[i]));
  }
  const revealed={...state,revealed:true};assert.equal(answerTopic(revealed,q.answerId),revealed);assert.equal(answerTopic(state,'invalid'),state);
 }assert.equal(count,1384);
});
test('roadmap practice rejects corrupt storage without modifying exam or checkbox storage',()=>{
 const q=packs[0].questions[0];for(const raw of [null,'bad','{}','{"version":2}',JSON.stringify({version:1,order:q.options.map(()=>q.options[0].id),revealed:false})]){const s=readTopicPractice(raw,q);assert.equal(s.answer,undefined);assert.equal(s.revealed,false);assert.equal(new Set(s.order).size,q.options.length);}
 assert.ok(topicPracticeKey(packs[0].id,q.id).startsWith('kiso-topic-practice-v1:'));
});
