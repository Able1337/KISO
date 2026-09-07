import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {archiveLessonEntries,feArchiveLessonEntries,itpecArchiveLesson} from '../app/itpec-archive-lessons.ts';
import {lessonCoverage} from '../lib/lesson-coverage.ts';
import {makeAttempt,answerQuestion,summarize,completeSection,startNextPart,navigateQuestion,secondsRemaining,readStorage,saveAttempt} from '../lib/exam-session.ts';

const packs=[];
for(const year of [2024,2025])for(const season of ['spring','autumn'])for(const level of ['ip','fe']){
 const id=`itpec-${level}-${year}-${season}`;
 const p=JSON.parse(fs.readFileSync(`data/exams/${id}.json`));packs.push(p);
 test(`${id}: complete numbering, assets and timing`,()=>{
  assert.equal(p.id,id);assert.equal(p.year,year);assert.equal(p.season,season);
  assert.equal(p.questions.length,level==='ip'?100:80);
  assert.equal(p.durationSeconds,level==='ip'?7200:11400);
  assert.equal(new Set(p.questions.map(q=>q.id)).size,p.questions.length);
  const parts=level==='fe'?p.parts:[{id:undefined,questionCount:100}];
  if(level==='fe')assert.deepEqual(parts.map(s=>s.durationSeconds),[5400,6000]);
  for(const part of parts){
   const qs=p.questions.filter(q=>q.part===part.id);
   assert.deepEqual(qs.map(q=>q.number),Array.from({length:part.questionCount},(_,i)=>i+1));
  }
  for(const q of p.questions){
   assert.ok(q.options.some(o=>o.id===q.answerId));
   assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);
   for(const img of [...(q.promptPages??[q.prompt]),...q.options.map(o=>o.image)]){
    assert.ok(img.width>0&&img.height>0);assert.ok(fs.existsSync(`public/${img.src}`));
   }
  }
  for(const source of p.parts??[{...p,questionPdf:`exams/${id}/questions.pdf`,answerPdf:`exams/${id}/answers.pdf`}])for(const [file,hash] of [['questionPdf','sourceSha256'],['answerPdf','answerSha256']]){
   assert.ok(source[file]);
   assert.equal(createHash('sha256').update(fs.readFileSync(`public/${source[file]}`)).digest('hex'),source[hash]);
  }
 });
}
test('all eight sessions add exactly 720 questions',()=>assert.equal(packs.reduce((n,p)=>n+p.questions.length,0),720));
test('published lesson coverage is exact; lessons match session keys in all languages',()=>{
 for(const p of packs){
  const groups=p.parts?Object.entries(feArchiveLessonEntries[p.id]??{}):[[undefined,archiveLessonEntries[p.id]??[]]];
  const entries=groups.flatMap(([,es])=>es);
  assert.equal(lessonCoverage[p.id]??0,entries.length);
  assert.equal(entries.length,p.questions.length,'every official question must have a lesson');
  for(const [part,bank] of groups){
   assert.equal(new Set(bank.map(e=>e[0])).size,bank.length);
  for(const entry of bank){
   assert.equal(entry[1],p.questions.find(q=>q.number===entry[0]&&q.part===part).answerId);
   for(const lang of ['ru','en','ja']){
    const lesson=itpecArchiveLesson(p.id,part,entry[0],lang);
    assert.ok(lesson.core.length>(lang==='ja'?5:10));assert.ok(lesson.detail.length>60);
    assert.ok(lesson.search.length>5);assert.ok(lesson.next.length>10);
   }
  }}
 }
 assert.equal(itpecArchiveLesson('unknown',undefined,1,'ru'),null);
 assert.equal(itpecArchiveLesson('itpec-ip-2025-autumn','B',1,'ru'),null);
});
for(const p of packs){
 test(`${p.id}: every wrong answer after shuffle reveals its own three-language lesson`,()=>{
  const base=makeAttempt(p,'learn',1000,()=>.31);
  const b=p.parts?startNextPart(p,completeSection(p,base,1100),1200):null;
  for(const q of p.questions){
   const lessons=['ru','en','ja'].map(lang=>itpecArchiveLesson(p.id,q.part,q.number,lang));
   assert.equal(new Set(lessons.map(l=>l.core+l.detail)).size,3,q.id);
   assert.match(lessons[0].detail,/[А-Яа-яЁё]/,q.id);
   assert.doesNotMatch(lessons[0].core,/[\u3040-\u30ff]/,q.id);
   for(const wrong of q.options.filter(o=>o.id!==q.answerId)){
    const a=answerQuestion(p,q.part==='B'?b:base,q.id,wrong.id,2000);
    assert.equal(a.answers[q.id],wrong.id,q.id);
    assert.equal(summarize(p,a).correct,0,q.id);
    assert.equal(answerQuestion(p,a,q.id,q.answerId,2100),a,'learning keeps first answer');
    assert.equal(a.orders[q.id].filter(id=>id===q.answerId).length,1);
    assert.deepEqual(a.orders[q.id].slice().sort(),q.options.map(o=>o.id).sort());
   }
  }
 });
 for(const mode of ['learn','mock','exam'])test(`${p.id}: ${mode} navigation, resume and complete results`,()=>{
  let a=makeAttempt(p,mode,1000),now=1100;
  assert.equal(secondsRemaining(a,1000),mode==='exam'?(p.parts?5400:7200):null);
  for(const q of p.questions){
   if(q.part==='B'&&a.stage==='A'){
    a=completeSection(p,a,now++);assert.equal(a.stage,'break');assert.equal(a.deadline,null);
    a=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),p).active;
    a=startNextPart(p,a,now++);assert.equal(secondsRemaining(a,now-1),mode==='exam'?6000:null);
   }
   a=navigateQuestion(p,a,p.questions.indexOf(q),now++);
   assert.equal(a.index,p.questions.indexOf(q));
   a=answerQuestion(p,a,q.id,q.answerId,now++);
  }
  a=completeSection(p,a,now++);
  const result=summarize(p,a);
  assert.equal(a.status,'finished');assert.equal(result.correct,p.questions.length);assert.equal(result.passed,true);
  assert.equal(readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),p).history.length,1);
 });
}
test('spreadsheet expected sales examples independently recompute',()=>{
 assert.deepEqual([[300000,100000,80000],[250000,280000,300000],[100000,250000,350000]].map(row=>row.reduce((s,n,i)=>s+n*[.5,.3,.2][i],0)),[196000,269000,195000]);
});
test('October 2025 calculations and published-key discrepancy are explicit',()=>{
 assert.equal(15*(6+.5*4),120);assert.ok(15*(6+.5*3)<120);
 assert.equal(3+150+10+60,223);
 assert.equal(Math.min(60/10,40/5),6);
 assert.equal(Math.min(...Array.from({length:16},(_,x)=>(20-x)*400+(15+x)*200+x*200+(15-x)*100)),11000);
 assert.equal(800*6000-700*6000-600000,0);
 assert.deepEqual([[2,3,4],[4,4,2],[3,2,4],[3,3,3]].map(r=>r.reduce((s,n,i)=>s+n*[2,3,5][i],0)),[33,30,32,30]);
 const e=archiveLessonEntries['itpec-ip-2025-autumn'].find(e=>e[0]===42);
 assert.equal(e[1],'a');for(const t of e.slice(2)){assert.match(t[0],/a/);assert.match(t[0],/c/);}
});
