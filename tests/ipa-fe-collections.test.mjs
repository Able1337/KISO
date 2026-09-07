import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ipaFeCollections} from '../app/ipa-fe-collections-lessons.ts';
import {ipaLesson} from '../app/ipa-lessons.ts';
import {lessonCoverage} from '../lib/lesson-coverage.ts';
import {makeAttempt,answerQuestion,completeSection,startNextPart,expireAttempt,navigateQuestion,secondsRemaining,summarize,isAttempt,readStorage,storageKey} from '../lib/exam-session.ts';
const packs=Object.keys(ipaFeCollections).map(id=>JSON.parse(readFileSync(new URL(`../data/exams/${id}.json`,import.meta.url))));
// Transcribed separately from the official answer PDFs, not from lesson records.
const keys={
 2022:[['d d d a b d b c d c c b d d d a d d d d','a b a b a d b d a a d a c c b a d b b b','c d c d b d d b a a d a d d b d c b b c'].join(' ').replaceAll(' ',''),'fcfdea fdcf adcha hfddf'.replaceAll(' ','')],
 2023:['ccddbcbdccdc dcdbccda'.replaceAll(' ',''),'ahddda'],
 2024:['cdbdcacc cdcdccddadda'.replaceAll(' ',''),'bddbec'],
 2025:['dbbcacddcacddd cdbddb'.replaceAll(' ',''),'fabh eh'.replaceAll(' ','')],
};
test('IPA FE sample and archives: exact counts, official keys, hashes, original numbering and proportional timers',()=>{
 for(const p of packs){
  const sample=p.year===2022;
  assert.equal(p.questions.length,sample?80:26);
  assert.equal(p.durationSeconds,sample?11400:3600);
  assert.equal(p.demonstration,sample);assert.equal(p.publishedSubset,!sample);
  assert.equal(p.timingBasis,sample?'official-format':'proportional-practice');
  assert.equal(p.originalLanguage,'ja');assert.deepEqual(p.translations,[]);
  if(sample)assert.equal(p.publicationDate,'2022-12-26');
  assert.equal(new Set(p.questions.map(q=>q.id)).size,p.questions.length);
  for(const [i,part]of p.parts.entries()){
   const qs=p.questions.filter(q=>q.part===part.id);
   assert.equal(qs.length,part.questionCount);
   assert.equal(part.durationSeconds,qs.length*(i===0?90:300));
   assert.deepEqual(qs.map(q=>q.number),Array.from({length:qs.length},(_,i)=>i+1));
   assert.equal(qs.map(q=>q.answerId).join(''),keys[p.year][i],`${p.id} ${part.id}`);
   for(const [path,sha]of [[part.questionPdf,part.sourceSha256],[part.answerPdf,part.answerSha256]])assert.equal(createHash('sha256').update(readFileSync(new URL('../public/'+path,import.meta.url))).digest('hex'),sha);
  }
  for(const q of p.questions){
   assert.ok(q.source.includes(String(p.year)));assert.ok(q.options.some(o=>o.id===q.answerId));
   assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);
   for(const asset of [...q.promptPages,...q.options.map(o=>o.image)]){assert.ok(existsSync(new URL('../public/'+asset.src,import.meta.url)));assert.ok(asset.width>20&&asset.height>15);}
  }
 }
 assert.equal(packs.reduce((n,p)=>n+p.questions.length,0),158);
 assert.equal(new Set(packs.map(storageKey)).size,4);
});
test('158 IPA FE lessons: bank-aware routing, exact keys, substantive distinct RU EN JA lessons',()=>{
 for(const p of packs){
  const entries=ipaFeCollections[p.id];
  assert.equal(lessonCoverage[p.id],p.questions.length);assert.equal(p.lessonsReady,true);
  for(const part of ['A','B']){
   assert.equal(new Set(entries[part].map(e=>e[0])).size,entries[part].length);
   for(const q of p.questions.filter(q=>q.part===part)){
    const e=entries[part].find(e=>e[0]===q.number);assert.ok(e, q.id);assert.equal(e[1],q.answerId,q.id);
    const details=[];
    for(const lang of ['ru','en','ja']){
     const lesson=ipaLesson('FE',part,q.number,lang,p.id);assert.ok(lesson,q.id);
     assert.ok(lesson.core.length>(lang==='ja'?5:10),`${q.id} ${lang}`);assert.ok(lesson.detail.length>100,`${q.id} ${lang}`);
     assert.ok(lesson.search.length>6);assert.ok(lesson.next.length>12);
     assert.doesNotMatch(lesson.detail,/TODO|125\?|TBD|ещё готовится|official result is 120/);
     if(lang!=='ru')assert.doesNotMatch(lesson.detail,/[а-яё]/i);
     details.push(lesson.detail);
    }
    assert.equal(new Set(details).size,3);
   }
  }
 }
 assert.notEqual(ipaLesson('FE','A',1,'ru',packs[0].id).detail,ipaLesson('FE','A',1,'ru',packs[1].id).detail);
 assert.equal(ipaLesson('FE','A',1,'ru','ipa-fe-2099-public'),null);
 assert.equal(ipaLesson('IP',undefined,1,'ru','ipa-fe-2022-sample'),null);
});
test('all new questions and wrong options: three modes, navigation, untimed break and independent clocks',()=>{
 for(const pack of packs)for(const mode of ['learn','mock','exam']){
  let a=makeAttempt(pack,mode,1000);
  assert.equal(secondsRemaining(a,1000),mode==='exam'?pack.parts[0].durationSeconds:null);
  for(const [index,q]of pack.questions.entries()){
   if(q.part==='B'&&a.stage==='A'){
    a=completeSection(pack,a,2000);assert.equal(a.stage,'break');assert.equal(a.deadline,null);
    assert.equal(expireAttempt(pack,a,1e8),a);
    a=startNextPart(pack,a,1e8);assert.equal(secondsRemaining(a,1e8),mode==='exam'?pack.parts[1].durationSeconds:null);
   }
   const now=a.stage==='A'?1500:1e8+1;
   a=navigateQuestion(pack,a,index,now);assert.equal(a.index,index);
   for(const wrong of q.options.filter(o=>o.id!==q.answerId)){
    const b=answerQuestion(pack,a,q.id,wrong.id,now);
    assert.equal(b.answers[q.id],wrong.id);assert.equal(summarize(pack,b).correct,0);
    if(mode==='learn')assert.equal(answerQuestion(pack,b,q.id,q.answerId,now),b);
    for(const lang of ['ru','en','ja'])assert.equal(ipaLesson('FE',q.part,q.number,lang,pack.id).core,ipaFeCollections[pack.id][q.part].find(e=>e[0]===q.number)[lang==='ru'?2:lang==='en'?3:4][0]);
   }
   assert.ok(a.orders[q.id].every((id,i)=>id!==q.options[i].id));
  }
  a=completeSection(pack,a,1e8+2);assert.equal(a.status,'finished');assert.ok(isAttempt(a,pack));
  assert.deepEqual(readStorage(JSON.stringify({version:1,active:null,history:[a]}),pack).history,[a]);
 }
});
test('sample A arithmetic examples and archive critical paths independently calculated',()=>{
 assert.equal(parseInt('101.101'.split('.')[0],2)+.5+.125,5.625);
 assert.equal(4600/(4600+400),.92);assert.equal(1e9*8*1.2/(40e6*300),.8);
 assert.equal((300000+100000)/(500-100)/20/10,5);
 const upper=30+5,middle=Math.max(30+30,upper),lower=Math.max(30+20,middle);
 assert.equal(Math.max(upper+40,middle+25,lower+30)+30,120);
 const afterB=Math.max(3+6,3+5),beforeD=Math.max(3+14,afterB+8,afterB+11);
 assert.equal(Math.max(beforeD+6,afterB+15)+5,31);
 assert.deepEqual([88*140/154,66*14/154],[80,6]);
});
test('archive algorithms: prime bounds, calls, partition, hash, cosine, binary conversion, graph, merge and lift',()=>{
 const primes=[];for(let i=2;i<=25;i++){let ok=true;for(let j=2;j<=Math.floor(Math.sqrt(i));j++)if(i%j===0){ok=false;break;}if(ok)primes.push(i);}
 assert.deepEqual(primes,[2,3,5,7,11,13,17,19,23]);
 let output='';const p3=()=>{output+='C';},p1=()=>{output+='A';p3();},p2=()=>{p3();output+='B';p1();};p2();assert.equal(output,'CBAC');
 const data=[2,1,3,5,4];let i=0,j=4;while(data[i]<3)i++;while(data[j]>3)j--;assert.equal(i,j);assert.deepEqual(data,[2,1,3,5,4]);
 const slots=Array(5).fill(-1);for(const v of [3,18,11]){let pos=v%5;if(slots[pos]!==-1)pos=(v+3)%5;assert.equal(slots[pos],-1);slots[pos]=v;}assert.deepEqual(slots,[-1,18,-1,3,11]);
 const cosine=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0)/(Math.hypot(...a)*Math.hypot(...b));assert.ok(Math.abs(cosine([1,0],[1,1])-1/Math.sqrt(2))<1e-12);
 for(let n=0;n<256;n++){let v=0;for(const bit of n.toString(2))v=v*2+Number(bit);assert.equal(v,n);}
 const matrix=Array.from({length:5},()=>Array(5).fill(0));for(const [u,v]of [[1,3],[1,4],[3,4],[2,4],[4,5]])matrix[u-1][v-1]=matrix[v-1][u-1]=1;
 assert.deepEqual(matrix.map(r=>r.reduce((a,b)=>a+b,0)),[2,1,2,4,1]);
 let x=0,y=0;const a=[2,3],b=[1,4];while(x<a.length&&y<b.length){if(a[x]<b[y])x++;else y++;}assert.equal(b.length-y,1);
 const orders=[['A','B','D'],['A','D'],['A'],['A','B','E'],['B'],['C','E']];
 const freq=v=>orders.filter(o=>o.includes(v)).length,lift=v=>orders.filter(o=>o.includes('A')&&o.includes(v)).length*orders.length/(freq('A')*freq(v));
 assert.deepEqual(['B','D','E'].map(lift),[1,1.5,.75]);
});
test('2025 B exhaustive multiple counts, coin combinations, stack and substring trace',()=>{
 for(let n=1;n<=100;n++)for(let m=n+11;m<n+40;m++){
  let first=n;for(let k=0;k<3;k++){if(first%4===0)break;first++;}let count=0;for(let j=first;j<=m;j+=4)count++;
  assert.equal(count,Math.floor(m/4)-Math.floor((n-1)/4));
 }
 for(let n=11;n<=100;n++){let count=0;for(let rest=n;rest>=0;rest-=10)count+=Math.floor(rest/5)+1;let brute=0;for(let ten=0;ten*10<=n;ten++)for(let five=0;ten*10+five*5<=n;five++)brute++;assert.equal(count,brute);}
 const stack=[4,3,undefined,undefined];let pos=2;stack[pos++]=9;assert.equal(stack[--pos],9);assert.equal(stack[--pos],3);
 const data='ababcabc',pattern='abc',success=[];let comparisons=0;for(let i=0;i<=data.length-pattern.length;i++){let n=0;for(let j=0;j<pattern.length;j++){comparisons++;if(data[i+j]!==pattern[j])break;n++;}success.push(n);}
 assert.deepEqual(success,[2,0,3,0,0,3]);assert.equal(success.reduce((a,b)=>a+b),8);assert.equal(comparisons,12);
 assert.equal(4+.25+.25,4.5);
});
test('2025 A SQL IN versus AND, INTERSECT and BETWEEN on a disposable database',()=>{
 const db=new DatabaseSync(':memory:');
 try{db.exec("CREATE TABLE product(id TEXT,supplier TEXT); INSERT INTO product VALUES ('S001','M001'),('S002','M002'),('S003','M003'),('S004','M003'),('S005','M004'),('S006','M004')");
  const rows=where=>db.prepare('SELECT id FROM product WHERE '+where).all().map(r=>r.id);
  assert.deepEqual(rows("supplier IN ('M002','M004')"),['S002','S005','S006']);
  assert.deepEqual(rows("supplier='M002' OR supplier='M004'"),rows("supplier IN ('M002','M004')"));
  assert.deepEqual(rows("supplier='M002' AND supplier='M004'"),[]);
  assert.equal(rows("supplier BETWEEN 'M002' AND 'M004'").length,5);
  assert.deepEqual(db.prepare("SELECT * FROM product WHERE supplier='M002' INTERSECT SELECT * FROM product WHERE supplier='M004'").all(),[]);
 }finally{db.close();}
});
test('sample algorithms: sequential assignment, conversion, GCD, bit reversal, factorial, traversal, ranks and UTF-8',()=>{
 let x=1,y=2,z=3;x=y;y=z;z=x;assert.deepEqual([y,z],[3,2]);
 for(let n=1;n<100;n++){let j=n;const bits=[];for(let k=0;k<8;k++){bits.push(j%2);j=Math.floor(j/2);}assert.equal(parseInt(bits.reverse().join(''),2),n);}
 for(let n=0;n<256;n++){
  assert.equal(((n^255)+1)&255,(256-n)%256);
  let src=n,result=0;for(let k=0;k<8;k++){result=(result<<1)|(src&1);src>>=1;}
  assert.equal(result,parseInt(n.toString(2).padStart(8,'0').split('').reverse().join(''),2));
 }
 let sum=0;assert.deepEqual([3,2,1,6,5,4].map(n=>sum+=n),[3,5,6,12,17,21]);
 const gcd=(a,b)=>{while(a!==b){if(a>b)a-=b;else b-=a;}return a;};assert.equal(gcd(18,12),6);
 assert.equal(Math.pow(Math.pow(3,2)+Math.pow(4,2),.5),5);
 const fac=n=>n===0?1:n*fac(n-1);assert.equal(fac(4),24);
 const sequence=[];const visit=n=>{if(n>14)return;visit(2*n);sequence.push(n);visit(2*n+1);};visit(1);
 assert.deepEqual(sequence,[8,4,9,2,10,5,11,1,12,6,13,3,14,7]);
 assert.deepEqual([0,.25,.5,.75,1].map(p=>Math.ceil(9*p)+1),[1,4,6,8,10]);
 for(let cp=0x800;cp<=0xffff;cp++){
  if(cp>=0xd800&&cp<=0xdfff)continue;
  const bytes=[224+Math.floor(cp/4096),128+Math.floor(cp/64)%64,128+cp%64];
  assert.deepEqual(bytes,[...Buffer.from(String.fromCodePoint(cp),'utf8')]);
 }
});
