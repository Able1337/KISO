import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { lessonEntries } from '../app/official-lesson-bank.ts';
import { makeAttempt, answerQuestion } from '../lib/exam-session.ts';

// Compile the real UI lesson module in memory, including its two local imports.
// This avoids a second test-only copy of the seven earlier lessons.
function moduleUrl(file, imports={}) {
  let code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022},
  }).outputText;
  for(const [name,url] of Object.entries(imports)) code=code.replaceAll(`'${name}'`,`'${url}'`);
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const {officialLesson,officialLessonCount}=await import(moduleUrl('../app/official-lessons.ts',{
  './kiso-i18n':moduleUrl('../app/kiso-i18n.ts'),
  './official-lesson-bank':moduleUrl('../app/official-lesson-bank.ts'),
}));
const pack=JSON.parse(readFileSync(new URL('../data/exams/itpec-ip-2026-spring.json',import.meta.url),'utf8'));
const languages=['ru','en','ja'];

test('all 100 original questions have complete, distinct lessons in all three languages',()=>{
  assert.equal(officialLessonCount,100);
  assert.equal(pack.lessonsReady,true);
  assert.equal(lessonEntries.length,93);
  assert.equal(new Set(lessonEntries.map(([n])=>n)).size,93);
  for(const [n,key] of lessonEntries) assert.equal(key,pack.questions[n-1].answerId,`Q${n}: editorial key mismatch`);
  for(const language of languages){
    const details=[];
    for(const q of pack.questions){
      const lesson=officialLesson(q.number,language);
      assert.ok(lesson,`Q${q.number}/${language}`);
      for(const field of ['core','detail','search','next']){
        assert.equal(typeof lesson[field],'string');
        assert.ok(lesson[field].trim().length>10,`Q${q.number}/${language}/${field}`);
        assert.doesNotMatch(lesson[field],/TODO|TBD|готовится|in preparation|準備中/);
      }
      assert.ok(lesson.detail.length>=100,`Q${q.number}/${language}: not a detailed lesson`);
      if(language==='ru') assert.match(lesson.detail,/[а-я]/i);
      if(language==='en') assert.doesNotMatch(lesson.detail,/[а-яぁ-んァ-ヶ]/i);
      if(language==='ja') assert.match(lesson.detail,/[ぁ-んァ-ヶ]/);
      for(const source of lesson.sources??[]) assert.equal(new URL(source.url).protocol,'https:');
      details.push(lesson.detail);
    }
    assert.equal(new Set(details).size,100,'no generic repeated explanations');
  }
  assert.equal(officialLesson(0,'ru'),null);
  assert.equal(officialLesson(101,'ja'),null);
});

test('wrong answers stay wrong after shuffle and reveal the same question-specific lesson',()=>{
  for(let repeat=0;repeat<10;repeat++){
    let attempt=makeAttempt(pack,'learn',1000+repeat);
    for(const q of pack.questions){
      const wrong=attempt.orders[q.id].find(id=>id!==q.answerId);
      attempt=answerQuestion(pack,attempt,q.id,wrong,2000);
      assert.notEqual(attempt.answers[q.id],q.answerId);
      assert.equal(attempt.orders[q.id].filter(id=>id===q.answerId).length,1);
      for(const lang of languages) assert.ok(officialLesson(q.number,lang).detail);
      assert.equal(answerQuestion(pack,attempt,q.id,q.answerId,2001).answers[q.id],wrong);
    }
  }
});

test('Q7 state transitions use the updated state',()=>{
  let state=1;const trace=[state];
  for(let i=0;i<2;i++){const remainder=state*11%3;const step=[1,-1,2][remainder];state=((state-1+step+4)%4)+1;trace.push(state);}
  assert.deepEqual(trace,[1,3,4]);
  for(const lang of languages) assert.match(officialLesson(7,lang).core,/4/);
});

test('Q8 note calculation validates input and uses the remainder',()=>{
  function notes(amount){if(amount<0||amount%1000!==0)return null;return [Math.trunc(amount/10000),Math.trunc((amount%10000)/1000)];}
  assert.equal(notes(-1000),null);assert.equal(notes(1001),null);
  assert.deepEqual(notes(0),[0,0]);assert.deepEqual(notes(23000),[2,3]);
  for(let amount=0;amount<=100000;amount+=1000){const [large,small]=notes(amount);assert.equal(large*10000+small*1000,amount);assert.ok(small<10);}
  for(const lang of languages) assert.match(officialLesson(8,lang).detail,/23000/);
});

test('Q9 border expression draws a hollow square, not just corners',()=>{
  const n=3;const rows=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>r===0||r===n-1||c===0||c===n-1?'*':' ').join(''));
  assert.deepEqual(rows,['***','* *','***']);
});

test('Q53 faster schedule can cost more',()=>{
  const oldWeeks=36/6,newWeeks=36/(6+3);
  assert.equal(oldWeeks,6);assert.equal(newWeeks,4);
  assert.equal(newWeeks*(300000+200000)-oldWeeks*300000,200000);
  for(const lang of languages) assert.match(officialLesson(53,lang).core.replaceAll(/[ ,]/g,''),/200000/);
});

test('Q67 two-machine schedule and all alternative totals',()=>{
  const jobs={A:[8,10],B:[10,5],C:[6,8]};
  function finish(order){let x=0,y=0;for(const id of order){x+=jobs[id][0];y=Math.max(x,y)+jobs[id][1];}return y;}
  assert.deepEqual(['ABC','ACB','CAB','CBA'].map(finish),[32,31,29,34]);
  assert.equal(Math.min(...['ABC','ACB','BAC','BCA','CAB','CBA'].map(finish)),29);
  for(const lang of languages) assert.match(officialLesson(67,lang).core,/29/);
});

test('Q72 income-statement signs reconcile to the stated net income',()=>{
  const expense=8000-6000+150-50+60-10-350-800;
  assert.equal(expense,1000);
  assert.equal(8000-6000-expense+150-50+60-10-350,800);
  for(const lang of languages) assert.match(officialLesson(72,lang).core.replaceAll(',',''),/1000/);
});

test('Q78 preserves the official key but explicitly teaches the ISO ambiguity with primary sources',()=>{
  assert.equal(pack.questions[77].answerId,'b');
  for(const lang of languages){
    const lesson=officialLesson(78,lang);
    assert.match(lesson.detail,/27001:2022/);assert.match(lesson.detail,/30401:2018/);
    assert.equal(lesson.sources.length,2);
    assert.ok(lesson.sources.every(s=>new URL(s.url).hostname==='www.iso.org'));
  }
  assert.match(officialLesson(78,'ru').core,/неоднозначность/);
  assert.match(officialLesson(78,'en').core,/ambiguous/);
  assert.match(officialLesson(78,'ja').core,/曖昧/);
});

test('Q80 weighted score requires 8, not 7',()=>{
  const weights=[1,4,3,2];const score=a=>a.reduce((sum,v,i)=>sum+v*weights[i],0);
  assert.equal(score([9,7,10,6]),79);assert.equal(score([6,9,7,10]),83);
  assert.equal(score([10,10,6,7]),82);assert.equal(score([10,10,6,8]),84);
  for(const lang of languages) assert.match(officialLesson(80,lang).core,/8/);
});

test('Q100 payback uses savings plus incremental profit, not running cost',()=>{
  assert.equal((10/((5-4)+2)).toFixed(1),'3.3');
  for(const lang of languages) assert.match(officialLesson(100,lang).core,/3[.,]3/);
});
