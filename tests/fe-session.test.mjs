import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeAttempt,answerQuestion,completeSection,startNextPart,expireAttempt,navigateQuestion,secondsRemaining,summarize,isAttempt,readStorage,saveAttempt,guardedSave,storageKey,STORAGE_KEY} from '../lib/exam-session.ts';
const pack=JSON.parse(readFileSync(new URL('../data/exams/itpec-fe-2026-spring.json',import.meta.url),'utf8'));
const ip=JSON.parse(readFileSync(new URL('../data/exams/itpec-ip-2026-spring.json',import.meta.url),'utf8'));
const [firstA,firstB]=[pack.questions[0],pack.questions[60]];
const started=10000;

test('complete FE A/B: all 80 keys, 452 crops and four original PDFs',()=>{
  assert.equal(pack.questions.length,80);
  assert.equal(new Set(pack.questions.map(q=>q.id)).size,80);
  assert.deepEqual(pack.parts.map(p=>[p.id,p.questionCount,p.durationSeconds]),[['A',60,5400],['B',20,6000]]);
  for(const part of pack.parts){
    assert.deepEqual(pack.questions.filter(q=>q.part===part.id).map(q=>q.number),Array.from({length:part.questionCount},(_,i)=>i+1));
    for(const [url,sha] of [[part.questionPdf,part.sourceSha256],[part.answerPdf,part.answerSha256]]){
      assert.equal(createHash('sha256').update(readFileSync(new URL('../public/'+url,import.meta.url))).digest('hex'),sha);
    }
  }
  const aKey=['c','b','a','c','c','d','b','c','c','d','b','b','b','d','c','d','b','a','b','d','d','d','d','b','c','b','b','c','d','b','b','b','a','c','d','a','b','a','a','c','d','d','b','c','c','d','c','c','c','b','b','a','a','b','b','a','c','b','b','d'];
  assert.deepEqual(pack.questions.slice(0,60).map(q=>q.answerId),aKey);
  // Keep a separately transcribed key to catch option extraction/identity errors.
  const bKey=['c','d','b','f','e','d','d','e','b','c','d','d','a','f','i','c','a','c','c','c'];
  assert.deepEqual(pack.questions.slice(60).map(q=>q.answerId),bKey);
  assert.equal(pack.questions[10].answerId,'b');
  let assets=0;
  for(const q of pack.questions){
    assert.equal(q.source,`(2026S, FE, Subject-${q.part}, Q${q.number})`);
    assert.deepEqual(q.options.map(o=>o.id),[...'abcdefghi'].slice(0,q.options.length));
    assert.ok(q.options.some(o=>o.id===q.answerId));
    assert.equal(q.prompt.src,q.promptPages[0].src);
    for(const asset of [...q.promptPages,...q.options.map(o=>o.image)]){
      assert.ok(existsSync(new URL('../public/'+asset.src,import.meta.url)),asset.src);
      assert.ok(asset.width>10&&asset.height>10);assets++;
    }
  }
  assert.equal(assets,452);
  assert.equal(pack.questions[79].promptPages.length,4);
  assert.equal(pack.questions[68].promptPages.length,2);
  assert.ok(pack.questions[51].options.every(o=>o.image.height>150),'A52 headers must be retained');
  assert.ok(pack.questions[77].options.every(o=>o.image.height>100),'B18 role headers must be retained');
});

