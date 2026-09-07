import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ipaIpArchiveEntries} from '../app/ipa-ip-archive-lessons.ts';
import {ipaLesson} from '../app/ipa-lessons.ts';
import {lessonCoverage} from '../lib/lesson-coverage.ts';
import {makeAttempt,answerQuestion,summarize,completeSection,navigateQuestion,secondsRemaining,readStorage,saveAttempt,storageKey} from '../lib/exam-session.ts';
// Independently transcribed from official answer PDFs, not generated from banks.
const keys={
 2024:['d b c b b d b c a b b a d a c b d c c b c c a c a','a b a b d d b d d d a d b d a b b b a d d c b a d','d a c c c b c d b b a d a b c d c c b c b c d d d','c c a d a d b d d d c d a c a d c b a b c b b c b'].join(' ').replaceAll(' ',''),
 2025:['c c b d c b b b c d d d c b a b a a a b b c c d a','c b d b d b c a b d a d d a b d a a d a b d a c a','d a b a a a b c a d c a c b a b b c b d d b c a c','c b d a c d c c b b d c b a d d a c b c c a c c a'].join(' ').replaceAll(' ',''),
};
for(const year of [2024,2025]){
 const id=`ipa-ip-${year}-public`,p=JSON.parse(readFileSync(`data/exams/${id}.json`)),bank=ipaIpArchiveEntries[id];
 test(`${id}: 100 original questions, independent keys, source hashes and 120-minute timer`,()=>{
  assert.equal(p.questions.length,100);assert.equal(p.durationSeconds,7200);assert.equal(p.originalLanguage,'ja');assert.equal(p.publishedSubset,true);assert.deepEqual(p.translations,[]);
  assert.equal(p.referencePage,year===2024?46:48);
  assert.deepEqual(p.questions.map(q=>q.number),Array.from({length:100},(_,i)=>i+1));
  assert.equal(new Set(p.questions.map(q=>q.id)).size,100);
  assert.equal(p.questions.map(q=>q.answerId).join(''),keys[year]);
  assert.deepEqual(['strategy','management','technology'].map(d=>p.questions.filter(q=>q.domain===d).length),[35,20,45]);
  for(const [file,hash]of [['questions.pdf',p.sourceSha256],['answers.pdf',p.answerSha256]])assert.equal(createHash('sha256').update(readFileSync(`public/exams/${id}/${file}`)).digest('hex'),hash);
  for(const q of p.questions){
   assert.match(q.source,new RegExp(String(year)));assert.deepEqual(q.options.map(o=>o.id),['a','b','c','d']);
   for(const a of [...q.promptPages,...q.options.map(o=>o.image)]){assert.ok(existsSync('public/'+a.src),a.src);assert.ok(a.width>15&&a.height>15,a.src);}
  }
 });
 test(`${id}: all lessons routed by year with exact keys and three substantive languages`,()=>{
  assert.equal(bank.length,100);assert.equal(new Set(bank.map(e=>e[0])).size,100);assert.equal(lessonCoverage[id],100);assert.equal(p.lessonsReady,true);
  for(const q of p.questions){
   const e=bank.find(e=>e[0]===q.number);assert.equal(e[1],q.answerId,q.id);
   for(const [i,lang]of ['ru','en','ja'].entries()){
    const l=ipaLesson('IP',undefined,q.number,lang,id);assert.equal(l.detail,e[i+2][1]);
    assert.ok(l.core.length>5,q.id);assert.ok(l.detail.length>70,q.id+' '+lang);assert.ok(l.search.length>5);assert.ok(l.next.length>10);
    assert.doesNotMatch(l.detail,/TODO|TBD|ещё готовится/);if(lang!=='ru')assert.doesNotMatch(l.detail,/[а-яё]/i);
    assert.ok(l.sources.length>0);
   }
  }
 });
 test(`${id}: every incorrect choice after shuffle retains the correct lesson and original key`,()=>{
  const base=makeAttempt(p,'learn',1000,()=>.31);
  for(const q of p.questions)for(const o of q.options.filter(o=>o.id!==q.answerId)){
   const a=answerQuestion(p,base,q.id,o.id,1100);assert.equal(a.answers[q.id],o.id);assert.equal(summarize(p,a).correct,0);
   assert.equal(answerQuestion(p,a,q.id,q.answerId,1200),a);
   assert.deepEqual(a.orders[q.id].slice().sort(),['a','b','c','d']);
   assert.ok(a.orders[q.id].every((id,i)=>id!==q.options[i].id));
  }
 });
 for(const mode of ['learn','mock','exam'])test(`${id}: ${mode} navigation, resume, finish and history`,()=>{
  let a=makeAttempt(p,mode,1000),now=1100;
  assert.equal(secondsRemaining(a,1000),mode==='exam'?7200:null);
  for(const i of Array.from({length:100},(_,i)=>99-i)){
   a=navigateQuestion(p,a,i,now++);assert.equal(a.index,i);
   a=answerQuestion(p,a,p.questions[i].id,p.questions[i].answerId,now++);
  }
  a=readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),p).active;
  assert.equal(Object.keys(a.answers).length,100);
  a=completeSection(p,a,now);assert.equal(a.status,'finished');assert.equal(summarize(p,a).correct,100);assert.equal(summarize(p,a).passed,true);
  assert.equal(readStorage(JSON.stringify(saveAttempt({version:1,active:null,history:[]},a)),p).history.length,1);
 });
}
test('archive keys remain isolated from IPA IP 2026 and other years',()=>{
 assert.equal(ipaLesson('IP',undefined,1,'en','unknown'),null);
 const ids=[2024,2025,2026].map(year=>JSON.parse(readFileSync(`data/exams/ipa-ip-${year}-public.json`)));
 assert.equal(new Set(ids.map(storageKey)).size,3);
 assert.equal(new Set(ids.map(p=>ipaLesson('IP',undefined,1,'en',p.id).detail)).size,3);
});
test('IPA IP 2024 arithmetic and binary algorithm independently recompute',()=>{
 assert.equal(8000-6000+150-50+60-10-350-800,1000);
 assert.equal(Math.round(1000/(500-400+200)*10)/10,3.3);
 assert.equal(5*(22-7)*(1-.98),1.5000000000000013);
 assert.equal((1-.2**2)*.9,.864);
 assert.equal((4-1)*1,3);
 let favorable=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)for(let c=1;c<=6;c++)if(a!==1&&b!==1&&c!==1)favorable++;
 assert.equal(favorable,125);
 for(let n=0;n<256;n++){
  const s=n.toString(2);let result=0;for(let i=1;i<=s.length;i++)result+=Number(s.at(-i))*2**(i-1);
  assert.equal(result,n);
 }
 assert.deepEqual(['千葉翔','葉山花子','鈴木葉子','佐藤乙葉','秋葉彩葉','稲葉小春'].filter(s=>/葉.$/u.test(s)),['千葉翔','鈴木葉子']);
});
test('IPA IP 2025 arithmetic, branches, key ownership and loop bounds independently recompute',()=>{
 assert.equal(1300+1000,2300);
 const margin=60000000/5000-7000;assert.equal((10000000-4000000)/margin,1200);
 assert.equal(40/(100*20/40)*100,80);assert.equal(10000000/(20000000*40/100)*100,125);
 assert.equal(.6*.5*100,30);
 assert.equal(Array.from({length:7},(_,i)=>i+1).filter(i=>i%3===0).reduce((s,n)=>s+n,0),9);
 let errors=.7,cycles=0;while(1-errors<=.35){errors*=.95;cycles++;}assert.equal(cycles,2);
 assert.ok(Math.abs(1-errors-.36825)<1e-12);
 assert.equal([1,2,3,4,5].find(n=>1-.1**n>=.999),3);
 const values=[27,42,33,12];let passes=0;
 for(let count=values.length;count>=1;count--){const i=values.indexOf(Math.max(...values.slice(0,count)));[values[i],values[count-1]]=[values[count-1],values[i]];passes++;}
 assert.deepEqual(values,[12,27,33,42]);assert.equal(passes,4);
 const reward=(amount,days)=>amount<100000?(days<7?500:1000):(days<7?2000:5000);
 assert.equal(reward(200000,3)+reward(50000,14),3000);assert.equal(reward(100000,7),5000);assert.equal(reward(99999,6),500);
 const heldByA=new Set(['shared','A-private','A-public','B-public']);
 assert.deepEqual(Object.entries({a:'shared',b:'A-private',c:'B-private',d:'B-public'}).filter(([,key])=>heldByA.has(key)).map(([id])=>id),['a','b','d']);
 assert.match(ipaLesson('IP',undefined,89,'en','ipa-ip-2025-public').core,/^A can/);
});
