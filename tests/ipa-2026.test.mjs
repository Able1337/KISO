import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ipaLesson,ipaIp,ipaFeA,ipaFeB} from '../app/ipa-lessons.ts';
import {lessonCoverage} from '../lib/lesson-coverage.ts';
import {makeAttempt,answerQuestion,completeSection,startNextPart,expireAttempt,navigateQuestion,secondsRemaining,summarize,isAttempt,readStorage,storageKey} from '../lib/exam-session.ts';
const bank=level=>JSON.parse(readFileSync(new URL(`../data/exams/ipa-${level}-2026-public.json`,import.meta.url)));
const ip=bank('ip'),fe=bank('fe');
// Independently transcribed from the official answer sheets, in groups of ten.
test('IPA published counts, official keys, Japanese originals and source hashes',()=>{
 assert.equal(ip.questions.length,100);assert.equal(fe.questions.length,26);
 // Explicit groups avoid deriving expected answers from imported question records.
 const expected=['a','a','c','b','d','d','b','c','b','d','d','d','c','a','b','a','b','a','a','b','c','d','b','a','d','a','b','b','c','a','c','c','c','a','d','c','d','b','c','a','c','b','b','b','b','c','c','c','a','c','d','a','b','c','c','d','c','a','c','a','b','d','c','c','d','b','b','d','c','d','a','b','d','a','d','d','c','d','c','d','a','a','a','d','d','d','a','a','b','c','c','b','a','b','b','a','b','c','b','c'];
 assert.deepEqual(ip.questions.map(q=>q.answerId),expected);
 assert.deepEqual(fe.questions.map(q=>q.answerId),'bcbbbbdaccacad caba ab'.replaceAll(' ','').split('').concat(['d','f','a','d','b','i']));
 assert.deepEqual(fe.parts.map(p=>[p.id,p.questionCount,p.durationSeconds]),[['A',20,1800],['B',6,1800]]);
 assert.equal(ip.durationSeconds,7200);
 assert.deepEqual(['strategy','management','technology'].map(d=>ip.questions.filter(q=>q.domain===d).length),[34,20,46]);
 for(const pack of [ip,fe]){
  assert.equal(pack.originalLanguage,'ja');assert.equal(pack.publishedSubset,true);
  assert.equal(new Set(pack.questions.map(q=>q.id)).size,pack.questions.length);
  for(const q of pack.questions){
   assert.ok(q.options.some(o=>o.id===q.answerId));assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);
   for(const a of [...q.promptPages,...q.options.map(o=>o.image)]){assert.ok(existsSync(new URL('../public/'+a.src,import.meta.url)));assert.ok(a.width>20&&a.height>15);}
  }
  const parts=pack.parts??[{questionPdf:`exams/${pack.id}/questions.pdf`,answerPdf:`exams/${pack.id}/answers.pdf`,sourceSha256:pack.sourceSha256,answerSha256:pack.answerSha256}];
  for(const p of parts)for(const [path,sha]of [[p.questionPdf,p.sourceSha256],[p.answerPdf,p.answerSha256]])assert.equal(createHash('sha256').update(readFileSync(new URL('../public/'+path,import.meta.url))).digest('hex'),sha);
 }
 assert.equal(fe.questions.at(-1).options.length,10);
 assert.equal(fe.questions.at(-1).promptPages.length,2);
});
test('IPA all wrong choices retain stable keys; all three modes, pause and separate deadlines',()=>{
 for(const pack of [ip,fe])for(const mode of ['learn','mock','exam']){
  let a=makeAttempt(pack,mode,1000);
  assert.equal(secondsRemaining(a,1000),mode==='exam'?(pack===ip?7200:1800):null);
  for(const q of pack.questions){
   if(q.part==='B'&&a.stage==='A'){
    a=completeSection(pack,a,2000);assert.equal(a.stage,'break');assert.equal(a.deadline,null);
    assert.equal(expireAttempt(pack,a,10000000),a);
    a=startNextPart(pack,a,11000000);assert.equal(a.deadline,mode==='exam'?12800000:null);
   }
   a=navigateQuestion(pack,a,pack.questions.indexOf(q),a.stage==='B'?11000001:1500);
   for(const wrong of q.options.filter(o=>o.id!==q.answerId)){
    const b=answerQuestion(pack,a,q.id,wrong.id,a.stage==='B'?11000002:1501);
    assert.equal(b.answers[q.id],wrong.id);assert.equal(summarize(pack,b).correct,0);
    if(mode==='learn')assert.equal(answerQuestion(pack,b,q.id,q.answerId,1502),b);
   }
   assert.ok(a.orders[q.id].every((id,i)=>id!==q.options[i].id));
  }
  a=completeSection(pack,a,a.stage==='B'?11000003:2000);assert.equal(a.status,'finished');assert.ok(isAttempt(a,pack));
  assert.deepEqual(readStorage(JSON.stringify({version:1,active:null,history:[a]}),pack).history,[a]);
 }
 assert.notEqual(storageKey(ip),storageKey(fe));
});
test('IPA lesson coverage is honest and keys match all reviewed translations',()=>{
 for(const [pack,entries,part]of [[ip,ipaIp,undefined],[fe,ipaFeA,'A'],[fe,ipaFeB,'B']])for(const e of entries){
  const q=pack.questions.find(q=>q.number===e[0]&&q.part===part);assert.equal(e[1],q.answerId);
  const details=new Set();
  for(const lang of ['ru','en','ja']){const l=ipaLesson(pack.level,part,e[0],lang);assert.ok(l.core.length>15);assert.ok(l.detail.length>120);assert.ok(l.search.length>8);assert.ok(l.next.length>15);details.add(l.detail);if(lang==='ru')assert.match(l.detail,/[а-яё]/i);}
  assert.equal(details.size,3);
 }
 assert.equal(lessonCoverage[ip.id],ipaIp.length);assert.equal(lessonCoverage[fe.id],ipaFeA.length+ipaFeB.length);
 assert.equal(ipaLesson('IP',undefined,1,'ru'),null);
});
test('IPA IP calculations and algorithms independently verified',()=>{
 assert.equal(300/(730+270)*100,30);
 assert.equal((2000-(900*.05*4+100*2))/2000*100,81);
 const a=[3,5,1,2,4];for(let j=0;j<3;j++){let m=j;for(let k=j+1;k<a.length;k++)if(a[k]<a[m])m=k;[a[j],a[m]]=[a[m],a[j]];}assert.deepEqual(a,[1,2,3,5,4]);
 for(let s=0;s<=3;s++)assert.equal(s<2?s:s===2?0:1,s%2);
 const prime=n=>{if(n<2)return false;for(let d=2;d<n;d++)if(n%d===0)return false;return true;};assert.deepEqual([1,2,3,4,9,25].map(prime),[false,true,true,false,false,false]);
 let c=0,x=0,y=0,angle=0;do{x+=Math.cos(angle);y+=Math.sin(angle);angle+=Math.PI/3;c++;}while(c<6);assert.equal(c,6);assert.ok(Math.abs(x)<1e-10&&Math.abs(y)<1e-10);
 assert.equal(600*300,180000);
 // Resource-feasible schedule A/B/(C+D)/E/F: five three-day slots.
 const tasks=[['A',0,1],['B',1,2],['C',2,2],['D',2,1],['E',3,2],['F',4,1]];
 for(let slot=0;slot<5;slot++)assert.ok(tasks.filter(t=>t[1]===slot).reduce((s,t)=>s+t[2],0)<=3);
});
test('IPA FE truth table, availability, retention and SQL constraints',()=>{
 for(const a of [0,1])for(const b of [0,1]){const nand=(x,y)=>Number(!(x&&y));assert.equal(nand(nand(nand(a,a),nand(b,b)),nand(nand(a,a),nand(b,b))),Number(!(a||b)));}
 assert.equal((5000-100)/5000*100,98);assert.ok(Math.abs((5000-.5)/5000*100-99.99)<1e-10);
 const rates=[[1000,500,800],[1000,200,800],[1500,500,1100],[1500,1000,1800]].map(([start,added,end])=>(end-added)/start);assert.equal(rates.indexOf(Math.max(...rates)),1);
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE p(code TEXT PRIMARY KEY,stock INT); INSERT INTO p VALUES ('A111',0),('A222',50),('A333',NULL),('A444',20)");assert.throws(()=>db.exec("UPDATE p SET code='A777' WHERE stock>=20"));assert.equal(db.prepare('SELECT count(*) AS n FROM p').get().n,4);db.close();
});
test('IPA B algorithms: rotation, all 256 complements, recurrence, pointers, one-hot',()=>{
 const a=[1,2,3,4,5,6,7,8,9],top=a.at(-1);for(let i=a.length-1;i>=1;i--)a[i]=a[i-1];a[0]=top;assert.deepEqual(a,[9,1,2,3,4,5,6,7,8]);
 for(let x=0;x<256;x++)assert.equal((x+((x^255)+1))&255,0);
 const rec=n=>n<=2?1:2*rec(n-2)+rec(n-1);const iter=n=>{let a=1,b=1,c=1;for(let i=3;i<=n;i++){a=b;b=c;c=2*a+b;}return c;};for(let n=1;n<=15;n++)assert.equal(iter(n),rec(n));
 const data=[10,30,20,40,undefined],links=[3,4,2,undefined,undefined],out=[];let p=1;for(let i=0;i<data.length;i++){out.push(data[p-1]);if(links[p-1]===undefined)break;p=links[p-1];}assert.deepEqual(out,[10,20,30,40]);
 const colors=['Red','Green','Blue','Red'],v=[...new Set(colors)];assert.deepEqual(colors.map(c=>v.map(x=>Number(c===x))),[[1,0,0],[0,1,0],[0,0,1],[1,0,0]]);
});
