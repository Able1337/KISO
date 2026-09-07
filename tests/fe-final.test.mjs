import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {feBLessonEntries,feLesson} from '../app/fe-lessons.ts';
import {makeAttempt,answerQuestion,completeSection,startNextPart,summarize} from '../lib/exam-session.ts';
const pack=JSON.parse(readFileSync(new URL('../data/exams/itpec-fe-2026-spring.json',import.meta.url)));
test('B1–B20: all keys, 60 distinct translations and every wrong answer',()=>{
 assert.deepEqual(feBLessonEntries.map(e=>e[0]),Array.from({length:20},(_,i)=>i+1));
 assert.equal(new Set(feBLessonEntries.flatMap(e=>e.slice(2).map(t=>t[1]))).size,60);
 assert.equal(pack.lessonsReady,true);
 for(const q of pack.questions.slice(60)){
  assert.equal(feBLessonEntries[q.number-1][1],q.answerId);
  for(const lang of ['ru','en','ja']){
   const l=feLesson('B',q.number,lang);
   for(const [k,min] of [['core',15],['detail',120],['search',8],['next',15]])assert.ok(l[k].length>=min,`${q.number} ${lang} ${k}`);
   if(lang==='ru')for(const k of ['core','detail','next'])assert.match(l[k],/[а-яё]/i);
   assert.notEqual(l.detail,feLesson('A',q.number,lang).detail);
  }
  for(const o of q.options.filter(o=>o.id!==q.answerId)){
   const a=startNextPart(pack,completeSection(pack,makeAttempt(pack,'learn',1000),2000),3000);
   const b=answerQuestion(pack,a,q.id,o.id,4000);
   assert.equal(b.answers[q.id],o.id);
   assert.equal(summarize(pack,b).correct,0);
   assert.equal(answerQuestion(pack,b,q.id,q.answerId,5000),b);
  }
 }
});
test('A42 A52 A59 independently calculated totals',()=>{
 assert.equal((500/10+10)*1.1,66);
 assert.deepEqual([200000+4*3*10000+2*10000,350000,10*3*10000+3*2*10000,10*6*6000+2*2*10000],[340000,350000,360000,400000]);
 assert.equal((130000+10000+42000)/(17-3-4),18200);
 for(const lang of ['ru','en','ja'])for(const [n,value]of [[42,'66'],[52,'340000'],[59,'18200']])assert.ok(feLesson('A',n,lang).detail.includes(value));
});
test('B1–B7 independent assignment, branches, distances, digits, calls, roots and recursion',()=>{
 let x=1,y=2,z=3;const ar=[0,0];y=x;ar[x-1]=y;z=y;x=z;ar[1]=z+ar[0];assert.deepEqual(ar,[1,2]);
 const f=v=>{let r='w';if(v>90)r='a';if(v>70)r='b';else if(v>60)r='c';else if(v<=60)r='d';return r;};
 assert.deepEqual([92,72,-10,90,70,60].map(f),['b','b','d','b','c','d']);
 const distance=(s,t)=>s.reduce((sum,v,i)=>sum+Math.abs(v-t[i]),0);assert.equal(distance([0,2],[2,0]),4);assert.equal(distance([1,-2],[4,2]),7);
 const harshad=n=>{if(n<=0)return false;let num=n,sum=0;while(num>0){sum+=num%10;num=Math.floor(num/10);}return n%sum===0;};assert.deepEqual([156,19,0,10,1].map(harshad),[true,false,false,true,true]);
 const out=[];const p3=()=>out.push('C');const p2=()=>{out.push('B');p3();};const p1=()=>{p2();p3();out.push('A');};p1();assert.deepEqual(out,['B','C','C','A']);
 const roots=(a,b1,c1)=>{const b=-b1/(2*a),v=b*b-c1/a;return [b,v,Math.sqrt(Math.abs(v))];};assert.deepEqual(roots(1,-3,2),[1.5,.25,.5]);assert.equal(roots(1,0,1)[1],-1);assert.equal(roots(1,-2,1)[1],0);
 const d=[3,4,2,5,9];const search=(key,i)=>i<1?-1:d[i-1]===key?i:search(key,i-1);assert.equal(search(2,5),3);assert.equal(search(7,5),-1);
});
test('B8–B12 queue wrap, perfect trees, merge, counting sort and isomorphism',()=>{
 let front=3,rear=1,count=5;const q=[34,undefined,undefined,17,13,27,19];if(count<7){q[rear]=51;rear=(rear+1)%7;count++;}assert.equal(q[front],17);front=(front+1)%7;count--;assert.deepEqual([front,rear,count],[4,2,5]);assert.equal((6+1)%7,0);
 const size=t=>t?size(t.l)+size(t.r)+1:0;const height=t=>t?1+Math.max(height(t.l),height(t.r)):0;const perfect=t=>size(t)+1===2**height(t);assert.equal(perfect({l:{},r:{}}),true);assert.equal(perfect({l:{}}),false);assert.equal(perfect(null),true);
 const list=a=>a.length?{v:a[0],next:list(a.slice(1))}:null;const merge=(a,b)=>!a?b:!b?a:a.v<=b.v?(a.next=merge(a.next,b),a):(b.next=merge(a,b.next),b);const flat=t=>t?[t.v,...flat(t.next)]:[];assert.deepEqual(flat(merge(list([1,4]),list([2,3]))),[1,2,3,4]);assert.deepEqual(flat(merge(list([1]),list([1]))),[1,1]);
 const sort=(a,m)=>{const c=Array(m+1).fill(0),r=[];for(const k of a)c[k]++;for(let k=1;k<=m;k++)if(c[k]>0)for(let j=0;j<c[k];j++)r.push(k);return r;};assert.deepEqual(sort([3,6,1,5,3,4,5],6),[1,3,3,4,5,5,6]);
 const iso=(s,t)=>{if(s.length!==t.length)return false;for(let i=0;i<s.length;i++)for(let j=i+1;j<s.length;j++)if((s[i]===s[j])!==(t[i]===t[j]))return false;return true;};assert.deepEqual([['egg','add'],['foo','bar'],['ab','cc'],['paper','title']].map(([s,t])=>iso(s,t)),[true,false,false,true]);
});
test('B13–B16 extraction, percentile convention, word vectors and all 1920 UTF-8 inputs',()=>{
 const extract=txt=>{const r=[];let start=0;while(true){const at=txt.indexOf('@',start);if(at<0)break;let name='',domain='';for(let i=at-1;i>=start&&/[a-z0-9._-]/i.test(txt[i]);i--)name=txt[i]+name;for(let i=at+1;i<txt.length&&/[a-z0-9._-]/i.test(txt[i]);i++)domain+=txt[i];if(name&&domain)r.push(name+'@'+domain);start=at+1;}return r;};assert.deepEqual(extract('a@b@c'),['a@b','b@c']);assert.deepEqual(extract('@b a@'),[]);
 const rank=a=>a.map(v=>a.filter(x=>x<v).length/(a.length-1)*100);assert.deepEqual(rank([30,60,80,72,15]),[25,50,100,75,0]);assert.deepEqual(rank([10,10,20]),[0,0,100]);
 const vocab=['he','is','a','an','good','boy','honest','the'];const bow=s=>{const words=s.toLowerCase().match(/[a-z]+/g);return vocab.map(w=>words.filter(v=>v===w).length);};assert.deepEqual(bow('He is a good boy. An honest boy is good.'),[1,2,1,1,2,2,1,0]);assert.deepEqual(bow('He is an honest boy. The good boy is honest.'),[1,2,0,1,1,2,2,1]);
 for(let cp=0x80;cp<=0x7ff;cp++)assert.deepEqual([192+Math.floor(cp/64),128+cp%64],[...new TextEncoder().encode(String.fromCodePoint(cp))]);
});
test('B19 verifies both original expressions and bound parameters in memory only',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec("CREATE TABLE users(username TEXT,password TEXT); INSERT INTO users VALUES ('admin','secret-hash');");
  for(const [input,expected]of [["admin' --",1],["admin' AND '1'='2' --",0]]){
   assert.equal(db.prepare(`SELECT * FROM users WHERE username = '${input}' AND password = 'empty-hash'`).all().length,expected);
   assert.equal(db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').all(input,'empty-hash').length,0);
  }
 }finally{db.close();}
});