for(const mode of ['learn','mock','exam'])test(`FE ${mode}: navigation, locked A, saved pause and independent B timer`,()=>{
  let a=makeAttempt(pack,mode,started);
  assert.equal(a.stage,'A');assert.ok(isAttempt(a,pack));
  assert.equal(secondsRemaining(a,started),mode==='exam'?5400:null);
  assert.equal(navigateQuestion(pack,a,60,started),a,'B inaccessible during A');
  assert.equal(answerQuestion(pack,a,firstB.id,firstB.answerId,started),a);
  a=navigateQuestion(pack,a,59,started+10);assert.equal(a.index,59);
  a=answerQuestion(pack,a,firstA.id,firstA.answerId,started+20);
  a=completeSection(pack,a,started+1000);
  assert.equal(a.stage,'break');assert.equal(a.deadline,null);assert.equal(a.status,'active');
  assert.ok(isAttempt(a,pack));
  assert.equal(expireAttempt(pack,a,started+100000000),a,'pause never auto-starts B');
  assert.equal(answerQuestion(pack,a,firstA.id,'a',started+1100),a);
  assert.equal(navigateQuestion(pack,a,1,started+1100),a);
  const saved=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),pack);
  assert.deepEqual(saved.active,a);
  const beginB=started+900000;
  a=startNextPart(pack,saved.active,beginB);
  assert.equal(a.stage,'B');assert.equal(a.index,60);assert.ok(isAttempt(a,pack));
  assert.equal(a.deadline,mode==='exam'?beginB+6000000:null);
  assert.equal(startNextPart(pack,a,beginB+123),a,'B cannot restart its timer');
  assert.equal(navigateQuestion(pack,a,0,beginB),a,'cannot go back to A');
  assert.equal(answerQuestion(pack,a,firstA.id,'a',beginB),a,'cannot change submitted A');
  a=navigateQuestion(pack,a,79,beginB+1);assert.equal(a.index,79);
  a=answerQuestion(pack,a,firstB.id,firstB.answerId,beginB+10);
  a=completeSection(pack,a,beginB+1000);
  assert.equal(a.status,'finished');assert.ok(isAttempt(a,pack));
  const result=summarize(pack,a);assert.equal(result.correct,2);assert.equal(result.unanswered,78);
  assert.deepEqual(result.parts.map(p=>[p.correct,p.total]),[[1,60],[1,20]]);
});

test('FE A expiry enters pause, B expiry finishes, no late answer or gained time after reload',()=>{
  const a=makeAttempt(pack,'exam',started);
  const paused=answerQuestion(pack,a,firstA.id,firstA.answerId,a.deadline+1);
  assert.equal(paused.stage,'break');assert.deepEqual(paused.answers,{});assert.equal(paused.partAEndedAt,a.deadline);
  const b=startNextPart(pack,paused,a.deadline+1000000);
  const reloaded=readStorage(JSON.stringify({version:1,active:b,history:[]}),pack).active;
  assert.equal(secondsRemaining(reloaded,b.partBStartedAt+2000),5998);
  const final=answerQuestion(pack,reloaded,firstB.id,firstB.answerId,b.deadline);
  assert.equal(final.status,'finished');assert.equal(final.finishedAt,b.deadline);assert.deepEqual(final.answers,{});
  assert.equal(completeSection(pack,final,b.deadline+1000),final);
});

test('FE requires 60% in each section, not a weighted overall pass',()=>{
  let a=startNextPart(pack,completeSection(pack,makeAttempt(pack,'mock',started),started+1),started+2);
  for(const q of pack.questions.slice(0,60))a.answers[q.id]=q.answerId;
  assert.equal(summarize(pack,a).percent,75);assert.equal(summarize(pack,a).passed,false);
  a.answers={};for(const q of [...pack.questions.slice(0,36),...pack.questions.slice(60,72)])a.answers[q.id]=q.answerId;
  assert.equal(summarize(pack,a).passed,true);
  delete a.answers[pack.questions[71].id];assert.equal(summarize(pack,a).passed,false);
});

test('IP storage is unchanged; FE is isolated and corrupt stage/timer records are rejected',()=>{
  assert.equal(storageKey(ip),STORAGE_KEY);assert.notEqual(storageKey(pack),STORAGE_KEY);
  const a=makeAttempt(pack,'exam',started);
  for(const broken of [{...a,stage:'B'},{...a,deadline:a.deadline+1},{...a,index:60},{...a,answers:{[firstB.id]:'a'}},{...a,partAEndedAt:100}])assert.equal(isAttempt(broken,pack),false);
  const paused=completeSection(pack,a,started+1);
  const b=startNextPart(pack,paused,started+2);
  assert.equal(isAttempt({...b,partBStartedAt:started},pack),false);
  const before={version:1,active:paused,history:[]},after={version:1,active:b,history:[]};
  assert.equal(guardedSave(before,after,startNextPart(pack,paused,started+999)).conflict,true,'stale tab cannot reset B');
  assert.equal(readStorage(JSON.stringify(after),ip).active,null);
});

test('FE shuffle supports up to nine options and preserves the source key',()=>{
  for(let n=0;n<20;n++)for(const q of pack.questions){const a=makeAttempt(pack,'learn',n);assert.deepEqual([...a.orders[q.id]].sort(),q.options.map(o=>o.id));assert.equal(a.orders[q.id].filter(v=>v===q.answerId).length,1);}
});
