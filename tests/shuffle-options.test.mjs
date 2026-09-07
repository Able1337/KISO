import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shuffleOptions,makeAttempt,finishAttempt,saveAttempt,readStorage,answerQuestion} from '../lib/exam-session.ts';
const packs=['ip','fe'].map(level=>JSON.parse(readFileSync(new URL(`../data/exams/itpec-${level}-2026-spring.json`,import.meta.url),'utf8')));

test('every option moves relative to the source and then the previous attempt, IP and FE',()=>{
  for(const pack of packs){
    let previous=Object.fromEntries(pack.questions.map(q=>[q.id,q.options.map(o=>o.id)]));
    for(let n=0;n<50;n++){
      const snapshot=structuredClone(previous);
      const attempt=makeAttempt(pack,'learn',n,Math.random,previous);
      for(const q of pack.questions){
        assert.deepEqual([...attempt.orders[q.id]].sort(),q.options.map(o=>o.id));
        assert.ok(attempt.orders[q.id].every((id,i)=>id!==previous[q.id][i]),q.id);
        assert.notEqual(attempt.orders[q.id].indexOf(q.answerId),previous[q.id].indexOf(q.answerId));
      }
      assert.deepEqual(previous,snapshot,'previous results must not be changed');
      previous=attempt.orders;
    }
  }
});

test('shuffle terminates with constant random values and handles small or invalid input',()=>{
  for(const random of [()=>0,()=>0.5,()=>0.999999])for(let size=2;size<=9;size++){
    const ids=[...'abcdefghi'].slice(0,size);
    let previous=[...ids];
    for(let n=0;n<5;n++){
      const next=shuffleOptions(ids,previous,random);
      assert.deepEqual([...next].sort(),ids);
      assert.ok(next.every((id,i)=>id!==previous[i]));previous=next;
    }
  }
  assert.deepEqual(shuffleOptions([],undefined),[]);
  assert.deepEqual(shuffleOptions(['a'],['a']),['a']);
  const ids=['a','b','c','d'];
  for(const invalid of [['a','a','c','d'],['x','y','z','w'],['a']]){
    const next=shuffleOptions(ids,invalid);assert.deepEqual([...next].sort(),ids);assert.ok(next.every((id,i)=>id!==ids[i]));
  }
});

test('resuming keeps option order and answer identities; a new attempt uses saved history',()=>{
  const pack=packs[0],q=pack.questions[0];
  const initial=makeAttempt(pack,'learn',1000);
  const answered=answerQuestion(pack,initial,q.id,q.answerId,2000);
  const saved=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},answered)),pack);
  assert.deepEqual(saved.active.orders,initial.orders);
  assert.equal(saved.active.answers[q.id],q.answerId);
  const history=saveAttempt(saved,finishAttempt(answered,3000));
  const next=makeAttempt(pack,'mock',4000,Math.random,history.history[0].orders);
  assert.ok(next.orders[q.id].every((id,i)=>id!==initial.orders[q.id][i]));
  assert.deepEqual(next.answers,{});assert.deepEqual(history.history[0].orders,initial.orders);
});
