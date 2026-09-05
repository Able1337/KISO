import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { makeAttempt, finishAttempt, secondsRemaining, summarize, readStorage, saveAttempt, isAttempt, guardedSave, answerQuestion } from '../lib/exam-session.ts';

const pack=JSON.parse(readFileSync(new URL('../data/exams/itpec-ip-2026-spring.json',import.meta.url),'utf8'));
test('official pack is complete; all keys, sources and assets are present',()=>{
  assert.equal(pack.questions.length,100);
  assert.equal(new Set(pack.questions.map(q=>q.id)).size,100);
  assert.deepEqual(pack.questions.map(q=>q.number),Array.from({length:100},(_,i)=>i+1));
  for(const q of pack.questions){
    assert.deepEqual(q.options.map(o=>o.id),['a','b','c','d']);
    assert.ok(q.options.some(o=>o.id===q.answerId));
    assert.equal(q.source,`(2026S, IP, Q${q.number})`);
    for(const asset of [q.prompt,...q.options.map(o=>o.image)]){
      assert.ok(asset.width>10&&asset.height>10);
      assert.ok(existsSync(new URL(`../public/${asset.src}`,import.meta.url)),asset.src);
    }
  }
  assert.equal(pack.questions[63].answerId,'a');
  assert.equal(pack.questions[70].answerId,'b');
  assert.equal(pack.questions[93].answerId,'b');
});
test('shuffle preserves stable IDs and exactly one correct option',()=>{
  for(let n=0;n<30;n++){
    const a=makeAttempt(pack,'mock',1000+n);
    for(const q of pack.questions){
      assert.deepEqual([...a.orders[q.id]].sort(),['a','b','c','d']);
      assert.equal(a.orders[q.id].filter(id=>id===q.answerId).length,1);
    }
  }
});
test('unanswered items count against the full paper, including early completion',()=>{
  const a=makeAttempt(pack,'mock',1000); const q=pack.questions[0];a.answers[q.id]=q.answerId;
  const s=summarize(pack,finishAttempt(a,5000));
  assert.equal(s.percent,1);assert.equal(s.unanswered,99);assert.equal(s.total,100);assert.equal(s.passed,false);
});
test('passing requires the overall and every field threshold',()=>{
  const a=makeAttempt(pack,'mock',1000);
  for(const q of pack.questions) a.answers[q.id]=q.answerId;
  assert.equal(summarize(pack,a).passed,true);
  for(const q of pack.questions.filter(q=>q.domain==='management')) delete a.answers[q.id];
  assert.equal(summarize(pack,a).percent,80);assert.equal(summarize(pack,a).passed,false);
});
test('timer uses absolute deadline and cannot gain time through reload',()=>{
  const a=makeAttempt(pack,'exam',1000);
  assert.equal(secondsRemaining(a,1000),7200);
  const saved=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),pack).active;
  assert.equal(secondsRemaining(saved,1000+7200*1000+500),0);
  assert.equal(secondsRemaining(makeAttempt(pack,'mock',1000),99999999),null);
});
test('answers and shuffle survive resume; finalization is stored once',()=>{
  const a=makeAttempt(pack,'mock',1000); a.answers[pack.questions[93].id]='b';a.index=93;
  const stored=saveAttempt({version:1,active:null,history:[]},a);
  assert.deepEqual(readStorage(JSON.stringify(stored),pack).active,a);
  const done=finishAttempt(a,2000);const finished=saveAttempt(saveAttempt(stored,done),done);
  assert.equal(finished.active,null);assert.equal(finished.history.length,1);
  assert.equal(readStorage(JSON.stringify(finished),pack).history[0].answers[pack.questions[93].id],'b');
});
test('malformed cached data is rejected without a runtime crash',()=>{
  assert.equal(readStorage('broken JSON',pack).active,null);
  assert.equal(readStorage('{"version":1,"active":null,"history":[null,42,{"version":1}]}',pack).history.length,0);
  const a=makeAttempt(pack,'exam',1000);a.orders[pack.questions[0].id]=['a','a','c','d'];assert.equal(isAttempt(a,pack),false);
});
test('stale tabs cannot overwrite answers or resurrect a completed attempt',()=>{
  const a=makeAttempt(pack,'mock',1000);
  const baseline=saveAttempt({version:1,active:null,history:[]},a);
  const updated={...a,answers:{[pack.questions[0].id]:'a'}};
  const latest=guardedSave(baseline,baseline,updated);
  assert.equal(latest.conflict,false);
  const stale=guardedSave(baseline,latest.storage,{...a,index:1});
  assert.equal(stale.conflict,true);
  assert.equal(stale.storage.active.answers[pack.questions[0].id],'a');
  const finished=saveAttempt(latest.storage,finishAttempt(updated,2000));
  const resurrect=guardedSave(latest.storage,finished,updated);
  assert.equal(resurrect.conflict,true);assert.equal(resurrect.storage.active,null);
  assert.equal(resurrect.storage.history.length,1);
});
test('learning is untimed and preserves the first answer after feedback and navigation',()=>{
  const q=pack.questions[3];const wrong=q.options.find(o=>o.id!==q.answerId).id;
  const initial=makeAttempt(pack,'learn',1000);
  assert.equal(secondsRemaining(initial,999999999),null);
  const answered=answerQuestion(pack,initial,q.id,wrong,2000);
  const resumed=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},answered)),pack).active;
  assert.equal(resumed.mode,'learn');assert.equal(resumed.answers[q.id],wrong);
  const revisited={...resumed,index:3};
  assert.equal(answerQuestion(pack,revisited,q.id,q.answerId,3000).answers[q.id],wrong);
  assert.deepEqual(revisited.orders,initial.orders);
});
test('mock and exam answers can change before completion but not after it',()=>{
  for(const mode of ['mock','exam']){
    const q=pack.questions[0];const initial=makeAttempt(pack,mode,1000);
    const wrong=answerQuestion(pack,initial,q.id,'a',2000);
    const corrected=answerQuestion(pack,wrong,q.id,q.answerId,3000);
    assert.equal(corrected.answers[q.id],q.answerId);
    const done=finishAttempt(corrected,4000);
    assert.deepEqual(answerQuestion(pack,done,q.id,'a',5000),done);
  }
});
test('answering after a timed deadline finalizes without recording the late answer',()=>{
  const a=makeAttempt(pack,'exam',1000);const q=pack.questions[0];
  const result=answerQuestion(pack,a,q.id,q.answerId,a.deadline+1);
  assert.equal(result.status,'finished');assert.equal(result.finishedAt,a.deadline);
  assert.equal(result.answers[q.id],undefined);
});
